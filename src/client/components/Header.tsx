import React, { useState } from 'react';
import { Shield, Copy, Check, Trash2, Zap } from 'lucide-react';
import { DetectorState } from '../../types/detector';

interface HeaderProps {
  state: DetectorState;
  onClear: () => void;
  onQuickProbe: () => void;
}

export const Header: React.FC<HeaderProps> = ({ state, onClear, onQuickProbe }) => {
  const [copied, setCopied] = useState(false);
  const [probing, setProbing] = useState(false);

  const copyProxyEnv = () => {
    const text = `$env:HTTP_PROXY="http://127.0.0.1:${state.proxyPort}"; $env:HTTPS_PROXY="http://127.0.0.1:${state.proxyPort}"`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProbe = async () => {
    setProbing(true);
    await onQuickProbe();
    setTimeout(() => setProbing(false), 500);
  };

  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {/* Custom Squircle App Icon in Header */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white shadow-sm ring-1 ring-slate-900/10">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
              <circle cx="12" cy="12" r="8" className="stroke-cyan-400 opacity-80" />
              <ellipse cx="12" cy="12" rx="9" ry="4" className="stroke-purple-400 opacity-90" transform="rotate(-30 12 12)" />
              <circle cx="12" cy="12" r="2" className="fill-white" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 tracking-tight">
                Antigravity 路由探测
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                持续监听中
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 text-xs">
          {/* Quick Probe */}
          <button
            onClick={handleProbe}
            disabled={probing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 ${probing ? 'animate-spin' : ''}`} />
            <span>{probing ? '探测中...' : '特征探测'}</span>
          </button>

          {/* Copy Proxy */}
          <button
            onClick={copyProxyEnv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition cursor-pointer"
            title="复制 PowerShell 代理设置环境变量"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? '已复制命令' : '代理命令'}</span>
          </button>

          {/* Clear */}
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="清空记录"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
