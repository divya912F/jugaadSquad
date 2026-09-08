export type AnomalyType =
  | "stuck_temperature_sensor"
  | "temperature_spike_drop"
  | "humidity_spike_drop"
  | "pressure_spike_drop"
  | "general_anomaly";

export type SeverityLevel = "Low" | "Medium" | "High" | "Critical";

export type StationHealth = "Healthy" | "Warning" | "Critical";

export interface Station {
  location_id: number;
  latitude: number;
  longitude: number;
  name?: string;
  region?: string;
}

export interface WeatherReading {
  location_id: number;
  time: string;
  temperature: number;
  relative_humidity: number;
  surface_pressure: number;
  temperature_change?: number;
  humidity_change?: number;
  pressure_change?: number;
  temperature_rolling_mean?: number;
  humidity_rolling_mean?: number;
  pressure_rolling_mean?: number;
  temperature_deviation?: number;
  humidity_deviation?: number;
  pressure_deviation?: number;
  hour?: number;
  month?: number;
  latitude?: number;
  longitude?: number;
  is_anomaly?: boolean;
}

export interface AlertItem {
  id?: string;
  location_id: number;
  time: string;
  temperature: number;
  humidity: number;
  pressure: number;
  status: "anomaly";
  type: AnomalyType;
  severity: SeverityLevel;
  severity_score: number;
  confidence: number;
  explanation: string;
}

export interface AlertsSummary {
  total_readings: number;
  normal_readings: number;
  anomalies: number;
  anomaly_percentage: number;
  station_health: StationHealth;
}

export interface AlertsResponse {
  status: string;
  summary: AlertsSummary;
  alerts: AlertItem[];
}

export interface DetectResponse {
  location_id: number;
  time: string;
  temperature: number;
  humidity: number;
  pressure: number;
  status: "anomaly" | "normal";
}

export interface SimulatedAlert {
  temperature: number;
  normal_temperature: number;
  humidity: number;
  pressure: number;
  status: "anomaly";
  type: AnomalyType;
  severity: SeverityLevel;
  severity_score: number;
  confidence: number;
  explanation: string;
  sensor_health: "Healthy" | "Warning" | "Critical";
}

export interface SimulateResponse {
  status: string;
  demo: boolean;
  alert: SimulatedAlert;
}

export interface ApiConfig {
  baseUrl: string;
  isDemoMode: boolean;
  isConnected: boolean;
  latencyMs: number | null;
  lastChecked: string | null;
  errorMessage: string | null;
}
