import { AnomalyType, SeverityLevel, StationHealth } from "../types";

export interface ClassificationResult {
  type: AnomalyType;
  severity: SeverityLevel;
  severity_score: number;
  confidence: number;
  explanation: string;
}

export function classifyAnomaly(row: {
  temperature_change?: number;
  humidity_change?: number;
  pressure_change?: number;
  temperature_deviation?: number;
  humidity_deviation?: number;
  pressure_deviation?: number;
}): AnomalyType {
  const temperature_change = Math.abs(Number(row.temperature_change ?? 0));
  const humidity_change = Math.abs(Number(row.humidity_change ?? 0));
  const pressure_change = Math.abs(Number(row.pressure_change ?? 0));
  const temperature_deviation = Math.abs(Number(row.temperature_deviation ?? 0));
  const humidity_deviation = Math.abs(Number(row.humidity_deviation ?? 0));
  const pressure_deviation = Math.abs(Number(row.pressure_deviation ?? 0));

  // Stuck sensor: virtually zero change across readings
  if (temperature_change < 0.01) {
    return "stuck_temperature_sensor";
  }

  // Pressure anomaly
  if (pressure_change > 10 && pressure_deviation > 8) {
    return "pressure_spike_drop";
  }

  // Humidity anomaly
  if (humidity_change > 18 && humidity_deviation > 12) {
    return "humidity_spike_drop";
  }

  // Temperature anomaly
  if (temperature_change > 8 && temperature_deviation > 5) {
    return "temperature_spike_drop";
  }

  // General anomaly
  return "general_anomaly";
}

export function calculateSeverity(
  anomaly_type: AnomalyType,
  row: {
    temperature_change?: number;
    humidity_change?: number;
    pressure_change?: number;
    temperature_deviation?: number;
    humidity_deviation?: number;
    pressure_deviation?: number;
  }
): { level: SeverityLevel; score: number } {
  const temperature_change = Math.abs(Number(row.temperature_change ?? 0));
  const humidity_change = Math.abs(Number(row.humidity_change ?? 0));
  const pressure_change = Math.abs(Number(row.pressure_change ?? 0));
  const temperature_deviation = Math.abs(Number(row.temperature_deviation ?? 0));
  const humidity_deviation = Math.abs(Number(row.humidity_deviation ?? 0));
  const pressure_deviation = Math.abs(Number(row.pressure_deviation ?? 0));

  let score = 50;

  if (anomaly_type === "stuck_temperature_sensor") {
    score = 70;
  } else if (anomaly_type === "temperature_spike_drop") {
    score =
      60 * Math.min(temperature_change / 8, 1) +
      40 * Math.min(temperature_deviation / 5, 1);
  } else if (anomaly_type === "humidity_spike_drop") {
    score =
      60 * Math.min(humidity_change / 18, 1) +
      40 * Math.min(humidity_deviation / 12, 1);
  } else if (anomaly_type === "pressure_spike_drop") {
    score =
      60 * Math.min(pressure_change / 10, 1) +
      40 * Math.min(pressure_deviation / 8, 1);
  } else {
    score = 50;
  }

  score = Math.max(0, Math.min(100, score));

  let level: SeverityLevel = "Low";
  if (score <= 30) {
    level = "Low";
  } else if (score <= 60) {
    level = "Medium";
  } else if (score <= 80) {
    level = "High";
  } else {
    level = "Critical";
  }

  return { level, score: Math.round(score * 100) / 100 };
}

export function calculateConfidence(
  anomaly_type: AnomalyType,
  severity_score: number
): number {
  let confidence: number;

  if (anomaly_type === "pressure_spike_drop") {
    confidence = severity_score * 0.95;
  } else if (anomaly_type === "temperature_spike_drop") {
    confidence = severity_score * 0.9;
  } else if (anomaly_type === "humidity_spike_drop") {
    confidence = severity_score * 0.85;
  } else if (anomaly_type === "stuck_temperature_sensor") {
    confidence = severity_score * 0.9;
  } else {
    confidence = severity_score * 0.75;
  }

  confidence = Math.max(0, Math.min(95, confidence));
  return Math.round(confidence * 100) / 100;
}

export function generateExplanation(
  anomaly_type: AnomalyType,
  row: {
    temperature_change?: number;
    humidity_change?: number;
    pressure_change?: number;
  }
): string {
  const temperature_change = Math.abs(Number(row.temperature_change ?? 0));
  const humidity_change = Math.abs(Number(row.humidity_change ?? 0));
  const pressure_change = Math.abs(Number(row.pressure_change ?? 0));

  if (anomaly_type === "temperature_spike_drop") {
    return `Sudden temperature change of ${temperature_change.toFixed(1)}°C detected compared with the recent weather pattern.`;
  } else if (anomaly_type === "humidity_spike_drop") {
    return `Sudden humidity change of ${humidity_change.toFixed(1)}% detected compared with the recent weather pattern.`;
  } else if (anomaly_type === "pressure_spike_drop") {
    return `Sudden atmospheric pressure change of ${pressure_change.toFixed(1)} hPa detected compared with the recent weather pattern.`;
  } else if (anomaly_type === "stuck_temperature_sensor") {
    return "Temperature sensor value remained unchanged across multiple consecutive readings.";
  } else {
    return "Unusual multivariate weather pattern detected by the AI anomaly detection system.";
  }
}

export function getStationHealth(anomalyPercentage: number): StationHealth {
  if (anomalyPercentage < 5) return "Healthy";
  if (anomalyPercentage < 10) return "Warning";
  return "Critical";
}
