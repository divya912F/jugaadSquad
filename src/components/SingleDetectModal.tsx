import React, { useState } from "react";
import { X, Activity, CheckCircle2, AlertTriangle, Play, RefreshCw, Cpu } from "lucide-react";
import { DetectResponse } from "../types";
import { classifyAnomaly, calculateSeverity, calculateConfidence, generateExplanation } from "../services/anomalyAlgorithms";

interface SingleDetectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetect: () => Promise<DetectResponse>;
}

export const SingleDetectModal: React.FC<SingleDetectModalProps> = ({
  isOpen,
  onClose,
  onDetect,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectResponse | null>(null);

  // Manual feature test state
  const [mode, setMode] = useState<"backend_detect" | "custom_probe">("backend_detect");
  const [customTemp, setCustomTemp] = useState(24.5);
  const [customHum, setCustomHum] = useState(60.0);
  const [customPress, setCustomPress] = useState(1013.25);
  const [customTempChange, setCustomTempChange] = useState(0.8);
  const [customHumChange, setCustomHumChange] = useState(2.1);
  const [customPressChange, setCustomPressChange] = useState(0.6);
  const [customTempDev, setCustomTempDev] = useState(1.2);
  const [customHumDev, setCustomHumDev] = useState(3.0);
  const [customPressDev, setCustomPressDev] = useState(0.8);

  const [customResult, setCustomResult] = useState<{
    status: "normal" | "anomaly";
    type?: string;
    explanation?: string;
    confidence?: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleRunBackendDetect = async () => {
    setLoading(true);
    try {
      const res = await onDetect();
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCustomFeatures = () => {
    const anomalyType = classifyAnomaly({
      temperature_change: customTempChange,
      humidity_change: customHumChange,
      pressure_change: customPressChange,
      temperature_deviation: customTempDev,
      humidity_deviation: customHumDev,
      pressure_deviation: customPressDev,
    });

    const isAnomaly = anomalyType !== "general_anomaly" || Math.abs(customTempChange) > 5;
    const { score } = calculateSeverity(anomalyType, {
      temperature_change: customTempChange,
      humidity_change: customHumChange,
      pressure_change: customPressChange,
      temperature_deviation: customTempDev,
      humidity_deviation: customHumDev,
      pressure_deviation: customPressDev,
    });
    const confidence = calculateConfidence(anomalyType, score);
    const explanation = generateExplanation(anomalyType, {
      temperature_change: customTempChange,
      humidity_change: customHumChange,
      pressure_change: customPressChange,
    });

    setCustomResult({
      status: isAnomaly ? "anomaly" : "normal",
      type: anomalyType,
      explanation,
      confidence,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="single-detect-dialog"
        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                SkyGuard ML Feature Probe
              </h3>
              <p className="text-xs text-slate-400">
                Test inference pipeline via <code className="text-cyan-300">GET /detect</code> or custom vector
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-slate-950/40 flex gap-2">
          <button
            onClick={() => setMode("backend_detect")}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              mode === "backend_detect"
                ? "text-cyan-300 border-cyan-400 bg-slate-900"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            FastAPI /detect Endpoint
          </button>
          <button
            onClick={() => setMode("custom_probe")}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              mode === "custom_probe"
                ? "text-cyan-300 border-cyan-400 bg-slate-900"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            Custom Feature Vector Sandbox
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {mode === "backend_detect" ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Query the latest weather dataset row through the trained Isolation Forest model loaded in your FastAPI backend.
              </p>

              <button
                onClick={handleRunBackendDetect}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-900/30 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>Run GET /detect Inference</span>
              </button>

              {result && (
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Status Prediction:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[11px] ${
                        result.status === "anomaly"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Station ID</span>
                      <span className="text-white font-bold">{result.location_id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Reading Time</span>
                      <span className="text-white">{result.time}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Temperature</span>
                      <span className="text-orange-400 font-bold">{result.temperature}°C</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Humidity</span>
                      <span className="text-cyan-400 font-bold">{result.humidity}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Pressure</span>
                      <span className="text-purple-400 font-bold">{result.pressure} hPa</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Adjust sensor changes & deviations to evaluate anomaly classification:
              </p>

              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Temp Change (Δ°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customTempChange}
                    onChange={(e) => setCustomTempChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Humidity Change (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customHumChange}
                    onChange={(e) => setCustomHumChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Pressure Change (hPa)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customPressChange}
                    onChange={(e) => setCustomPressChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Temp Deviation
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customTempDev}
                    onChange={(e) => setCustomTempDev(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Humidity Deviation
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customHumDev}
                    onChange={(e) => setCustomHumDev(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Pressure Deviation
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customPressDev}
                    onChange={(e) => setCustomPressDev(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white text-xs"
                  />
                </div>
              </div>

              <button
                onClick={handleTestCustomFeatures}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
              >
                Evaluate Classification Rules
              </button>

              {customResult && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    customResult.status === "anomaly"
                      ? "bg-rose-950/30 border-rose-800/50 text-rose-200"
                      : "bg-emerald-950/30 border-emerald-800/50 text-emerald-200"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>Result: {customResult.status.toUpperCase()}</span>
                    <span className="font-mono text-[11px]">
                      Type: {customResult.type}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-1">{customResult.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
