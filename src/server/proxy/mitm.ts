import http from 'http';
import https from 'https';
import net from 'net';
import tls from 'tls';
import { CertManager } from './cert';
import { CapturedRequest } from '../../types/detector';
import { ModelAnalyzer } from '../detector/analyzer';

export interface MitmProxyOptions {
  port: number;
  certManager: CertManager;
  analyzer: ModelAnalyzer;
  getCurrentActiveModel: () => string;
  onCapturedRequest: (req: CapturedRequest) => void;
  onUpdateRequest: (req: Partial<CapturedRequest> & { id: string }) => void;
}

export class MitmProxy {
  private server: http.Server | null = null;
  private options: MitmProxyOptions;
  private isRunning: boolean = false;
  private targetHosts = [
    'daily-cloudcode-pa.googleapis.com',
    'cloudcode-pa.googleapis.com',
    'generativelanguage.googleapis.com',
    'googleapis.com'
  ];

  constructor(options: MitmProxyOptions) {
    this.options = options;
  }

  public getPort(): number {
    return this.options.port;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        // Plain HTTP proxy request
        this.handleHttpRequest(req, res);
      });

      this.server.on('connect', (req, clientSocket, head) => {
        this.handleConnect(req, clientSocket, head);
      });

      this.server.on('error', (err) => {
        console.error('[MITM Proxy] Server error:', err);
        reject(err);
      });

      this.server.listen(this.options.port, '127.0.0.1', () => {
        this.isRunning = true;
        console.log(`[MITM Proxy] Listening on http://127.0.0.1:${this.options.port}`);
        resolve();
      });
    });
  }

  private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const urlStr = req.url || '';
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlStr.startsWith('http') ? urlStr : `http://${req.headers.host}${urlStr}`);
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Bad URL');
      return;
    }

    const options: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: req.method,
      headers: req.headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', () => {
      res.writeHead(502);
      res.end('Proxy error');
    });

    req.pipe(proxyReq);
  }

  private handleConnect(req: http.IncomingMessage, clientSocket: net.Socket, head: Buffer): void {
    const [hostname, portStr] = (req.url || '').split(':');
    const port = parseInt(portStr, 10) || 443;

    const isTarget = this.targetHosts.some((h) => hostname.endsWith(h));

    if (!isTarget) {
      // Direct TCP Tunneling for non-target hosts
      const serverSocket = net.connect(port, hostname, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        if (head.length > 0) serverSocket.write(head);
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
      });

      serverSocket.on('error', () => clientSocket.destroy());
      clientSocket.on('error', () => serverSocket.destroy());
      return;
    }

    // Target Host: Intercept with dynamic TLS certificate
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');

    let certPair;
    try {
      certPair = this.options.certManager.getCertForHost(hostname);
    } catch (err) {
      console.error('[MITM] Error getting cert for', hostname, err);
      clientSocket.destroy();
      return;
    }

    const tlsServer = new https.Server({
      key: certPair.key,
      cert: certPair.cert,
      SNICallback: (servername, cb) => {
        try {
          const pair = this.options.certManager.getCertForHost(servername || hostname);
          const secureContext = tls.createSecureContext({
            key: pair.key,
            cert: pair.cert
          });
          cb(null, secureContext);
        } catch (e: any) {
          cb(e);
        }
      }
    });

    tlsServer.on('request', (subReq, subRes) => {
      this.handleDecryptedHttpsRequest(hostname, port, subReq, subRes);
    });

    tlsServer.on('clientError', (err) => {
      // Handshake or socket errors
      clientSocket.destroy();
    });

    // Feed clientSocket into tlsServer
    tlsServer.emit('connection', clientSocket);
  }

  private handleDecryptedHttpsRequest(
    hostname: string,
    port: number,
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const startTime = Date.now();
    const endpoint = req.url || '/';

    const reqChunks: Buffer[] = [];
    req.on('data', (c) => reqChunks.push(c));

    req.on('end', () => {
      const reqBodyStr = Buffer.concat(reqChunks).toString('utf-8');

      // Forward to real upstream Google API
      const headers = { ...req.headers };
      delete headers['proxy-connection'];
      delete headers['proxy-authorization'];
      headers['host'] = hostname;

      const upstreamReq = https.request(
        {
          hostname,
          port,
          path: endpoint,
          method: req.method,
          headers,
          rejectUnauthorized: true
        },
        (upstreamRes) => {
          const respChunks: Buffer[] = [];
          const responseHeaders = upstreamRes.headers as Record<string, string>;

          // Stream headers back to client
          res.writeHead(upstreamRes.statusCode || 200, upstreamRes.headers);

          let thinkingSnippet = '';
          let responseSnippet = '';
          let totalChunks = 0;

          upstreamRes.on('data', (chunk: Buffer) => {
            respChunks.push(chunk);
            totalChunks++;
            res.write(chunk);

            // Real-time SSE parsing for streamGenerateContent
            const textChunk = chunk.toString('utf-8');
            if (textChunk.includes('thought')) {
              try {
                const thoughtMatch = textChunk.match(/"thought":\s*"([^"]+)"/);
                if (thoughtMatch) {
                  thinkingSnippet += thoughtMatch[1].substring(0, 300);
                }
              } catch {
                // Ignore parse error
              }
            }
          });

          upstreamRes.on('end', () => {
            res.end();
            const durationMs = Date.now() - startTime;
            const fullRespStr = Buffer.concat(respChunks).toString('utf-8');

            if (!responseSnippet && fullRespStr.length > 0) {
              responseSnippet = fullRespStr.substring(0, 500);
            }

            // Run Analysis
            const analysis = this.options.analyzer.analyze({
              endpoint,
              requestBody: reqBodyStr,
              responseBody: fullRespStr,
              responseHeaders,
              durationMs,
              thinkingContent: thinkingSnippet,
              logOverrideModel: this.options.getCurrentActiveModel()
            });

            // Extract prompt snippet
            let promptSnippet = '';
            try {
              const reqJson = JSON.parse(reqBodyStr);
              if (reqJson.contents && Array.isArray(reqJson.contents)) {
                const lastContent = reqJson.contents[reqJson.contents.length - 1];
                if (lastContent?.parts && Array.isArray(lastContent.parts)) {
                  promptSnippet = lastContent.parts
                    .map((p: any) => p.text || '')
                    .join(' ')
                    .substring(0, 400);
                }
              }
            } catch {
              promptSnippet = reqBodyStr.substring(0, 200);
            }

            const captured: CapturedRequest = {
              id: requestId,
              timestamp: startTime,
              source: 'mitm',
              endpoint: endpoint.split('?')[0],
              method: req.method || 'POST',
              status: (upstreamRes.statusCode || 200) < 400 ? 'completed' : 'error',
              statusCode: upstreamRes.statusCode,
              detectedModel: analysis.detectedModel,
              confidence: analysis.confidence,
              detectionBasis: analysis.detectionBasis,
              modelDetails: {
                ...analysis.modelDetails,
                durationMs,
                responseId: responseHeaders['x-goog-response-id'] || responseHeaders['x-request-id']
              },
              requestSummary: {
                promptSnippet,
                totalInputTokensEstimated: Math.round(reqBodyStr.length / 4)
              },
              responseSummary: {
                responseSnippet,
                totalChunks,
                thinkingContent: thinkingSnippet
              },
              fingerprintMatches: analysis.fingerprintMatches,
              rawRequestPayload: reqBodyStr,
              rawResponsePayload: fullRespStr.substring(0, 20000)
            };

            this.options.onCapturedRequest(captured);
          });
        }
      );

      upstreamReq.on('error', (err) => {
        console.error('[MITM] Upstream error:', err);
        if (!res.headersSent) {
          res.writeHead(502);
        }
        res.end('Upstream gateway error');

        const captured: CapturedRequest = {
          id: requestId,
          timestamp: startTime,
          source: 'mitm',
          endpoint: endpoint.split('?')[0],
          method: req.method || 'POST',
          status: 'error',
          statusCode: 502,
          detectedModel: this.options.getCurrentActiveModel() || 'Gemini 3.8 Flash (High)',
          confidence: 80,
          detectionBasis: ['请求已拦截但上游转发异常，基于本地配置推断'],
          modelDetails: { durationMs: Date.now() - startTime },
          requestSummary: { promptSnippet: reqBodyStr.substring(0, 200) },
          responseSummary: { responseSnippet: `Error: ${err.message}` },
          fingerprintMatches: [],
          rawRequestPayload: reqBodyStr
        };
        this.options.onCapturedRequest(captured);
      });

      if (reqChunks.length > 0) {
        upstreamReq.write(Buffer.concat(reqChunks));
      }
      upstreamReq.end();
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.isRunning = false;
          resolve();
        });
      } else {
        this.isRunning = false;
        resolve();
      }
    });
  }
}
