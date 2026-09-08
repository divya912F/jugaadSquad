import React, { useState } from "react";
import { WeatherReading } from "../types";
import {
  Table,
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

interface RawDataTableProps {
  readings: WeatherReading[];
  selectedStationId: number | "all";
}

export const RawDataTable: React.FC<RawDataTableProps> = ({
  readings,
  selectedStationId,
}) => {
  const [onlyAnomalies, setOnlyAnomalies] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const filtered = readings.filter((r) => {
    if (selectedStationId !== "all" && r.location_id !== selectedStationId) {
      return false;
    }
    if (onlyAnomalies && !r.is_anomaly) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentSlice = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const exportCSV = () => {
    const headers = [
      "location_id",
      "time",
      "temperature",
      "relative_humidity",
      "surface_pressure",
      "temperature_change",
      "humidity_change",
      "pressure_change",
      "temperature_rolling_mean",
      "humidity_rolling_mean",
      "pressure_rolling_mean",
      "temperature_deviation",
      "humidity_deviation",
      "pressure_deviation",
      "is_anomaly",
    ];

    const rows = filtered.map((r) => [
      r.location_id,
      r.time,
      r.temperature,
      r.relative_humidity,
      r.surface_pressure,
      r.temperature_change ?? "",
      r.humidity_change ?? "",
      r.pressure_change ?? "",
      r.temperature_rolling_mean ?? "",
      r.humidity_rolling_mean ?? "",
      r.pressure_rolling_mean ?? "",
      r.temperature_deviation ?? "",
      r.humidity_deviation ?? "",
      r.pressure_deviation ?? "",
      r.is_anomaly ? "1" : "0",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `skyguard_weather_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="raw-data-table-card"
      className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden backdrop-blur-sm"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            <Table className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Raw Weather Telemetry Log (50 Records)
            </h2>
            <p className="text-xs text-slate-400">
              Direct feed from <code className="text-cyan-300">GET /weather</code> with ML feature attributes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setOnlyAnomalies(!onlyAnomalies);
              setPage(0);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              onlyAnomalies
                ? "bg-rose-950/60 border-rose-700/60 text-rose-300"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{onlyAnomalies ? "Only Anomalies" : "All Records"}</span>
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Station</th>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Temp (°C)</th>
              <th className="py-3 px-4">Δ Temp</th>
              <th className="py-3 px-4">Hum (%)</th>
              <th className="py-3 px-4">Pressure (hPa)</th>
              <th className="py-3 px-4">Rolling Baselines</th>
              <th className="py-3 px-4">ML Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {currentSlice.map((r, i) => (
              <tr
                key={`${r.location_id}-${r.time}-${i}`}
                className={`transition-colors hover:bg-slate-800/40 ${
                  r.is_anomaly ? "bg-rose-950/10" : ""
                }`}
              >
                <td className="py-2.5 px-4 font-bold text-white">
                  #{r.location_id}
                </td>
                <td className="py-2.5 px-4 text-slate-400">
                  {r.time}
                </td>
                <td className="py-2.5 px-4 font-bold text-orange-400">
                  {r.temperature.toFixed(1)}°
                </td>
                <td className="py-2.5 px-4">
                  <span
                    className={
                      Math.abs(r.temperature_change ?? 0) > 8
                        ? "text-rose-400 font-bold"
                        : "text-slate-400"
                    }
                  >
                    {(r.temperature_change ?? 0) > 0 ? "+" : ""}
                    {(r.temperature_change ?? 0).toFixed(2)}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-cyan-400 font-medium">
                  {r.relative_humidity.toFixed(1)}%
                </td>
                <td className="py-2.5 px-4 text-purple-400 font-medium">
                  {r.surface_pressure.toFixed(1)}
                </td>
                <td className="py-2.5 px-4 text-slate-400 text-[10px]">
                  <span>T-Mean: {r.temperature_rolling_mean?.toFixed(1) ?? "-"}°</span>{" "}
                  <span className="text-slate-600">|</span>{" "}
                  <span>P-Mean: {r.pressure_rolling_mean?.toFixed(0) ?? "-"}</span>
                </td>
                <td className="py-2.5 px-4">
                  {r.is_anomaly ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      <AlertCircle className="w-3 h-3 text-rose-400" />
                      Anomaly
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Normal
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 px-4">
        <div>
          Showing {page * pageSize + 1} -{" "}
          {Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}{" "}
          records
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
