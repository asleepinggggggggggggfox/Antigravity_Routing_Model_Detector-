import React, { useState } from 'react';
import { Sparkles, Brain, Gauge, FileCheck, Layers } from 'lucide-react';
import { DetectorState, ProbeType } from '../../types/detector';

interface ModelHeroCardProps {
  state: DetectorState;
  onRunProbe: (type: ProbeType) => Promise<void>;
}

export const ModelHeroCard: React.FC<ModelHeroCardProps> = ({ state, onRunProbe }) => {
  const [runningType, setRunningType] = useState<string | null>(null);
  const isHighThinking = state.activeModel.includes('High') || state.activeModel.includes('Pro');

  const handleProbe = async (type: ProbeType) => {
    setRunningType(type);
    await onRunProbe(type);
    setRunningType(null);
  };

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
      {/* Gentle ambient gradient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-50/80 via-sky-50/40 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Top Row: Model Name & Status */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              当前活跃调度模型
            </span>
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {state.activeModel}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>{state.activeConfidence}% 置信度</span>
            </span>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 font-medium">
            <Brain className={`w-3.5 h-3.5 ${isHighThinking ? 'text-amber-500' : 'text-slate-400'}`} />
            <span>{isHighThinking ? '深度思维链推理 (High)' : '极速补全模式'}</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 font-medium">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>双轨无感监听</span>
          </span>
        </div>
      </div>

      {/* Bottom Row: Quick Verification Pills */}
      <div className="relative z-10 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium mr-1">快捷特征探测:</span>

        <button
          onClick={() => handleProbe('identity')}
          disabled={runningType !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200/80 border border-slate-200/80 text-slate-700 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>{runningType === 'identity' ? '验证中...' : '身份指纹'}</span>
        </button>

        <button
          onClick={() => handleProbe('thinking_depth')}
          disabled={runningType !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200/80 border border-slate-200/80 text-slate-700 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <Brain className="w-3.5 h-3.5 text-amber-500" />
          <span>{runningType === 'thinking_depth' ? '验证中...' : '思维链深度'}</span>
        </button>

        <button
          onClick={() => handleProbe('knowledge_cutoff')}
          disabled={runningType !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200/80 border border-slate-200/80 text-slate-700 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <FileCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>{runningType === 'knowledge_cutoff' ? '验证中...' : '知识截止期'}</span>
        </button>

        <button
          onClick={() => handleProbe('latency_benchmark')}
          disabled={runningType !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200/80 border border-slate-200/80 text-slate-700 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <Gauge className="w-3.5 h-3.5 text-emerald-500" />
          <span>{runningType === 'latency_benchmark' ? '测算中...' : '时延与速率'}</span>
        </button>
      </div>
    </div>
  );
};
