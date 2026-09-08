import React, { useState, useMemo } from "react";
import {
  Thermometer,
  Droplets,
  Gauge,
  Eye,
  EyeOff,
  AlertCircle,
  Filter,
  Maximize2,
  TrendingUp,
} from "lucide-react";
import { WeatherReading, Station } from "../types";

interface TelemetryChartsProps {
  readings: WeatherReading[];
  stations: Station[];
  selectedStationId: number | "all";
  onSelectStation: (id: number | "all") => void;
}

type SensorMetric = "temperature" | "relative_humidity" | "surface_pressure";

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  readings,
  stations,
  selectedStationId,
  onSelectStation,
}) => {
  const [activeMetric, setActiveMetric] = useState<SensorMetric>("temperature");
  const [showRollingMean, setShowRollingMean] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter readings by station if selected
  const filteredReadings = useMemo(() => {
    if (selectedStationId === "all") return readings;
    return readings.filter((r) => r.location_id === selectedStationId);
  }, [readings, selectedStationId]);

  // Metric configs
  const metricConfigs = {
    temperature: {
      label: "Temperature",
      unit: "°C",
      icon: Thermometer,
      lineColor: "#f97316", // Orange 500
      glowColor: "rgba(249, 115, 22, 0.3)",
      meanColor: "#fbbf24", // Amber 400
      gradientStart: "rgba(249, 115, 22, 0.35)",
      gradientEnd: "rgba(249, 115, 22, 0.0)",
      getValue: (r: WeatherReading) => r.temperature,
      getRolling: (r: WeatherReading) => r.temperature_rolling_mean ?? r.temperature,
      getChange: (r: WeatherReading) => r.temperature_change,
      getDeviation: (r: WeatherReading) => r.temperature_deviation,
      format: (val: number) => `${val.toFixed(1)}°C`,
    },
    relative_humidity: {
      label: "Relative Humidity",
      unit: "%",
      icon: Droplets,
      lineColor: "#06b6d4", // Cyan 500
      glowColor: "rgba(6, 182, 212, 0.3)",
      meanColor: "#38bdf8", // Sky 400
      gradientStart: "rgba(6, 182, 212, 0.35)",
      gradientEnd: "rgba(6, 182, 212, 0.0)",
      getValue: (r: WeatherReading) => r.relative_humidity,
      getRolling: (r: WeatherReading) => r.humidity_rolling_mean ?? r.relative_humidity,
      getChange: (r: WeatherReading) => r.humidity_change,
      getDeviation: (r: WeatherReading) => r.humidity_deviation,
      format: (val: number) => `${val.toFixed(1)}%`,
    },
    surface_pressure: {
      label: "Surface Pressure",
      unit: "hPa",
      icon: Gauge,
      lineColor: "#a855f7", // Purple 500
      glowColor: "rgba(168, 85, 247, 0.3)",
      meanColor: "#c084fc", // Purple 400
      gradientStart: "rgba(168, 85, 247, 0.35)",
      gradientEnd: "rgba(168, 85, 247, 0.0)",
      getValue: (r: WeatherReading) => r.surface_pressure,
      getRolling: (r: WeatherReading) => r.pressure_rolling_mean ?? r.surface_pressure,
      getChange: (r: WeatherReading) => r.pressure_change,
      getDeviation: (r: WeatherReading) => r.pressure_deviation,
      format: (val: number) => `${val.toFixed(1)} hPa`,
    },
  };

  const currentCfg = metricConfigs[activeMetric];

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 280;
  const padding = { top: 25, right: 30, bottom: 35, left: 55 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  // Calculate scales
  const pointsCount = Math.max(2, filteredReadings.length);
  const values = filteredReadings.map(currentCfg.getValue);
  const rollingValues = filteredReadings.map(currentCfg.getRolling);
  const allValues = [...values, ...(showRollingMean ? rollingValues : [])];

  const minVal = allValues.length ? Math.min(...allValues) : 0;
  const maxVal = allValues.length ? Math.max(...allValues) : 100;
  const valMargin = (maxVal - minVal) * 0.15 || 5;
  const yMin = Math.floor(minVal - valMargin);
  const yMax = Math.ceil(maxVal + valMargin);
  const yRange = yMax - yMin || 1;

  const getX = (index: number) => {
    if (pointsCount <= 1) return padding.left + graphWidth / 2;
    return padding.left + (index / (pointsCount - 1)) * graphWidth;
  };

  const getY = (val: number) => {
    return padding.top + graphHeight - ((val - yMin) / yRange) * graphHeight;
  };

  // Build SVG Path
  const mainPath = useMemo(() => {
    if (filteredReadings.length === 0) return "";
    return filteredReadings.reduce((acc, r, i) => {
      const x = getX(i);
      const y = getY(currentCfg.getValue(r));
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, "");
  }, [filteredReadings, activeMetric, yMin, yMax]);

  const rollingPath = useMemo(() => {
    if (!showRollingMean || filteredReadings.length === 0) return "";
    return filteredReadings.reduce((acc, r, i) => {
      const x = getX(i);
      const y = getY(currentCfg.getRolling(r));
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, "");
  }, [filteredReadings, activeMetric, showRollingMean, yMin, yMax]);

  const areaPath = useMemo(() => {
    if (!mainPath || filteredReadings.length === 0) return "";
    const firstX = getX(0);
    const lastX = getX(filteredReadings.length - 1);
    const bottomY = padding.top + graphHeight;
    return `${mainPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [mainPath, filteredReadings]);

  // Identify anomalies
  const anomalyPoints = useMemo(() => {
    return filteredReadings
      .map((r, i) => ({ reading: r, index: i }))
      .filter(({ reading }) => reading.is_anomaly);
  }, [filteredReadings]);

  // Y-axis grid ticks (4 ticks)
  const yTicks = useMemo(() => {
    return [0, 0.33, 0.66, 1].map((ratio) => {
      const val = yMin + ratio * yRange;
      const y = getY(val);
      return { val, y };
    });
  }, [yMin, yMax, yRange]);

  const activeReading =
    hoveredIndex !== null && filteredReadings[hoveredIndex]
      ? filteredReadings[hoveredIndex]
      : filteredReadings[filteredReadings.length - 1] || null;

  return (
    <div
      id="telemetry-charts-card"
      className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden backdrop-blur-sm"
    >
      {/* Chart Top Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Sensor Telemetry Stream & Anomaly Boundaries
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-variate telemetry vs Isolation Forest rolling means & deviations
          </p>
        </div>

        {/* Filters & Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Station Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="station-selector"
              value={selectedStationId}
              onChange={(e) =>
                onSelectStation(
                  e.target.value === "all" ? "all" : Number(e.target.value)
                )
              }
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-white">
                All Stations ({stations.length})
              </option>
              {stations.map((s) => (
                <option
                  key={s.location_id}
                  value={s.location_id}
                  className="bg-slate-900 text-white"
                >
                  Station #{s.location_id} {s.name ? `- ${s.name}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Rolling Mean Baseline Toggle */}
          <button
            id="btn-toggle-rolling-mean"
            onClick={() => setShowRollingMean(!showRollingMean)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showRollingMean
                ? "bg-slate-800 border-amber-500/40 text-amber-300"
                : "bg-slate-800/50 border-slate-700 text-slate-400"
            }`}
            title="Toggle Isolation Forest Rolling Mean Baseline"
          >
            {showRollingMean ? (
              <Eye className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>Rolling Baseline</span>
          </button>
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="px-4 sm:px-5 pt-3 border-b border-slate-800/60 bg-slate-950/40 flex flex-wrap gap-2">
        {(["temperature", "relative_humidity", "surface_pressure"] as SensorMetric[]).map(
          (metricKey) => {
            const cfg = metricConfigs[metricKey];
            const Icon = cfg.icon;
            const isSelected = activeMetric === metricKey;
            const latestVal =
              filteredReadings.length > 0
                ? cfg.getValue(filteredReadings[filteredReadings.length - 1])
                : 0;

            return (
              <button
                key={metricKey}
                id={`tab-metric-${metricKey}`}
                onClick={() => setActiveMetric(metricKey)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white border-cyan-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
                }`}
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: isSelected ? cfg.lineColor : undefined }}
                />
                <span>{cfg.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                    isSelected
                      ? "bg-slate-800 text-cyan-300 font-bold"
                      : "bg-slate-800/50 text-slate-400"
                  }`}
                >
                  {cfg.format(latestVal)}
                </span>
              </button>
            );
          }
        )}
      </div>

      {/* Active Reading KPI Bar */}
      {activeReading && (
        <div className="px-4 sm:px-5 py-2.5 bg-slate-900/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Station <strong className="text-white">#{activeReading.location_id}</strong>
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">
              Timestamp: <span className="font-mono text-slate-200">{activeReading.time}</span>
            </span>
            {activeReading.is_anomaly && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                <AlertCircle className="w-3 h-3 text-rose-400" />
                ANOMALY DETECTED
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <div>
              <span className="text-slate-400">Observed: </span>
              <span className="font-bold text-white">
                {currentCfg.format(currentCfg.getValue(activeReading))}
              </span>
            </div>
            {showRollingMean && (
              <div>
                <span className="text-amber-400/80">Mean Baseline: </span>
                <span className="text-amber-300 font-medium">
                  {currentCfg.format(currentCfg.getRolling(activeReading))}
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-400">Δ Change: </span>
              <span
                className={`font-semibold ${
                  Math.abs(currentCfg.getChange(activeReading) ?? 0) > 5
                    ? "text-rose-400"
                    : "text-slate-300"
                }`}
              >
                {(currentCfg.getChange(activeReading) ?? 0) > 0 ? "+" : ""}
                {(currentCfg.getChange(activeReading) ?? 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Dev: </span>
              <span className="text-slate-300">
                {(currentCfg.getDeviation(activeReading) ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SVG Time-Series Chart */}
      <div className="p-4 sm:p-5 relative select-none">
        {filteredReadings.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
            <AlertCircle className="w-8 h-8 text-slate-500" />
            <p className="text-sm">No telemetry records available for this filter.</p>
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto min-w-[650px] overflow-visible"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <defs>
                <linearGradient id={`gradient-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={currentCfg.gradientStart} />
                  <stop offset="100%" stopColor={currentCfg.gradientEnd} />
                </linearGradient>

                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Lines */}
              {yTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={tick.y}
                    x2={padding.left + graphWidth}
                    y2={tick.y}
                    stroke="#1e293b"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={tick.y + 4}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {tick.val.toFixed(0)}
                    {currentCfg.unit}
                  </text>
                </g>
              ))}

              {/* Area Fill */}
              {areaPath && (
                <path d={areaPath} fill={`url(#gradient-${activeMetric})`} />
              )}

              {/* Rolling Mean Baseline Line (Dashed Amber) */}
              {showRollingMean && rollingPath && (
                <path
                  d={rollingPath}
                  fill="none"
                  stroke={currentCfg.meanColor}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />
              )}

              {/* Primary Sensor Reading Line */}
              {mainPath && (
                <path
                  d={mainPath}
                  fill="none"
                  stroke={currentCfg.lineColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
              )}

              {/* Anomaly Indicator Markers */}
              {anomalyPoints.map(({ reading, index }) => {
                const x = getX(index);
                const y = getY(currentCfg.getValue(reading));
                return (
                  <g key={`anomaly-${index}`} className="cursor-pointer">
                    <circle
                      cx={x}
                      cy={y}
                      r="9"
                      fill="#ef4444"
                      opacity="0.3"
                      className="animate-ping"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + graphHeight}
                      stroke="#ef4444"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.5"
                    />
                  </g>
                );
              })}

              {/* Hover Cursor and Hit Boxes */}
              {filteredReadings.map((r, i) => {
                const x = getX(i);
                const val = currentCfg.getValue(r);
                const y = getY(val);
                const isHovered = hoveredIndex === i;

                return (
                  <g key={`hitbox-${i}`}>
                    {/* Invisible vertical slice for smooth hover */}
                    <rect
                      x={x - (graphWidth / pointsCount) / 2}
                      y={padding.top}
                      width={graphWidth / pointsCount}
                      height={graphHeight}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() => setHoveredIndex(i)}
                    />

                    {isHovered && (
                      <>
                        <line
                          x1={x}
                          y1={padding.top}
                          x2={x}
                          y2={padding.top + graphHeight}
                          stroke="#38bdf8"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                        <circle
                          cx={x}
                          cy={y}
                          r="5"
                          fill="#ffffff"
                          stroke={currentCfg.lineColor}
                          strokeWidth="2.5"
                        />
                      </>
                    )}
                  </g>
                );
              })}

              {/* X Axis Time Labels */}
              {filteredReadings.length > 0 && (
                <>
                  <text
                    x={padding.left}
                    y={padding.top + graphHeight + 18}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {filteredReadings[0].time.substring(11, 16)} (T-Start)
                  </text>
                  <text
                    x={padding.left + graphWidth / 2}
                    y={padding.top + graphHeight + 18}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    Telemetry Stream ({filteredReadings.length} readings)
                  </text>
                  <text
                    x={padding.left + graphWidth}
                    y={padding.top + graphHeight + 18}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {filteredReadings[filteredReadings.length - 1].time.substring(11, 16)} (Live)
                  </text>
                </>
              )}
            </svg>
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3 border-t border-slate-800/80 pt-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-0.5 rounded-full"
                style={{ backgroundColor: currentCfg.lineColor }}
              />
              <span className="text-slate-300">Live {currentCfg.label} Telemetry</span>
            </div>

            {showRollingMean && (
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-0.5 border-b border-dashed"
                  style={{ borderColor: currentCfg.meanColor }}
                />
                <span className="text-amber-300/90">Rolling Mean Baseline</span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
              <span className="text-rose-400 font-medium">Anomaly Point Flag</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Hover along timeline to inspect rolling baseline delta
          </div>
        </div>
      </div>
    </div>
  );
};
