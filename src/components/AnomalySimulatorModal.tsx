import React, { useState } from "react";
import {
  X,
  Zap,
  Flame,
  Snowflake,
  Gauge,
  Droplets,
  AlertTriangle,
  Play,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { SimulateResponse } from "../types";

interface AnomalySimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulate: (params?: {
    location_id?: number;
    normal_temp?: number;
    anomaly_temp?: number;
    humidity?: number;
    pressure?: number;
  }) => Promise<SimulateResponse>;
  onRefreshData: () => void;
}

export const AnomalySimulatorModal: React.FC<AnomalySimulatorModalProps> = ({
  isOpen,
  onClose,
  onSimulate,
  onRefreshData,
}) => {
  const [selectedStation, setSelectedStation] = useState<number>(101);
  const [normalTemp, setNormalTemp] = useState<number>(13.2);
  const [anomalyTemp, setAnomalyTemp] = useState<number>(29.6);
  const [humidity, setHumidity] = useState<number>(78.0);
  const [pressure, setPressure] = useState<number>(993.4);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SimulateResponse | null>(null);

  if (!isOpen) return null;

  const handleRunSimulation = async (custom = true) => {
    setIsLoading(true);
    try {
      let res: SimulateResponse;
      if (custom) {
        res = await onSimulate({
          location_id: selectedStation,
          normal_temp: normalTemp,
          anomaly_temp: anomalyTemp,
          humidity,
          pressure,
        });
      } else {
        // Run standard default POST /simulate-anomaly
        res = await onSimulate();
      }
      setResult(res);
      onRefreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreset = (type: "sih_default" | "extreme_heat" | "sensor_stuck" | "storm_drop") => {
    switch (type) {
      case "sih_default":
        setNormalTemp(13.2);
        setAnomalyTemp(29.6);
        setHumidity(78.0);
        setPressure(993.4);
        break;
      case "extreme_heat":
        setNormalTemp(22.0);
        setAnomalyTemp(39.5);
        setHumidity(45.0);
        setPressure(1008.0);
        break;
      case "sensor_stuck":
        setNormalTemp(18.5);
        setAnomalyTemp(18.505);
        setHumidity(62.0);
        setPressure(1012.0);
        break;
      case "storm_drop":
        setNormalTemp(24.0);
        setAnomalyTemp(15.2);
        setHumidity(94.0);
        setPressure(982.0);
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="anomaly-simulator-dialog"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Anomaly Simulation Sandbox
              </h3>
              <p className="text-xs text-slate-400">
                Trigger controlled anomaly injection pipeline via <code className="text-cyan-300">POST /simulate-anomaly</code>
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* SIH Prototype Notice */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-white block mb-0.5">
                Demonstration Alert Pipeline
              </strong>
              This triggers the controlled endpoint defined in your FastAPI backend to test real-time alert dispatching, severity computation, and UI response without waiting for rare field events.
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Preset Scenarios
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handlePreset("sih_default")}
                className="p-2.5 rounded-lg text-left bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs transition-colors"
              >
                <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Default SIH
                </div>
                <div className="text-[11px] text-slate-400">13.2°C → 29.6°C (+16.4°)</div>
              </button>

              <button
                type="button"
                onClick={() => handlePreset("extreme_heat")}
                className="p-2.5 rounded-lg text-left bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs transition-colors"
              >
                <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  Thermal Shock
                </div>
                <div className="text-[11px] text-slate-400">22.0°C → 39.5°C</div>
              </button>

              <button
                type="button"
                onClick={() => handlePreset("storm_drop")}
                className="p-2.5 rounded-lg text-left bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs transition-colors"
              >
                <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                  <Gauge className="w-3.5 h-3.5 text-purple-400" />
                  Barometric Drop
                </div>
                <div className="text-[11px] text-slate-400">982 hPa (Deep low)</div>
              </button>

              <button
                type="button"
                onClick={() => handlePreset("sensor_stuck")}
                className="p-2.5 rounded-lg text-left bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs transition-colors"
              >
                <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                  <Snowflake className="w-3.5 h-3.5 text-sky-400" />
                  Sensor Freeze
                </div>
                <div className="text-[11px] text-slate-400">Δ &lt; 0.01°C (Stuck)</div>
              </button>
            </div>
          </div>

          {/* Interactive Input Form */}
          <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Target Weather Station
                </label>
                <select
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={101}>Station #101 (Alpha - North)</option>
                  <option value={102}>Station #102 (Beta - West)</option>
                  <option value={103}>Station #103 (Gamma - South)</option>
                  <option value={104}>Station #104 (Delta - East)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Normal Baseline Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={normalTemp}
                  onChange={(e) => setNormalTemp(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Injected Anomaly Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={anomalyTemp}
                  onChange={(e) => setAnomalyTemp(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-rose-400 font-mono font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Relative Humidity (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={humidity}
                  onChange={(e) => setHumidity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Surface Pressure (hPa)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pressure}
                  onChange={(e) => setPressure(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="text-[11px] text-slate-400">
                  Calculated Δ Temp:{" "}
                  <strong className="text-rose-400 font-mono font-bold">
                    {(anomalyTemp - normalTemp).toFixed(1)}°C
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Output Result Box */}
          {result && (
            <div className="bg-slate-950/80 rounded-xl p-4 border border-rose-800/60 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-rose-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulation Successfully Executed</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/50 text-slate-200">
                  <div className="font-semibold text-rose-300 mb-1">
                    {result.alert.explanation}
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] font-mono text-slate-300 mt-2">
                    <span>
                      Severity:{" "}
                      <strong className="text-rose-400">
                        {result.alert.severity} ({result.alert.severity_score}/100)
                      </strong>
                    </span>
                    <span>
                      Confidence:{" "}
                      <strong className="text-cyan-400">
                        {result.alert.confidence}%
                      </strong>
                    </span>
                    <span>
                      Sensor Health:{" "}
                      <strong className="text-amber-400">
                        {result.alert.sensor_health}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleRunSimulation(false)}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
          >
            Run Default Backend Preset
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handleRunSimulation(true)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-md shadow-rose-900/30 transition-all cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>Inject Anomaly</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
