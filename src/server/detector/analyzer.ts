import { KNOWN_MODELS, ModelFingerprint } from './fingerprints';
import { FingerprintMatch, ModelDetails } from '../../types/detector';

export interface AnalysisInput {
  endpoint: string;
  requestBody?: string | any;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  durationMs?: number;
  tokensGenerated?: number;
  thinkingContent?: string;
  logOverrideModel?: string;
}

export interface AnalysisResult {
  detectedModel: string;
  confidence: number;
  detectionBasis: string[];
  fingerprintMatches: FingerprintMatch[];
  modelDetails: ModelDetails;
}

export class ModelAnalyzer {
  public analyze(input: AnalysisInput): AnalysisResult {
    const basis: string[] = [];
    const matches: FingerprintMatch[] = [];
    let detectedModel = 'Unknown Routing Model';
    let confidence = 30;

    let requestedModelStr = '';
    let thinkingBudget: number | undefined;
    let temperature: number | undefined;

    // 1. Parse request body if available
    let parsedJson: any = null;
    if (typeof input.requestBody === 'string') {
      try {
        parsedJson = JSON.parse(input.requestBody);
      } catch {
        // Not JSON
      }
    } else if (typeof input.requestBody === 'object' && input.requestBody !== null) {
      parsedJson = input.requestBody;
    }

    if (parsedJson) {
      if (parsedJson.model) {
        requestedModelStr = String(parsedJson.model);
        basis.push(`请求显式声明 Model 参数: "${requestedModelStr}"`);
      }
      if (parsedJson.generationConfig) {
        if (parsedJson.generationConfig.temperature !== undefined) {
          temperature = parsedJson.generationConfig.temperature;
        }
        if (parsedJson.generationConfig.thinkingConfig?.thinkingBudget !== undefined) {
          thinkingBudget = parsedJson.generationConfig.thinkingConfig.thinkingBudget;
          basis.push(`检测到思考预算配置 (Thinking Budget): ${thinkingBudget}`);
        }
      }
    }

    // 2. Check Log Override (from agy Runtime Watcher)
    if (input.logOverrideModel) {
      basis.push(`本地 agy 运行时日志截获激活模型: "${input.logOverrideModel}"`);
      detectedModel = input.logOverrideModel;
      confidence = Math.max(confidence, 96);
    }

    // 3. Inspect headers for Google backend routing headers
    if (input.responseHeaders) {
      for (const [key, value] of Object.entries(input.responseHeaders)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('model') || lowerKey.includes('goog-endpoint')) {
          basis.push(`后端响应 Header 路由线索: ${key} = ${value}`);
          if (!input.logOverrideModel) {
            requestedModelStr = requestedModelStr || value;
          }
        }
      }
    }

    // 4. Match against Known Fingerprints
    for (const model of KNOWN_MODELS) {
      let score = 0;
      const matchDetails: string[] = [];

      // Keyword / Pattern matching
      for (const kw of model.keywords) {
        if (
          requestedModelStr.toLowerCase().includes(kw.toLowerCase()) ||
          (input.logOverrideModel && input.logOverrideModel.toLowerCase().includes(kw.toLowerCase()))
        ) {
          score += 60;
          matchDetails.push(`命中关键词: "${kw}"`);
          break;
        }
      }

      for (const pattern of model.patterns) {
        if (
          pattern.test(requestedModelStr) ||
          (input.logOverrideModel && pattern.test(input.logOverrideModel))
        ) {
          score += 30;
          matchDetails.push(`正则规则命中: ${pattern.source}`);
          break;
        }
      }

      // Thinking capability matching
      if (input.thinkingContent && input.thinkingContent.trim().length > 0) {
        if (model.thinkingSupport) {
          score += 20;
          matchDetails.push(`存在思维链推理过程 (${input.thinkingContent.length} 字符)，符合高深度思考特征`);
        } else {
          score -= 30;
        }
      }

      // Latency / TTFT matching if available
      if (input.durationMs && input.tokensGenerated && input.tokensGenerated > 5) {
        const tps = (input.tokensGenerated / (input.durationMs / 1000));
        if (tps >= model.typicalSpeedTpsRange[0] && tps <= model.typicalSpeedTpsRange[1]) {
          score += 15;
          matchDetails.push(`生成速度 ${Math.round(tps)} tps 在该模型基准区间 [${model.typicalSpeedTpsRange.join('-')}] 内`);
        }
      }

      const isMatched = score >= 50;
      if (isMatched && score > confidence) {
        confidence = Math.min(99, score);
        detectedModel = model.name;
      }

      matches.push({
        name: model.name,
        matched: isMatched,
        score: Math.min(100, Math.max(0, score)),
        detail: matchDetails.join('; ') || '无明显特征命中'
      });
    }

    // If still unknown but we have requestedModelStr
    if (detectedModel === 'Unknown Routing Model' && requestedModelStr) {
      detectedModel = requestedModelStr;
      confidence = 75;
      basis.push(`提取自后端请求 URL 或载荷字段: ${requestedModelStr}`);
    }

    // Thinking depth annotation
    if (input.thinkingContent && !detectedModel.includes('(High)') && !detectedModel.includes('(Low)')) {
      if (thinkingBudget && thinkingBudget > 2048) {
        detectedModel += ' (High Reasoning)';
      }
    }

    const modelDetails: ModelDetails = {
      requestedModel: requestedModelStr || detectedModel,
      backendResolvedModel: detectedModel,
      temperature,
      thinkingBudget,
      durationMs: input.durationMs
    };

    return {
      detectedModel,
      confidence,
      detectionBasis: basis.length > 0 ? basis : ['基于网络传输流特征及本地运行状态综合判定'],
      fingerprintMatches: matches,
      modelDetails
    };
  }
}
