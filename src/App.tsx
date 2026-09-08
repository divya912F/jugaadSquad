import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "./components/Header";
import { SummaryCards } from "./components/SummaryCards";
import { TelemetryCharts } from "./components/TelemetryCharts";
import { AlertsFeed } from "./components/AlertsFeed";
import { StationMap } from "./components/StationMap";
import { RawDataTable } from "./components/RawDataTable";
import { AnomalySimulatorModal } from "./components/AnomalySimulatorModal";
import { SingleDetectModal } from "./components/SingleDetectModal";
import { BackendConfigModal } from "./components/BackendConfigModal";
import { SkyGuardApiClient } from "./services/skyGuardApi";
import {
  Station,
  WeatherReading,
  AlertsResponse,
  ApiConfig,
  SimulateResponse,
} from "./types";
import {
  Activity,
  Radio,
  Table,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function App() {
  // API client instance
  const [apiClient] = useState(() => new SkyGuardApiClient("http://localhost:8000"));
  const [apiConfig, setApiConfig] = useState<ApiConfig>(apiClient.getConfig());

  // Data states
  const [stations, setStations] = useState<Station[]>([]);
  const [readings, setReadings] = useState<WeatherReading[]>([]);
  const [alertsResponse, setAlertsResponse] = useState<AlertsResponse | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<number | "all">("all");

  // UI states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "stations" | "raw_data">("overview");

  // Modals
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isDetectOpen, setIsDetectOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toast Notification
  const [notification, setNotification] = useState<{
    type: "success" | "warning" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const showNotification = (
    title: string,
    message: string,
    type: "success" | "warning" | "error" | "info" = "info"
  ) => {
    setNotification({ title, message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 5000);
  };

  // Load data function
  const loadData = useCallback(
    async (showLoadingSpinner = false) => {
      if (showLoadingSpinner) setIsRefreshing(true);
      try {
        // Run health check silently
        await apiClient.checkHealth();
        setApiConfig(apiClient.getConfig());

        // Fetch stations, weather, and alerts in parallel
        const [stationsRes, weatherRes, alertsRes] = await Promise.all([
          apiClient.getStations(),
          apiClient.getWeather(),
          apiClient.getAlerts(),
        ]);

        setStations(stationsRes);
        setReadings(weatherRes);
        setAlertsResponse(alertsRes);
      } catch (err) {
        console.error("Failed to load SkyGuard data:", err);
      } finally {
        if (showLoadingSpinner) setIsRefreshing(false);
      }
    },
    [apiClient]
  );

  // Initial load
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Auto-refresh interval (every 10 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  // Handle simulation
  const handleSimulate = async (params?: any): Promise<SimulateResponse> => {
    const res = await apiClient.simulateAnomaly(params);
    showNotification(
      "Anomaly Injection Processed",
      `${res.alert.type.toUpperCase()}: ${res.alert.explanation} (Severity: ${res.alert.severity})`,
      "warning"
    );
    // Reload data immediately to reflect simulated anomaly in charts & alerts
    await loadData(false);
    return res;
  };

  // Summary object fallback
  const summary = alertsResponse?.summary ?? {
    total_readings: readings.length,
    normal_readings: readings.filter((r) => !r.is_anomaly).length,
    anomalies: readings.filter((r) => r.is_anomaly).length,
    anomaly_percentage:
      readings.length > 0
        ? (readings.filter((r) => r.is_anomaly).length / readings.length) * 100
        : 0,
    station_health: "Healthy" as const,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Header */}
      <Header
        apiConfig={apiConfig}
        isRefreshing={isRefreshing}
        onRefresh={() => loadData(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSimulate={() => setIsSimulatorOpen(true)}
        onOpenDetect={() => setIsDetectOpen(true)}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh((prev) => !prev)}
      />

      {/* Toast Notification Banner */}
      {notification && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              {notification.type === "warning" ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : notification.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              <div>
                <strong className="text-white font-semibold mr-1">
                  {notification.title}:
                </strong>
                <span className="text-slate-300">{notification.message}</span>
              </div>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              id="tab-overview"
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-cyan-950/70 text-cyan-300 border border-cyan-600/70 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Telemetry & Alerts</span>
            </button>

            <button
              id="tab-stations"
              onClick={() => setActiveTab("stations")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "stations"
                  ? "bg-cyan-950/70 text-cyan-300 border border-cyan-600/70 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Station Nodes ({stations.length})</span>
            </button>

            <button
              id="tab-rawdata"
              onClick={() => setActiveTab("raw_data")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "raw_data"
                  ? "bg-cyan-950/70 text-cyan-300 border border-cyan-600/70 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Table className="w-4 h-4 text-cyan-400" />
              <span>Raw Dataset ({readings.length})</span>
            </button>
          </div>

          {selectedStationId !== "all" && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Filtering:</span>
              <span className="px-2.5 py-1 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-mono font-semibold">
                Station #{selectedStationId}
              </span>
              <button
                onClick={() => setSelectedStationId("all")}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* KPI Metrics Summary */}
        <SummaryCards
          summary={summary}
          selectedStationId={selectedStationId}
        />

        {/* Tab 1: Primary Overview (Telemetry Charts + Alerts Feed) */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 cols: Interactive Sensor Telemetry Charts */}
            <div className="lg:col-span-7 space-y-6">
              <TelemetryCharts
                readings={readings}
                stations={stations}
                selectedStationId={selectedStationId}
                onSelectStation={setSelectedStationId}
              />

              {/* Station Quick Grid */}
              <StationMap
                stations={stations}
                readings={readings}
                alerts={alertsResponse?.alerts || []}
                selectedStationId={selectedStationId}
                onSelectStation={setSelectedStationId}
              />
            </div>

            {/* Right 5 cols: Live Anomaly Alerts Feed */}
            <div className="lg:col-span-5">
              <AlertsFeed
                alerts={alertsResponse?.alerts || []}
                selectedStationId={selectedStationId}
                onSelectStation={setSelectedStationId}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Station Nodes Focus */}
        {activeTab === "stations" && (
          <div className="space-y-6">
            <StationMap
              stations={stations}
              readings={readings}
              alerts={alertsResponse?.alerts || []}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
            />

            <TelemetryCharts
              readings={readings}
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
            />
          </div>
        )}

        {/* Tab 3: Raw Weather Log */}
        {activeTab === "raw_data" && (
          <div className="space-y-6">
            <RawDataTable
              readings={readings}
              selectedStationId={selectedStationId}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">SkyGuard AI</span>
            <span>• Weather Sensor Anomaly Detection System</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>FastAPI: <code className="text-slate-300 font-mono">{apiConfig.baseUrl}</code></span>
            <span>Isolation Forest ML</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              API Configuration
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AnomalySimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSimulate={handleSimulate}
        onRefreshData={() => loadData(false)}
      />

      <SingleDetectModal
        isOpen={isDetectOpen}
        onClose={() => setIsDetectOpen(false)}
        onDetect={() => apiClient.detect()}
      />

      <BackendConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiConfig={apiConfig}
        onUpdateBaseUrl={(url) => {
          apiClient.setBaseUrl(url);
          setApiConfig(apiClient.getConfig());
        }}
        onToggleDemoMode={(enabled) => {
          apiClient.setDemoMode(enabled);
          setApiConfig(apiClient.getConfig());
        }}
        onCheckHealth={() => apiClient.checkHealth()}
        onResetData={() => {
          apiClient.resetLocalData();
          loadData(true);
          showNotification("Data Reset", "Simulation state restored to baseline readings.", "info");
        }}
      />
    </div>
  );
}
