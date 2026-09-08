import React from "react";
import {
  ShieldAlert,
  Radio,
  Server,
  RefreshCw,
  Zap,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Activity,
} from "lucide-react";
import { ApiConfig } from "../types";

interface HeaderProps {
  apiConfig: ApiConfig;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenSimulate: () => void;
  onOpenDetect: () => void;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiConfig,
  isRefreshing,
  onRefresh,
  onOpenSettings,
  onOpenSimulate,
  onOpenDetect,
  autoRefresh,
  onToggleAutoRefresh,
}) => {
  return (
    <header
      id="skyguard-header"
      className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 py-3.5 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 text-white">
            <ShieldAlert className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                SkyGuard <span className="text-cyan-400 font-semibold">AI</span>
              </h1>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
                Isolation Forest ML
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Weather Station Telemetry & Sensor Anomaly Detection Engine
            </p>
          </div>
        </div>

        {/* Status Pills & Primary Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Backend Connection Indicator */}
          <button
            id="btn-backend-status"
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300"
            title="Click to configure FastAPI server"
          >
            {apiConfig.isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  FastAPI Live
                </span>
                {apiConfig.latencyMs !== null && (
                  <span className="text-slate-400 text-[11px] font-mono">
                    {apiConfig.latencyMs}ms
                  </span>
                )}
              </>
            ) : apiConfig.isDemoMode ? (
              <>
                <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="text-indigo-300 font-medium">Demo Sandbox</span>
              </>
            ) : (
              <>
                <Server className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 font-medium">Local Engine</span>
                <span className="text-[10px] px-1 rounded bg-amber-500/20 text-amber-300">
                  Fallback
                </span>
              </>
            )}
            <Sliders className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {/* Single Probe Detection Button */}
          <button
            id="btn-open-detect"
            onClick={onOpenDetect}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors shadow-sm cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Probe ML</span>
          </button>

          {/* Simulate Anomaly (POST /simulate-anomaly) Button */}
          <button
            id="btn-simulate-anomaly"
            onClick={onOpenSimulate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-md shadow-rose-900/30 transition-all active:scale-95 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate Anomaly</span>
          </button>

          {/* Auto Refresh Toggle */}
          <button
            id="btn-toggle-autorefresh"
            onClick={onToggleAutoRefresh}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              autoRefresh
                ? "bg-cyan-950/50 border-cyan-700/60 text-cyan-300"
                : "bg-slate-800/60 border-slate-700 text-slate-400"
            }`}
            title={autoRefresh ? "Auto-refresh active (10s)" : "Auto-refresh paused"}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                autoRefresh ? "bg-cyan-400 animate-ping" : "bg-slate-500"
              }`}
            />
            <span>{autoRefresh ? "Live 10s" : "Paused"}</span>
          </button>

          {/* Manual Refresh */}
          <button
            id="btn-manual-refresh"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh weather and alerts data"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
