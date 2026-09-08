import React from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Percent,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { AlertsSummary } from "../types";

interface SummaryCardsProps {
  summary: AlertsSummary;
  selectedStationId: number | "all";
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  summary,
  selectedStationId,
}) => {
  const getHealthBadge = () => {
    switch (summary.station_health) {
      case "Healthy":
        return {
          bg: "bg-emerald-950/40 border-emerald-500/30 text-emerald-400",
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          desc: "Anomaly rate < 5% - Optimal Sensor Condition",
        };
      case "Warning":
        return {
          bg: "bg-amber-950/40 border-amber-500/30 text-amber-400",
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          desc: "Anomaly rate 5-10% - Sensor Drift Detected",
        };
      case "Critical":
        return {
          bg: "bg-rose-950/40 border-rose-500/30 text-rose-400",
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
          desc: "Anomaly rate > 10% - Urgent Sensor Inspection Required",
        };
      default:
        return {
          bg: "bg-slate-800 border-slate-700 text-slate-300",
          icon: <Activity className="w-5 h-5 text-slate-400" />,
          desc: "Telemetry evaluating...",
        };
    }
  };

  const health = getHealthBadge();

  return (
    <div id="skyguard-summary-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* Station Health Overall Status */}
      <div
        id="card-station-health"
        className={`rounded-xl border p-4 transition-all ${health.bg} flex flex-col justify-between`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Station Health
          </span>
          {health.icon}
        </div>
        <div>
          <div className="text-2xl font-bold tracking-tight">
            {summary.station_health}
          </div>
          <p className="text-[11px] mt-1 opacity-80 leading-snug">
            {health.desc}
          </p>
        </div>
      </div>

      {/* Total Readings */}
      <div
        id="card-total-readings"
        className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition-all hover:border-slate-700"
      >
        <div className="flex items-center justify-between mb-2 text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Telemetry
          </span>
          <Activity className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="text-2xl font-bold text-white">
          {summary.total_readings.toLocaleString()}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          {selectedStationId === "all"
            ? "Across all active station sensors"
            : `Filtered for Station #${selectedStationId}`}
        </p>
      </div>

      {/* Normal Readings */}
      <div
        id="card-normal-readings"
        className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition-all hover:border-slate-700"
      >
        <div className="flex items-center justify-between mb-2 text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Normal Readings
          </span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold text-emerald-400">
          {summary.normal_readings.toLocaleString()}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Inliers within isolation forest boundary
        </p>
      </div>

      {/* Detected Anomalies */}
      <div
        id="card-anomalies-detected"
        className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition-all hover:border-slate-700"
      >
        <div className="flex items-center justify-between mb-2 text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Anomalies
          </span>
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="text-2xl font-bold text-rose-400">
          {summary.anomalies.toLocaleString()}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Spikes, drops, freeze & drifts
        </p>
      </div>

      {/* Anomaly Percentage Rate */}
      <div
        id="card-anomaly-rate"
        className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition-all hover:border-slate-700"
      >
        <div className="flex items-center justify-between mb-2 text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Anomaly Rate
          </span>
          <Percent className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-bold text-white flex items-baseline gap-1">
          <span>{summary.anomaly_percentage.toFixed(1)}%</span>
          <span className="text-xs text-slate-400 font-normal">of stream</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              summary.anomaly_percentage < 5
                ? "bg-emerald-500"
                : summary.anomaly_percentage < 10
                ? "bg-amber-500"
                : "bg-rose-500"
            }`}
            style={{ width: `${Math.min(100, summary.anomaly_percentage * 3)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
