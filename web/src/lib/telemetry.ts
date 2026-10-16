export type TelemetryRange = "1d" | "5d" | "7d" | "all";
export const RANGES: Record<TelemetryRange, string> = {
  "1d": "Last 24 hours", "5d": "Last 5 days", "7d": "Last 7 days", all: "All history",
};
export const STALE_AFTER_MS = 60_000;

export type Reading = {
  temperature: number | null;
  humidity: number | null;
  soil_moisture: number | null;
  movement: boolean | null;
  rain: boolean | null;
  recorded_at: string;
};
export type Sensor = {
  sensor_id: string;
  gps_lat: number | null;
  gps_lng: number | null;
};
export type ThreatAlert = {
  alert_id: string;
  sensor_id: string;
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  resolved: boolean;
  created_at: string;
};
export type LiveTelemetry = {
  checkedAt: string;
  sensors: Sensor[];
  latest: { sensor: Sensor; reading: Reading | null; error: string | null }[];
  alerts: ThreatAlert[];
  alertCount: number;
  openCount: number;
};
export type HistoryPoint = {
  time: string;
  samples: number;
  temperature: number | null;
  temperature_min: number | null;
  temperature_max: number | null;
  humidity: number | null;
  humidity_min: number | null;
  humidity_max: number | null;
  soil_moisture: number | null;
  soil_moisture_min: number | null;
  soil_moisture_max: number | null;
  movement_samples: number;
  rain_samples: number;
};
export type TelemetryHistory = {
  start: string;
  end: string;
  bucket_seconds: number;
  points: HistoryPoint[];
};

export function rangeStart(range: TelemetryRange, now: number): string | null {
  const days = { "1d": 1, "5d": 5, "7d": 7, all: 0 }[range];
  return days ? new Date(now - days * 86_400_000).toISOString() : null;
}

export function readingStatus(reading: Reading | null, now: number): string {
  if (!reading) return "No data";
  const age = now - Date.parse(reading.recorded_at);
  if (!Number.isFinite(age) || age < -60_000) return "Check clock";
  if (age > STALE_AFTER_MS) return "Stale";
  if (reading.temperature != null && reading.temperature >= 40) return "Critical";
  if ((reading.temperature != null && reading.temperature >= 36) ||
      (reading.humidity != null && reading.humidity <= 40) || reading.movement) return "Warning";
  if (reading.temperature == null || reading.humidity == null || reading.movement == null) return "Incomplete";
  return "Normal";
}

export function overallStatus(statuses: string[]): string {
  if (!statuses.length) return "No data";
  for (const status of ["Critical", "Warning", "Read error", "Check clock", "Stale", "No data", "Incomplete"]) {
    if (statuses.includes(status)) return status;
  }
  return "Normal";
}
