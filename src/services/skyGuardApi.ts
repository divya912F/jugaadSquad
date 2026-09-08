import {
  Station,
  WeatherReading,
  AlertsResponse,
  DetectResponse,
  SimulateResponse,
  ApiConfig,
} from "../types";
import {
  generateInitialWeatherData,
  computeAlertsFromReadings,
  MOCK_STATIONS,
} from "./mockData";
import {
  classifyAnomaly,
  calculateSeverity,
  calculateConfidence,
  generateExplanation,
} from "./anomalyAlgorithms";

// Persistent state in memory for standalone/fallback mode
let localWeatherReadings: WeatherReading[] = generateInitialWeatherData();

export class SkyGuardApiClient {
  private config: ApiConfig;
  private onConfigChange?: (config: ApiConfig) => void;

  constructor(
    initialBaseUrl = "http://localhost:8000",
    onConfigChange?: (config: ApiConfig) => void
  ) {
    this.config = {
      baseUrl: initialBaseUrl,
      isDemoMode: false,
      isConnected: false,
      latencyMs: null,
      lastChecked: null,
      errorMessage: null,
    };
    this.onConfigChange = onConfigChange;
  }

  public getConfig(): ApiConfig {
    return { ...this.config };
  }

  public setBaseUrl(url: string) {
    // Strip trailing slash
    this.config.baseUrl = url.trim().replace(/\/+$/, "");
    this.notify();
  }

  public setDemoMode(enableDemo: boolean) {
    this.config.isDemoMode = enableDemo;
    this.notify();
  }

  private notify() {
    if (this.onConfigChange) {
      this.onConfigChange({ ...this.config });
    }
  }

  public async checkHealth(): Promise<{
    connected: boolean;
    statusText: string;
    latencyMs: number;
  }> {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${this.config.baseUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - start);

      if (res.ok) {
        const data = await res.json();
        this.config.isConnected = true;
        this.config.latencyMs = latencyMs;
        this.config.lastChecked = new Date().toLocaleTimeString();
        this.config.errorMessage = null;
        this.notify();
        return { connected: true, statusText: data.status || "healthy", latencyMs };
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      this.config.isConnected = false;
      this.config.latencyMs = null;
      this.config.lastChecked = new Date().toLocaleTimeString();
      this.config.errorMessage =
        err.name === "AbortError"
          ? "Connection timed out"
          : err.message || "Failed to reach backend";
      this.notify();
      return {
        connected: false,
        statusText: "offline",
        latencyMs,
      };
    }
  }

  public async getStations(): Promise<Station[]> {
    if (!this.config.isDemoMode) {
      try {
        const res = await fetch(`${this.config.baseUrl}/stations`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.stations) && json.stations.length > 0) {
            return json.stations.map((s: any, idx: number) => ({
              location_id: s.location_id ?? idx + 101,
              latitude: Number(s.latitude),
              longitude: Number(s.longitude),
              name: `Station #${s.location_id}`,
              region: `Sensor Array ${s.location_id}`,
            }));
          }
        }
      } catch (e) {
        // Fall back to simulation data
      }
    }
    return MOCK_STATIONS;
  }

  public async getWeather(): Promise<WeatherReading[]> {
    if (!this.config.isDemoMode) {
      try {
        const res = await fetch(`${this.config.baseUrl}/weather`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            return json.data.map((row: any) => ({
              ...row,
              location_id: Number(row.location_id),
              temperature: Number(row.temperature),
              relative_humidity: Number(row.relative_humidity ?? row.humidity),
              surface_pressure: Number(row.surface_pressure ?? row.pressure),
            }));
          }
        }
      } catch (e) {
        // fallback
      }
    }
    return [...localWeatherReadings];
  }

  public async getAlerts(): Promise<AlertsResponse> {
    if (!this.config.isDemoMode) {
      try {
        const res = await fetch(`${this.config.baseUrl}/alerts`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === "success" && json.summary) {
            return json as AlertsResponse;
          }
        }
      } catch (e) {
        // fallback
      }
    }
    const computed = computeAlertsFromReadings(localWeatherReadings);
    return {
      status: "success",
      summary: computed.summary,
      alerts: computed.alerts,
    };
  }

  public async detect(): Promise<DetectResponse> {
    if (!this.config.isDemoMode) {
      try {
        const res = await fetch(`${this.config.baseUrl}/detect`);
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        // fallback
      }
    }
    // Fallback detection on the newest reading
    const sample = localWeatherReadings[localWeatherReadings.length - 1];
    const anomalyType = classifyAnomaly(sample);
    const status = sample.is_anomaly || anomalyType !== "general_anomaly" ? "anomaly" : "normal";

    return {
      location_id: sample.location_id,
      time: sample.time,
      temperature: sample.temperature,
      humidity: sample.relative_humidity,
      pressure: sample.surface_pressure,
      status: status as "anomaly" | "normal",
    };
  }

  public async simulateAnomaly(customParams?: {
    location_id?: number;
    normal_temp?: number;
    anomaly_temp?: number;
    humidity?: number;
    pressure?: number;
  }): Promise<SimulateResponse> {
    if (!this.config.isDemoMode && !customParams) {
      try {
        const res = await fetch(`${this.config.baseUrl}/simulate-anomaly`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (e) {
        // fallback
      }
    }

    // Exact logic from the backend simulate_anomaly endpoint:
    const normal_temperature = customParams?.normal_temp ?? 13.2;
    const anomaly_temperature = customParams?.anomaly_temp ?? 29.6;
    const temperature_change = anomaly_temperature - normal_temperature;

    let severity: "Low" | "Medium" | "High" | "Critical";
    let severity_score: number;

    if (Math.abs(temperature_change) >= 12) {
      severity = "Critical";
      severity_score = 90;
    } else if (Math.abs(temperature_change) >= 8) {
      severity = "High";
      severity_score = 75;
    } else {
      severity = "Medium";
      severity_score = 50;
    }

    const confidence = Math.min(95, 70 + Math.abs(temperature_change) * 2);

    const explanation = `Sudden temperature change of ${temperature_change.toFixed(
      1
    )}°C detected compared with the recent weather pattern.`;

    const simulatedAlert = {
      temperature: anomaly_temperature,
      normal_temperature,
      humidity: customParams?.humidity ?? 78.0,
      pressure: customParams?.pressure ?? 993.4,
      status: "anomaly" as const,
      type: "temperature_spike_drop" as const,
      severity,
      severity_score,
      confidence: Math.round(confidence * 100) / 100,
      explanation,
      sensor_health: "Warning" as const,
    };

    // Prepend to local readings to update charts and table
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
    const newReading: WeatherReading = {
      location_id: customParams?.location_id ?? 101,
      latitude: 28.6139,
      longitude: 77.209,
      time: nowStr,
      temperature: anomaly_temperature,
      relative_humidity: simulatedAlert.humidity,
      surface_pressure: simulatedAlert.pressure,
      temperature_change,
      humidity_change: 4.2,
      pressure_change: 1.8,
      temperature_rolling_mean: normal_temperature,
      humidity_rolling_mean: 72.0,
      pressure_rolling_mean: 1012.0,
      temperature_deviation: Math.abs(temperature_change) * 0.7,
      humidity_deviation: 3.5,
      pressure_deviation: 1.2,
      hour: new Date().getHours(),
      month: new Date().getMonth() + 1,
      is_anomaly: true,
    };

    localWeatherReadings = [...localWeatherReadings, newReading];

    return {
      status: "success",
      demo: true,
      alert: simulatedAlert,
    };
  }

  public resetLocalData() {
    localWeatherReadings = generateInitialWeatherData();
  }
}
