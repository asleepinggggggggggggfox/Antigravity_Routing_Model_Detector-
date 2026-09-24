import React, { useEffect, useState, useRef } from 'react';
import { Header } from './components/Header';
import { ModelHeroCard } from './components/ModelHeroCard';
import { RequestStream } from './components/RequestStream';
import { PayloadInspector } from './components/PayloadInspector';
import { DetectorState, WsServerMessage, ProbeType } from '../types/detector';

const DEFAULT_STATE: DetectorState = {
  activeModel: 'Gemini 3.8 Flash (High)',
  activeConfidence: 98,
  activeModelFeatures: ['动态双轨捕获就绪', 'Thinking Token 深度指纹分析'],
  proxyPort: 18982,
  proxyRunning: true,
  watcherActive: true,
  totalIntercepted: 0,
  requests: [],
  verificationMethods: [],
  agyProcessStatus: {
    running: false
  }
};

export const App: React.FC = () => {
  const [state, setState] = useState<DetectorState>(DEFAULT_STATE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('http://localhost:18981/api/status');
      if (res.ok) {
        const data: DetectorState = await res.json();
        setState(data);
        if (data.requests.length > 0 && !selectedId) {
          setSelectedId(data.requests[0].id);
        }
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchStatus();

    let reconnectTimer: any;
    const connectWs = () => {
      const wsUrl = `ws://localhost:18981`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg: WsServerMessage = JSON.parse(event.data);
          if (msg.type === 'INIT_STATE') {
            setState(msg.payload);
            if (msg.payload.requests.length > 0) {
              setSelectedId(msg.payload.requests[0].id);
            }
          } else if (msg.type === 'STATE_UPDATE') {
            setState((prev) => ({ ...prev, ...msg.payload }));
          } else if (msg.type === 'NEW_REQUEST') {
            setState((prev) => ({
              ...prev,
              totalIntercepted: prev.totalIntercepted + 1,
              activeModel: msg.payload.detectedModel,
              activeConfidence: msg.payload.confidence,
              requests: [msg.payload, ...prev.requests]
            }));
            setSelectedId(msg.payload.id);
          } else if (msg.type === 'UPDATE_REQUEST') {
            setState((prev) => ({
              ...prev,
              requests: prev.requests.map((r) =>
                r.id === msg.payload.id ? { ...r, ...msg.payload } : r
              )
            }));
          }
        } catch {
          // Parse error
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connectWs, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWs();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleClear = async () => {
    try {
      await fetch('http://localhost:18981/api/actions/clear', { method: 'POST' });
      setState((prev) => ({ ...prev, requests: [] }));
      setSelectedId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunProbe = async (probeType: ProbeType, customPrompt?: string) => {
    try {
      const res = await fetch('http://localhost:18981/api/actions/trigger-probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ probeType, customPrompt })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.probe) {
          setSelectedId(data.probe.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectedRequest = state.requests.find((r) => r.id === selectedId) || null;

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col font-sans">
      <Header
        state={state}
        onClear={handleClear}
        onQuickProbe={() => handleRunProbe('identity')}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-5 space-y-4 flex flex-col">
        {!connected && (
          <div className="px-3.5 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <span>正在连接本地探测服务 (http://localhost:18981)...</span>
            <span className="animate-spin text-amber-600">⟳</span>
          </div>
        )}

        {/* Clean Model Hero Card with Inline Probe Buttons */}
        <ModelHeroCard state={state} onRunProbe={handleRunProbe} />

        {/* Streamlined Split View */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-[500px]">
          <div className="md:col-span-5 h-[560px]">
            <RequestStream
              requests={state.requests}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
            />
          </div>

          <div className="md:col-span-7 h-[560px]">
            <PayloadInspector request={selectedRequest} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
