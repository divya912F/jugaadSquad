import React, { useState } from "react";
import {
  X,
  Server,
  Radio,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  Code,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { ApiConfig } from "../types";

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiConfig: ApiConfig;
  onUpdateBaseUrl: (url: string) => void;
  onToggleDemoMode: (enabled: boolean) => void;
  onCheckHealth: () => Promise<{ connected: boolean; statusText: string; latencyMs: number }>;
  onResetData: () => void;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({
  isOpen,
  onClose,
  apiConfig,
  onUpdateBaseUrl,
  onToggleDemoMode,
  onCheckHealth,
  onResetData,
}) => {
  const [urlInput, setUrlInput] = useState(apiConfig.baseUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    statusText: string;
    latencyMs: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    onUpdateBaseUrl(urlInput);
    setIsTesting(true);
    try {
      const result = await onCheckHealth();
      setTestResult(result);
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCurl(id);
    setTimeout(() => setCopiedCurl(null), 2000);
  };

  const curlExample = `uvicorn main:app --reload --port 8000`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="backend-config-dialog"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                SkyGuard AI Backend Integration
              </h3>
              <p className="text-xs text-slate-400">
                Connect your FastAPI service or run in standalone client mode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Connection Status Box */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
              apiConfig.isConnected
                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                : apiConfig.isDemoMode
                ? "bg-indigo-950/30 border-indigo-500/40 text-indigo-300"
                : "bg-slate-950/60 border-slate-800 text-slate-300"
            }`}
          >
            <div className="flex items-center gap-3">
              {apiConfig.isConnected ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : apiConfig.isDemoMode ? (
                <Radio className="w-6 h-6 text-indigo-400 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-amber-400 shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm text-white">
                  {apiConfig.isConnected
                    ? "Connected to FastAPI Live"
                    : apiConfig.isDemoMode
                    ? "Demo Mode Active (Client-Side)"
                    : "FastAPI Backend Offline / Fallback Active"}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {apiConfig.isConnected
                    ? `Live responses from ${apiConfig.baseUrl} (${apiConfig.latencyMs}ms latency)`
                    : "The UI automatically simulates the exact FastAPI logic, data models, and algorithms."}
                </div>
              </div>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
              <span>Ping</span>
            </button>
          </div>

          {/* Backend URL Input Form */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white block">
              FastAPI Server Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold cursor-pointer transition-colors"
              >
                {isTesting ? "Testing..." : "Apply & Test"}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Ensure your FastAPI server runs with CORS allowed (as in your Python snippet: <code className="text-slate-300">allow_origins=["*"]</code>).
            </p>
          </div>

          {/* Quick Launch Guide */}
          <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Launch Command for your FastAPI Backend
              </span>
              <button
                onClick={() => copyToClipboard(curlExample, "cmd")}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer"
              >
                {copiedCurl === "cmd" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedCurl === "cmd" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
              {curlExample}
            </pre>
          </div>

          {/* Endpoints Table */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-white">
              Targeted FastAPI Endpoints
            </div>
            <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">GET</span>{" "}
                  <span className="text-slate-200">/health</span>
                </div>
                <span className="text-slate-500">Service health check</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">GET</span>{" "}
                  <span className="text-slate-200">/stations</span>
                </div>
                <span className="text-slate-500">Weather stations coordinate list</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">GET</span>{" "}
                  <span className="text-slate-200">/weather</span>
                </div>
                <span className="text-slate-500">50 latest telemetry time-series readings</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">GET</span>{" "}
                  <span className="text-slate-200">/alerts</span>
                </div>
                <span className="text-slate-500">Isolation Forest anomaly classifications</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">GET</span>{" "}
                  <span className="text-slate-200">/detect</span>
                </div>
                <span className="text-slate-500">Latest single reading prediction</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-blue-400 font-bold">POST</span>{" "}
                  <span className="text-slate-200">/simulate-anomaly</span>
                </div>
                <span className="text-slate-500">Controlled SIH demo pipeline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={onResetData}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
          >
            Reset In-Memory Simulation
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
