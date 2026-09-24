export type DetectionSource = 'mitm' | 'log_watcher' | 'transcript' | 'probe';

export interface FingerprintMatch {
  name: string;
  matched: boolean;
  score: number;
  detail: string;
}

export interface VerificationMethodItem {
  id: string;
  name: string;
  category: 'passive' | 'active' | 'benchmark';
  status: 'active' | 'passed' | 'warning' | 'pending';
  confidenceContribution: number;
  description: string;
  evidence: string;
}

export type ProbeType =
  | 'identity'
  | 'thinking_depth'
  | 'knowledge_cutoff'
  | 'latency_benchmark'
  | 'custom';

export interface ModelDetails {
  requestedModel?: string;
  backendResolvedModel?: string;
  temperature?: number;
  maxOutputTokens?: number;
  thinkingBudget?: number;
  responseId?: string;
  traceId?: string;
  durationMs?: number;
}

export interface CapturedRequest {
  id: string;
  timestamp: number;
  source: DetectionSource;
  endpoint: string;
  method: string;
  status: 'pending' | 'completed' | 'error';
  statusCode?: number;
  detectedModel: string;
  confidence: number;
  detectionBasis: string[];
  modelDetails: ModelDetails;
  requestSummary: {
    promptSnippet?: string;
    systemInstructionSnippet?: string;
    totalInputTokensEstimated?: number;
    contentsCount?: number;
  };
  responseSummary: {
    responseSnippet?: string;
    totalChunks?: number;
    thinkingContent?: string;
  };
  fingerprintMatches: FingerprintMatch[];
  rawRequestPayload?: string;
  rawResponsePayload?: string;
}

export interface DetectorState {
  activeModel: string;
  activeConfidence: number;
  activeModelFeatures: string[];
  proxyPort: number;
  proxyRunning: boolean;
  watcherActive: boolean;
  totalIntercepted: number;
  requests: CapturedRequest[];
  verificationMethods: VerificationMethodItem[];
  agyProcessStatus: {
    running: boolean;
    pid?: number;
    lastLogFile?: string;
    lastActiveTime?: string;
  };
}

export type WsClientAction =
  | { type: 'CLEAR_REQUESTS' }
  | { type: 'TOGGLE_PROXY'; enabled: boolean }
  | { type: 'TRIGGER_PROBE_INSPECTION' };

export type WsServerMessage =
  | { type: 'INIT_STATE'; payload: DetectorState }
  | { type: 'NEW_REQUEST'; payload: CapturedRequest }
  | { type: 'UPDATE_REQUEST'; payload: Partial<CapturedRequest> & { id: string } }
  | { type: 'STATE_UPDATE'; payload: Partial<DetectorState> };
