import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Sparkles
} from 'lucide-react';
import { CapturedRequest } from '../../types/detector';

interface PayloadInspectorProps {
  request: CapturedRequest | null;
}

export const PayloadInspector: React.FC<PayloadInspectorProps> = ({ request }) => {
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 text-center text-slate-400">
        <FileText className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-xs text-slate-500">点击左侧任意记录查看模型判定依据与详情</p>
      </div>
    );
  }

  const copyPayload = () => {
    navigator.clipboard.writeText(request.rawRequestPayload || request.requestSummary.promptSnippet || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/40">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
            判定模型
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h3 className="text-lg font-bold font-mono text-slate-900">
              {request.detectedModel}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
              {request.confidence}% 置信度
            </span>
          </div>
        </div>

        <div className="text-right text-xs text-slate-400 font-mono">
          <span>{new Date(request.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Detection Basis */}
        <div className="space-y-1.5">
          <span className="font-semibold text-slate-700 block">判定依据与溯源:</span>
          <div className="space-y-1 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
            {request.detectionBasis.map((b, i) => (
              <div key={i} className="flex items-start gap-1.5 text-slate-700">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt */}
        {request.requestSummary.promptSnippet && (
          <div className="space-y-1">
            <span className="font-semibold text-slate-700 block">Prompt 提问摘要:</span>
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 font-mono text-slate-800 max-h-28 overflow-y-auto whitespace-pre-wrap">
              {request.requestSummary.promptSnippet}
            </div>
          </div>
        )}

        {/* Thinking Process if any */}
        {request.responseSummary.thinkingContent && (
          <div className="space-y-1">
            <span className="font-semibold text-amber-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              思考链推理 (Thinking Content):
            </span>
            <div className="bg-amber-50/60 rounded-lg p-2.5 border border-amber-200/80 font-mono text-amber-900 max-h-28 overflow-y-auto whitespace-pre-wrap">
              {request.responseSummary.thinkingContent}
            </div>
          </div>
        )}

        {/* Response snippet */}
        {request.responseSummary.responseSnippet && (
          <div className="space-y-1">
            <span className="font-semibold text-slate-700 block">输出摘要:</span>
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 font-mono text-slate-800 max-h-28 overflow-y-auto whitespace-pre-wrap">
              {request.responseSummary.responseSnippet}
            </div>
          </div>
        )}

        {/* Raw toggle */}
        {request.rawRequestPayload && (
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:underline cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showRaw ? '收起原始 JSON 载荷' : '展开原始 JSON 载荷'}</span>
              {showRaw ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {showRaw && (
              <div className="mt-2 relative">
                <button
                  onClick={copyPayload}
                  className="absolute right-2 top-2 px-2 py-1 rounded text-[10px] bg-slate-700 text-slate-200 hover:bg-slate-600 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? '已复制' : '复制'}</span>
                </button>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto max-h-48">
                  {request.rawRequestPayload}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
