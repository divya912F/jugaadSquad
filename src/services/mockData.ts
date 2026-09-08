import { Station, WeatherReading, AlertItem, AlertsSummary } from "../types";
import {
  classifyAnomaly,
  calculateSeverity,
  calculateConfidence,
  generateExplanation,
  getStationHealth,
} from "./anomalyAlgorithms";

export const MOCK_STATIONS: Station[] = [
  { location_id: 101, latitude: 28.6139, longitude: 77.209, name: "SkyGuard Alpha (North)", region: "Sector 4 Station" },
  { location_id: 102, latitude: 19.076, longitude: 72.8777, name: "SkyGuard Beta (West)", region: "Coastal Observator" },
  { location_id: 103, latitude: 13.0827, longitude: 80.2707, name: "SkyGuard Gamma (South)", region: "Peninsula Node" },
  { location_id: 104, latitude: 22.5726, longitude: 88.3639, name: "SkyGuard Delta (East)", region: "Valley Sensor Array" },
];

export function generateInitialWeatherData(): WeatherReading[] {
  const readings: WeatherReading[] = [];
  const baseTime = new Date();
  baseTime.setMinutes(0, 0, 0);

  // Generate 60 readings spread across stations with realistic temporal variations
  // and deliberate sensor anomaly patterns to test the pipeline thoroughly
  for (let i = 59; i >= 0; i--) {
    const timestamp = new Date(baseTime.getTime() - i * 15 * 60 * 1000);
    const station = MOCK_STATIONS[i % MOCK_STATIONS.length];
    const hour = timestamp.getHours();
    const month = timestamp.getMonth() + 1;

    // Normal baseline trends
    const diurnalTemp = Math.sin(((hour - 4) / 24) * 2 * Math.PI) * 6 + 21;
    const baseHumidity = 65 - Math.sin(((hour - 4) / 24) * 2 * Math.PI) * 15;
    const basePressure = 1013.25 - Math.sin((hour / 12) * Math.PI) * 2.5;

    let temp = diurnalTemp + (Math.sin(i * 1.3) * 1.2);
    let humidity = baseHumidity + (Math.cos(i * 1.1) * 2.5);
    let pressure = basePressure + (Math.sin(i * 0.9) * 0.8);

    let tempChange = 0.4 + (Math.random() * 0.5 - 0.25);
    let humChange = 1.2 + (Math.random() * 1.0 - 0.5);
    let pressChange = 0.5 + (Math.random() * 0.4 - 0.2);

    let tempDev = Math.abs(Math.sin(i * 0.7) * 1.5);
    let humDev = Math.abs(Math.cos(i * 0.8) * 3.0);
    let pressDev = Math.abs(Math.sin(i * 0.5) * 1.2);

    let isAnomaly = false;

    // Inject deliberate realistic anomalies matching the backend logic:
    // 1. Temperature spike at reading index 48 (recent)
    if (i === 4) {
      temp += 10.4;
      tempChange = 10.4;
      tempDev = 6.8;
      isAnomaly = true;
    }
    // 2. Humidity spike/drop at reading index 38
    else if (i === 16) {
      humidity -= 24.5;
      humChange = 24.5;
      humDev = 14.8;
      isAnomaly = true;
    }
    // 3. Pressure drop/spike at reading index 26
    else if (i === 28) {
      pressure -= 13.2;
      pressChange = 13.2;
      pressDev = 9.4;
      isAnomaly = true;
    }
    // 4. Stuck temperature sensor at reading index 12 (frozen telemetry line)
    else if (i === 42) {
      tempChange = 0.002; // < 0.01 triggers stuck_temperature_sensor
      tempDev = 2.1;
      isAnomaly = true;
    }
    // 5. Another sudden temperature shock at index 54
    else if (i === 8) {
      temp -= 9.2;
      tempChange = 9.2;
      tempDev = 5.9;
      isAnomaly = true;
    }

    const tempRolling = diurnalTemp;
    const humRolling = baseHumidity;
    const pressRolling = basePressure;

    readings.push({
      location_id: station.location_id,
      latitude: station.latitude,
      longitude: station.longitude,
      time: timestamp.toISOString().replace("T", " ").substring(0, 19),
      temperature: Math.round(temp * 10) / 10,
      relative_humidity: Math.round(Math.max(10, Math.min(100, humidity)) * 10) / 10,
      surface_pressure: Math.round(pressure * 10) / 10,
      temperature_change: Math.round(tempChange * 100) / 100,
      humidity_change: Math.round(humChange * 100) / 100,
      pressure_change: Math.round(pressChange * 100) / 100,
      temperature_rolling_mean: Math.round(tempRolling * 10) / 10,
      humidity_rolling_mean: Math.round(humRolling * 10) / 10,
      pressure_rolling_mean: Math.round(pressRolling * 10) / 10,
      temperature_deviation: Math.round(tempDev * 100) / 100,
      humidity_deviation: Math.round(humDev * 100) / 100,
      pressure_deviation: Math.round(pressDev * 100) / 100,
      hour,
      month,
      is_anomaly: isAnomaly,
    });
  }

  return readings;
}

export function computeAlertsFromReadings(readings: WeatherReading[]): {
  summary: AlertsSummary;
  alerts: AlertItem[];
} {
  const alerts: AlertItem[] = [];

  readings.forEach((row, idx) => {
    // Model prediction criteria: either is_anomaly flag or condition triggers
    const anomalyType = classifyAnomaly(row);
    const isStuck = anomalyType === "stuck_temperature_sensor";
    const isTempSpike = anomalyType === "temperature_spike_drop";
    const isHumSpike = anomalyType === "humidity_spike_drop";
    const isPressSpike = anomalyType === "pressure_spike_drop";

    const isAnomaly = row.is_anomaly || isStuck || isTempSpike || isHumSpike || isPressSpike;

    if (isAnomaly) {
      const { level, score } = calculateSeverity(anomalyType, row);
      const confidence = calculateConfidence(anomalyType, score);
      const explanation = generateExplanation(anomalyType, row);

      alerts.push({
        id: `alert-${row.location_id}-${idx}-${row.time}`,
        location_id: row.location_id,
        time: row.time,
        temperature: row.temperature,
        humidity: row.relative_humidity,
        pressure: row.surface_pressure,
        status: "anomaly",
        type: anomalyType,
        severity: level,
        severity_score: score,
        confidence,
        explanation,
      });
    }
  });

  // Sort newest first
  alerts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const totalReadings = readings.length;
  const anomalyCount = alerts.length;
  const normalCount = Math.max(0, totalReadings - anomalyCount);
  const anomalyPercentage = totalReadings > 0 ? (anomalyCount / totalReadings) * 100 : 0;
  const stationHealth = getStationHealth(anomalyPercentage);

  return {
    summary: {
      total_readings: totalReadings,
      normal_readings: normalCount,
      anomalies: anomalyCount,
      anomaly_percentage: Math.round(anomalyPercentage * 100) / 100,
      station_health: stationHealth,
    },
    alerts,
  };
}
