import fs from 'fs';
import path from 'path';
import os from 'os';
import chokidar from 'chokidar';

export interface WatcherEvents {
  onModelOverride: (model: string, source: string) => void;
  onRequestDiscovered: (url: string, traceId?: string, responseId?: string) => void;
  onProcessStatus: (running: boolean, pid?: number, file?: string) => void;
}

export class AgyWatcher {
  private baseDir: string;
  private logDir: string;
  private settingsFile: string;
  private historyFile: string;
  private currentActiveModel: string = 'Gemini 3.8 Flash (High)';
  private lastReadPositions: Map<string, number> = new Map();
  private watcher: chokidar.FSWatcher | null = null;
  private events: WatcherEvents;
  private lastPid?: number;

  constructor(events: WatcherEvents) {
    this.events = events;
    const userHome = os.homedir();
    this.baseDir = path.join(userHome, '.gemini', 'antigravity-cli');
    this.logDir = path.join(this.baseDir, 'log');
    this.settingsFile = path.join(this.baseDir, 'settings.json');
    this.historyFile = path.join(this.baseDir, 'history.jsonl');

    this.readInitialSettings();
  }

  public getCurrentActiveModel(): string {
    return this.currentActiveModel;
  }

  public getLastPid(): number | undefined {
    return this.lastPid;
  }

  private readInitialSettings(): void {
    try {
      if (fs.existsSync(this.settingsFile)) {
        const data = fs.readFileSync(this.settingsFile, 'utf-8');
        const parsed = JSON.parse(data);
        if (parsed.model) {
          this.currentActiveModel = parsed.model;
          this.events.onModelOverride(this.currentActiveModel, 'settings.json');
        }
      }
    } catch {
      // Ignored
    }
  }

  public start(): void {
    if (!fs.existsSync(this.logDir)) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
      } catch {
        // Ignored
      }
    }

    // Scan the latest log file on startup
    this.scanLatestLogFile();

    // Watch log directory & settings file
    const pathsToWatch = [this.logDir, this.settingsFile];
    this.watcher = chokidar.watch(pathsToWatch, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 150,
        pollInterval: 50
      }
    });

    this.watcher.on('add', (filePath: string) => {
      if (filePath.endsWith('.log')) {
        this.processLogFile(filePath);
      }
    });

    this.watcher.on('change', (filePath: string) => {
      if (filePath === this.settingsFile) {
        this.readInitialSettings();
      } else if (filePath.endsWith('.log')) {
        this.processLogFile(filePath);
      }
    });
  }

  private scanLatestLogFile(): void {
    try {
      if (!fs.existsSync(this.logDir)) return;
      const files = fs.readdirSync(this.logDir)
        .filter(f => f.endsWith('.log'))
        .map(f => ({
          name: f,
          fullPath: path.join(this.logDir, f),
          time: fs.statSync(path.join(this.logDir, f)).mtimeMs
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 0) {
        this.processLogFile(files[0].fullPath);
      }
    } catch (err) {
      console.error('[AgyWatcher] Error scanning latest log file:', err);
    }
  }

  private processLogFile(filePath: string): void {
    try {
      if (!fs.existsSync(filePath)) return;
      const stats = fs.statSync(filePath);
      const lastPos = this.lastReadPositions.get(filePath) || 0;

      if (stats.size < lastPos) {
        // File was truncated or reset
        this.lastReadPositions.set(filePath, 0);
      }

      const stream = fs.createReadStream(filePath, {
        start: lastPos,
        end: stats.size,
        encoding: 'utf-8'
      });

      let content = '';
      stream.on('data', (chunk) => {
        content += chunk;
      });

      stream.on('end', () => {
        this.lastReadPositions.set(filePath, stats.size);
        if (content.length > 0) {
          this.parseLogLines(content, filePath);
        }
      });
    } catch (err) {
      console.error('[AgyWatcher] Error reading log file:', err);
    }
  }

  private parseLogLines(content: string, filePath: string): void {
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      if (!line) continue;

      // Match Language Server PID
      const pidMatch = line.match(/Starting language server process with pid (\d+)/);
      if (pidMatch) {
        this.lastPid = parseInt(pidMatch[1], 10);
        this.events.onProcessStatus(true, this.lastPid, path.basename(filePath));
      }

      // Match model override
      const modelMatch = line.match(/Propagating selected model override to backend: label="([^"]+)"/);
      if (modelMatch) {
        const modelName = modelMatch[1];
        this.currentActiveModel = modelName;
        this.events.onModelOverride(modelName, `agy 日志流 (${path.basename(filePath)})`);
      }

      // Match streamGenerateContent URL & traces
      const urlMatch = line.match(/URL:\s*(https?:\/\/[^\s]+)(?:\s+Trace:\s*([^\s]+))?(?:\s+ResponseID:\s*([^\s]+))?/);
      if (urlMatch) {
        const url = urlMatch[1];
        const trace = urlMatch[2];
        const respId = urlMatch[3];
        this.events.onRequestDiscovered(url, trace, respId);
      }
    }
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
