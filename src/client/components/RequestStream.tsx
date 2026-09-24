import React, { useState } from 'react';
import { Search, Radio, Clock, Shield, Terminal, Zap } from 'lucide-react';
import { CapturedRequest, DetectionSource } from '../../types/detector';

interface RequestStreamProps {
  requests: CapturedRequest[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const RequestStream: React.FC<RequestStreamProps> = ({
  requests,
  selectedId,
  onSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = requests.filter((r) => {
    return (
      r.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.detectedModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.requestSummary.promptSnippet || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getSourceBadge = (source: DetectionSource) => {
    switch (source) {
      case 'mitm':
        return <span className="text-[10px] font-semibold text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">抓包</span>;
      case 'log_watcher':
        return <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">日志</span>;
      case 'probe':
        return <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">探针</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索调用或 Prompt..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono shrink-0">
          {filteredRequests.length} 条
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 text-slate-400">
            <Radio className="w-6 h-6 text-slate-300 mb-1" />
            <p className="text-xs text-slate-500">等待 agy CLI 任务调用...</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isSelected = req.id === selectedId;
            const timeStr = new Date(req.timestamp).toLocaleTimeString();

            return (
              <div
                key={req.id}
                onClick={() => onSelect(req.id)}
                className={`p-3 transition-colors cursor-pointer flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-50/60 border-l-4 border-indigo-600'
                    : 'border-l-4 border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {getSourceBadge(req.source)}
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {req.detectedModel}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{timeStr}</span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="font-mono truncate max-w-[220px]">
                    {req.endpoint}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {req.confidence}% 置信度
                  </span>
                </div>

                {req.requestSummary.promptSnippet && (
                  <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                    {req.requestSummary.promptSnippet}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
