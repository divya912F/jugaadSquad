import React from "react";
import { Station, WeatherReading, AlertItem } from "../types";
import { MapPin, Radio, AlertTriangle, ShieldCheck, Thermometer, Droplets, Gauge } from "lucide-react";

interface StationMapProps {
  stations: Station[];
  readings: WeatherReading[];
  alerts: AlertItem[];
  selectedStationId: number | "all";
  onSelectStation: (id: number | "all") => void;
}

export const StationMap: React.FC<StationMapProps> = ({
  stations,
  readings,
  alerts,
  selectedStationId,
  onSelectStation,
}) => {
  // Compute station telemetry and status
  const stationStats = stations.map((st) => {
    const stationReadings = readings.filter((r) => r.location_id === st.location_id);
    const stationAlerts = alerts.filter((a) => a.location_id === st.location_id);
    const latest = stationReadings[stationReadings.length - 1];
    const hasCritical = stationAlerts.some((a) => a.severity === "Critical");
    const hasHigh = stationAlerts.some((a) => a.severity === "High");

    let status: "Healthy" | "Warning" | "Critical" = "Healthy";
    if (hasCritical) status = "Critical";
    else if (hasHigh || stationAlerts.length > 0) status = "Warning";

    return {
      station: st,
      latest,
      alertCount: stationAlerts.length,
      status,
    };
  });

  return (
    <div
      id="station-map-card"
      className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden backdrop-blur-sm"
    >
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Weather Stations Network
            </h2>
            <p className="text-xs text-slate-400">
              Active automated weather sensor stations & geospatial node health
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectStation("all")}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors cursor-pointer ${
            selectedStationId === "all"
              ? "bg-cyan-950/70 text-cyan-300 border-cyan-600/70"
              : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
          }`}
        >
          View All Nodes ({stations.length})
        </button>
      </div>

      {/* Grid of Station Nodes */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stationStats.map(({ station, latest, alertCount, status }) => {
          const isSelected = selectedStationId === station.location_id;

          const getStatusColor = () => {
            if (status === "Critical") return "border-rose-500/50 bg-rose-950/20 text-rose-400";
            if (status === "Warning") return "border-amber-500/50 bg-amber-950/20 text-amber-400";
            return "border-emerald-500/40 bg-emerald-950/20 text-emerald-400";
          };

          return (
            <div
              key={station.location_id}
              id={`station-node-${station.location_id}`}
              onClick={() =>
                onSelectStation(
                  isSelected ? "all" : station.location_id
                )
              }
              className={`rounded-xl border p-4 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? "border-cyan-400 bg-slate-800/90 ring-2 ring-cyan-400/30"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-850"
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        status === "Critical"
                          ? "bg-rose-500 animate-ping"
                          : status === "Warning"
                          ? "bg-amber-400 animate-pulse"
                          : "bg-emerald-400"
                      }`}
                    />
                    <span className="font-bold text-sm text-white">
                      Station #{station.location_id}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor()}`}
                  >
                    {status.toUpperCase()}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-3">
                  <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="font-mono">
                    {station.latitude.toFixed(4)}°N, {station.longitude.toFixed(4)}°E
                  </span>
                </div>
              </div>

              {/* Latest Readings Mini Bar */}
              {latest ? (
                <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80 grid grid-cols-3 gap-1 text-[11px] font-mono text-center">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Temp</span>
                    <span className="font-bold text-orange-400">
                      {latest.temperature.toFixed(1)}°
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Hum</span>
                    <span className="font-bold text-cyan-400">
                      {latest.relative_humidity.toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Press</span>
                    <span className="font-bold text-purple-400">
                      {latest.surface_pressure.toFixed(0)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">Awaiting stream...</div>
              )}

              {/* Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  {alertCount > 0 ? (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {alertCount} alert{alertCount > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Normal
                    </span>
                  )}
                </span>

                <span
                  className={`font-semibold ${
                    isSelected ? "text-cyan-400 underline" : "text-slate-400"
                  }`}
                >
                  {isSelected ? "Active Filter" : "Filter Chart"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
