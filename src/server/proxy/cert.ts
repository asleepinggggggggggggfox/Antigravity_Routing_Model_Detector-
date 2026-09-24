import forge from 'node-forge';
import fs from 'fs';
import path from 'path';

const CERTS_DIR = path.resolve(process.cwd(), '.certs');
const CA_KEY_PATH = path.join(CERTS_DIR, 'ca.key');
const CA_CERT_PATH = path.join(CERTS_DIR, 'ca.pem');

const pki = forge.pki;

export interface CertPair {
  key: string;
  cert: string;
}

export class CertManager {
  private caKey!: forge.pki.rsa.PrivateKey;
  private caCert!: forge.pki.Certificate;
  private certCache: Map<string, CertPair> = new Map();

  constructor() {
    this.initCA();
  }

  public getCACertPath(): string {
    return CA_CERT_PATH;
  }

  public getCACertPEM(): string {
    return fs.readFileSync(CA_CERT_PATH, 'utf-8');
  }

  private initCA(): void {
    if (!fs.existsSync(CERTS_DIR)) {
      fs.mkdirSync(CERTS_DIR, { recursive: true });
    }

    if (fs.existsSync(CA_KEY_PATH) && fs.existsSync(CA_CERT_PATH)) {
      const keyPem = fs.readFileSync(CA_KEY_PATH, 'utf-8');
      const certPem = fs.readFileSync(CA_CERT_PATH, 'utf-8');
      this.caKey = pki.privateKeyFromPem(keyPem);
      this.caCert = pki.certificateFromPem(certPem);
      return;
    }

    // Generate new CA
    const keys = pki.rsa.generateKeyPair(2048);
    const cert = pki.createCertificate();

    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01' + Date.now().toString(16);
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

    const attrs = [
      { name: 'commonName', value: 'Antigravity Routing Model Detector Root CA' },
      { name: 'countryName', value: 'CN' },
      { shortName: 'ST', value: 'Beijing' },
      { name: 'localityName', value: 'Beijing' },
      { name: 'organizationName', value: 'Antigravity Detector' },
      { shortName: 'OU', value: 'MITM Security Inspection' }
    ];

    cert.setSubject(attrs);
    cert.setIssuer(attrs);

    cert.setExtensions([
      { name: 'basicConstraints', cA: true, critical: true },
      {
        name: 'keyUsage',
        keyCertSign: true,
        cRLSign: true,
        digitalSignature: true,
        critical: true
      }
    ]);

    cert.sign(keys.privateKey, forge.md.sha256.create());

    this.caKey = keys.privateKey;
    this.caCert = cert;

    fs.writeFileSync(CA_KEY_PATH, pki.privateKeyToPem(keys.privateKey));
    fs.writeFileSync(CA_CERT_PATH, pki.certificateToPem(cert));
  }

  public getCertForHost(hostname: string): CertPair {
    const cached = this.certCache.get(hostname);
    if (cached) {
      return cached;
    }

    const keys = pki.rsa.generateKeyPair(2048);
    const cert = pki.createCertificate();

    cert.publicKey = keys.publicKey;
    cert.serialNumber = Date.now().toString(16);
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setDate(cert.validity.notBefore.getDate() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 2);

    const attrs = [
      { name: 'commonName', value: hostname },
      { name: 'organizationName', value: 'Antigravity Intercepted' }
    ];

    cert.setSubject(attrs);
    cert.setIssuer(this.caCert.subject.attributes);

    cert.setExtensions([
      { name: 'basicConstraints', cA: false },
      {
        name: 'keyUsage',
        digitalSignature: true,
        keyEncipherment: true
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true
      },
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: hostname },
          { type: 7, ip: '127.0.0.1' }
        ]
      }
    ]);

    cert.sign(this.caKey, forge.md.sha256.create());

    const pair: CertPair = {
      key: pki.privateKeyToPem(keys.privateKey),
      cert: pki.certificateToPem(cert)
    };

    this.certCache.set(hostname, pair);
    return pair;
  }
}
