import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  Brain,
  Gauge,
  Terminal,
  Shield,
  FileCheck,
  Send,
  Sliders
} from 'lucide-react';
import { VerificationMethodItem, ProbeType } from '../../types/detector';

interface VerificationSuiteProps {
  methods: VerificationMethodItem[];
  onRunProbe: (type: ProbeType, customPrompt?: string) => Promise<void>;
}

export const VerificationSuite: React.FC<VerificationSuiteProps> = ({
  methods,
  onRunProbe
}) => {
  const [runningType, setRunningType] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const handleRun = async (type: ProbeType, prompt?: string) => {
    setRunningType(type);
    await onRunProbe(type, prompt);
    setRunningType(null);
  };

  const getMethodIcon = (id: string) => {
    switch (id) {
      case 'method_runtime_log':
        return <Terminal className="w-4 h-4 text-indigo-600" />;
      case 'method_settings_sync':
        return <FileCheck className="w-4 h-4 text-blue-600" />;
      case 'method_mitm_stream':
        return <Shield className="w-4 h-4 text-cyan-600" />;
      case 'method_thinking_depth':
        return <Brain className="w-4 h-4 text-amber-600" />;
      case 'method_knowledge_cutoff':
        return <Sparkles className="w-4 h-4 text-violet-600" />;
      case 'method_latency_tps':
        return <Gauge className="w-4 h-4 text-emerald-600" />;
      default:
        return <Sliders className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            实时生效中
          </span>
        );
      case 'passed':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            探针已验证
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            待确认
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" />
            就绪
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 6 Verification Methods Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 rounded bg-indigo-600" />
            <h3 className="font-bold text-base text-slate-900">多维交叉验证矩阵 (6-Dimension Verification Matrix)</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            综合多维通道实时交叉印证模型身份
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {methods.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold text-xs text-slate-800">
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      {getMethodIcon(m.id)}
                    </div>
                    <span>{m.name}</span>
                  </div>
                  {getStatusBadge(m.status)}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {m.description}
                </p>
              </div>

              {/* Evidence line */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono truncate max-w-[190px]" title={m.evidence}>
                  证据: {m.evidence}
                </span>
                <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                  +{m.confidenceContribution}% 权重
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Active Probe Console */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-900">主动特征探针工具箱 (Active Probe Toolkit)</h3>
          </div>
          <span className="text-xs text-slate-500">
            点击以下预置探针可立即向模型指纹引擎发送专属探测指令
          </span>
        </div>

        {/* 4 Preset Probe Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Probe 1 */}
          <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>1. 身份与指令指纹探针</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                验证 Google 内置指令格式、身份回声与安全规则边界。
              </p>
            </div>
            <button
              onClick={() => handleRun('identity')}
              disabled={runningType !== null}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 shadow-xs transition active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {runningType === 'identity' ? '验证中...' : '发起身份探测'}
            </button>
          </div>

          {/* Probe 2 */}
          <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                <Brain className="w-3.5 h-3.5 text-amber-600" />
                <span>2. 思维链与推理深度探针</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                构造多阶段逻辑推演任务，精准判定 High/Low 思考深度。
              </p>
            </div>
            <button
              onClick={() => handleRun('thinking_depth')}
              disabled={runningType !== null}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 shadow-xs transition active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {runningType === 'thinking_depth' ? '验证中...' : '验证思维链'}
            </button>
          </div>

          {/* Probe 3 */}
          <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>3. 知识库截止期探针</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                测试 2024-2025 年关键科技与编码范式，区分模型代际。
              </p>
            </div>
            <button
              onClick={() => handleRun('knowledge_cutoff')}
              disabled={runningType !== null}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 shadow-xs transition active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {runningType === 'knowledge_cutoff' ? '验证中...' : '验证知识截止期'}
            </button>
          </div>

          {/* Probe 4 */}
          <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                <span>4. 时延与 TPS 吞吐基准</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                测算首字输出时间 TTFT 与 Token 生成速率，比对硬件特征。
              </p>
            </div>
            <button
              onClick={() => handleRun('latency_benchmark')}
              disabled={runningType !== null}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 shadow-xs transition active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {runningType === 'latency_benchmark' ? '测算中...' : '测算 TPS 吞吐'}
            </button>
          </div>
        </div>

        {/* Custom Prompt Interactive Box */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            自定义探针提示词 (Custom Probe Prompt)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="输入任何特定测试提问（例如：'请用 Python 写一段快速排序并展示思考过程'）"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
            <button
              onClick={() => handleRun('custom', customPrompt)}
              disabled={runningType !== null}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>发送探测</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
