import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Flame,
  Droplets,
  Gauge,
  Snowflake,
  Cpu,
  Clock,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  MapPin,
  HelpCircle,
} from "lucide-react";
import { AlertItem, AnomalyType, SeverityLevel } from "../types";

interface AlertsFeedProps {
  alerts: AlertItem[];
  selectedStationId: number | "all";
  onSelectStation: (id: number | "all") => void;
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({
  alerts,
  selectedStationId,
  onSelectStation,
}) => {
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | "all">("all");
  const [typeFilter, setTypeFilter] = useState<AnomalyType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (selectedStationId !== "all" && alert.location_id !== selectedStationId) {
        return false;
      }
      if (severityFilter !== "all" && alert.severity !== severityFilter) {
        return false;
      }
      if (typeFilter !== "all" && alert.type !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchExpl = alert.explanation.toLowerCase().includes(query);
        const matchType = alert.type.toLowerCase().includes(query);
        const matchStation = `station ${alert.location_id}`.includes(query);
        if (!matchExpl && !matchType && !matchStation) return false;
      }
      return true;
    });
  }, [alerts, selectedStationId, severityFilter, typeFilter, searchQuery]);

  const toggleAcknowledge = (id: string) => {
    setAcknowledgedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case "Critical":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "High":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      case "Medium":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "Low":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
    }
  };

  const getTypeMeta = (type: AnomalyType) => {
    switch (type) {
      case "stuck_temperature_sensor":
        return {
          label: "Stuck Sensor",
          icon: <Snowflake className="w-3.5 h-3.5 text-sky-400" />,
          color: "text-sky-400",
        };
      case "temperature_spike_drop":
        return {
          label: "Temp Spike/Drop",
          icon: <Flame className="w-3.5 h-3.5 text-orange-400" />,
          color: "text-orange-400",
        };
      case "humidity_spike_drop":
        return {
          label: "Humidity Shock",
          icon: <Droplets className="w-3.5 h-3.5 text-cyan-400" />,
          color: "text-cyan-400",
        };
      case "pressure_spike_drop":
        return {
          label: "Pressure Surge",
          icon: <Gauge className="w-3.5 h-3.5 text-purple-400" />,
          color: "text-purple-400",
        };
      case "general_anomaly":
      default:
        return {
          label: "General Anomaly",
          icon: <Cpu className="w-3.5 h-3.5 text-slate-300" />,
          color: "text-slate-300",
        };
    }
  };

  return (
    <div
      id="alerts-feed-container"
      className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden flex flex-col h-full backdrop-blur-sm"
    >
      {/* Feed Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Active Anomaly Alerts
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-950/70 border border-rose-800/60 text-rose-300">
                  {filteredAlerts.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Isolation Forest predictions & diagnosis classifications
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filters Row */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search explanation, station ID, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1">
            <select
              value={severityFilter}
              onChange={(e) =>
                setSeverityFilter(e.target.value as SeverityLevel | "all")
              }
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as AnomalyType | "all")
              }
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Anomaly Types</option>
              <option value="stuck_temperature_sensor">Stuck Sensor</option>
              <option value="temperature_spike_drop">Temperature Spike</option>
              <option value="humidity_spike_drop">Humidity Spike</option>
              <option value="pressure_spike_drop">Pressure Spike</option>
              <option value="general_anomaly">General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Scrollable List */}
      <div className="divide-y divide-slate-800/60 overflow-y-auto max-h-[580px] p-2 space-y-2">
        {filteredAlerts.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 px-4">
            <AlertTriangle className="w-8 h-8 text-slate-500 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No anomalies found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              All sensor readings are operating within normal statistical boundaries, or match your current filter settings.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => {
            const alertKey = alert.id || `alert-${alert.location_id}-${idx}-${alert.time}`;
            const isExpanded = expandedAlertId === alertKey;
            const isAcked = acknowledgedIds.has(alertKey);
            const typeMeta = getTypeMeta(alert.type);

            return (
              <div
                key={alertKey}
                id={`alert-card-${idx}`}
                className={`rounded-xl border transition-all p-3.5 ${
                  isAcked
                    ? "bg-slate-900/40 border-slate-800/50 opacity-60"
                    : alert.severity === "Critical"
                    ? "bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60"
                    : alert.severity === "High"
                    ? "bg-orange-950/15 border-orange-900/30 hover:border-orange-700/50"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Top Row: Severity, Type, Station, Time */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {/* Severity Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getSeverityBadge(
                        alert.severity
                      )}`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>

                    {/* Anomaly Type */}
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-200">
                      {typeMeta.icon}
                      <span>{typeMeta.label}</span>
                    </span>

                    {/* Station Tag */}
                    <button
                      onClick={() => onSelectStation(alert.location_id)}
                      className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                      title="Filter chart by this station"
                    >
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      Station #{alert.location_id}
                    </button>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{alert.time}</span>
                  </div>
                </div>

                {/* Explanation text */}
                <p className="text-xs font-medium text-slate-200 mb-3 leading-relaxed">
                  {alert.explanation}
                </p>

                {/* Scores & Progress Bars */}
                <div className="grid grid-cols-2 gap-3 mb-3 bg-slate-950/50 rounded-lg p-2.5 border border-slate-800/80">
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span>Severity Score</span>
                      <span className="font-bold text-white font-mono">
                        {alert.severity_score}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          alert.severity_score >= 80
                            ? "bg-rose-500"
                            : alert.severity_score >= 60
                            ? "bg-orange-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${alert.severity_score}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span>AI Confidence</span>
                      <span className="font-bold text-cyan-300 font-mono">
                        {alert.confidence}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{ width: `${alert.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Controls & Expanded Telemetry Details */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    onClick={() =>
                      setExpandedAlertId(isExpanded ? null : alertKey)
                    }
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200 font-medium cursor-pointer"
                  >
                    <span>{isExpanded ? "Hide Details" : "Telemetry Values"}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => toggleAcknowledge(alertKey)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      isAcked
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>{isAcked ? "Acknowledged" : "Acknowledge"}</span>
                  </button>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-[11px] font-mono bg-slate-950/40 p-2.5 rounded-lg">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">
                        Temperature
                      </span>
                      <span className="font-bold text-orange-400">
                        {alert.temperature.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">
                        Humidity
                      </span>
                      <span className="font-bold text-cyan-400">
                        {alert.humidity.toFixed(1)}%
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">
                        Pressure
                      </span>
                      <span className="font-bold text-purple-400">
                        {alert.pressure.toFixed(1)} hPa
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
