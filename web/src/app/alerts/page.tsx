import { redirect } from "next/navigation";
import { isOfficer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type AlertRow = {
  alert_id: string;
  sensor_id: string;
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  resolved: boolean;
  created_at: string;
};

type SensorRow = {
  sensor_id: string;
  gps_lat: number | null;
  gps_lng: number | null;
  install_date: string | null;
};

type LatestReading = {
  temperature: number | null;
  humidity: number | null;
  movement: boolean | null;
  recorded_at: string;
};

const SEVERITY_STYLES: Record<AlertRow["severity"], string> = {
  critical: "bg-danger text-cream",
  high: "bg-chartreuse text-pine",
  medium: "bg-sand text-moss",
  low: "bg-sprout text-emerald",
};

function humanise(condition: string) {
  return condition.replace(/_/g, " ");
}

function shortSensor(sensorId: string) {
  return `Sensor ${sensorId.slice(0, 8)}`;
}

export default async function AlertsPage() {
  if (!(await isOfficer())) redirect("/records");

  const supabase = await createClient();

  const { data: alertRows, error: alertsError } = await supabase
    .from("alerts")
    .select("alert_id, sensor_id, alert_type, severity, resolved, created_at")
    .order("created_at", { ascending: false })
    .limit(25);

  const { data: sensorRows, error: sensorsError } = await supabase
    .from("sensors")
    .select("sensor_id, gps_lat, gps_lng, install_date")
    .order("install_date", { ascending: true });

  const sensors: SensorRow[] = sensorRows ?? [];

  const latestBySensor = await Promise.all(
    sensors.map(async (sensor) => {
      const { data } = await supabase
        .from("sensor_readings")
        .select("temperature, humidity, movement, recorded_at")
        .eq("sensor_id", sensor.sensor_id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return { sensor, reading: (data ?? null) as LatestReading | null };
    }),
  );

  const alerts: AlertRow[] = alertRows ?? [];
  const error = alertsError?.message ?? sensorsError?.message ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-pine sm:text-4xl">
          Threat alerts
        </h1>
        <p className="mt-2 text-moss">
          Live feed from the IoT monitoring service (simulated sensors) at the
          Niah field sites.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-danger/30 bg-white px-5 py-4 text-sm text-danger">
          Could not load sensor data from the database: {error}
        </div>
      )}

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold tracking-tight text-pine">
            Recent alerts
          </h2>
          <span className="text-sm text-moss">
            {alerts.length} most recent
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-pine/15 bg-sand/60 px-6 py-12 text-center">
            <p className="text-sm text-moss">
              No alerts — all monitored conditions normal.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-pine/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-sand text-xs uppercase tracking-wide text-moss">
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Severity</th>
                  <th className="px-4 py-3 font-semibold">Sensor</th>
                  <th className="px-4 py-3 font-semibold">Condition</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr
                    key={alert.alert_id}
                    className="border-t border-pine/10 text-pine"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-moss">
                      {new Date(alert.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          SEVERITY_STYLES[alert.severity] ?? "bg-sand text-moss"
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      {shortSensor(alert.sensor_id)}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {humanise(alert.alert_type)}
                    </td>
                    <td className="px-4 py-3 text-moss">
                      {alert.resolved ? "Resolved" : "Open"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold tracking-tight text-pine">
            Latest reading per sensor
          </h2>
          <span className="text-sm text-moss">
            {sensors.length} sensor{sensors.length === 1 ? "" : "s"} registered
          </span>
        </div>

        {sensors.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-pine/15 bg-sand/60 px-6 py-12 text-center">
            <p className="text-sm text-moss">No sensors registered yet.</p>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {latestBySensor.map(({ sensor, reading }) => (
              <li
                key={sensor.sensor_id}
                className="rounded-2xl border border-pine/10 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-pine">
                      {shortSensor(sensor.sensor_id)}
                    </p>
                    <p className="mt-1 text-sm text-moss">
                      {sensor.gps_lat != null && sensor.gps_lng != null
                        ? `${sensor.gps_lat.toFixed(4)}, ${sensor.gps_lng.toFixed(4)}`
                        : "Location not set"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      reading
                        ? reading.movement
                          ? "bg-chartreuse text-pine"
                          : "bg-sprout text-emerald"
                        : "bg-sand text-moss"
                    }`}
                  >
                    {reading
                      ? reading.movement
                        ? "Movement"
                        : "Steady"
                      : "No data"}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-pine/10 pt-4 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-moss">
                      Temp
                    </dt>
                    <dd className="mt-1 font-semibold text-pine">
                      {reading?.temperature != null
                        ? `${reading.temperature.toFixed(1)} °C`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-moss">
                      Humidity
                    </dt>
                    <dd className="mt-1 font-semibold text-pine">
                      {reading?.humidity != null
                        ? `${reading.humidity.toFixed(0)} %`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-moss">
                      Last seen
                    </dt>
                    <dd className="mt-1 font-semibold text-pine">
                      {reading
                        ? new Date(reading.recorded_at).toLocaleString()
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
