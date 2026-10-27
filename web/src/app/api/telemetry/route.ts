import { isOfficer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rangeStart, type TelemetryHistory, type TelemetryRange } from "@/lib/telemetry";

// The hand-written Database type declares `Functions: Record<string, never>`.
// Adding monitoring_history there flips the client into strict select-parser
// mode, which then rejects the empty Relationships metadata and breaks every
// nested query in the app. Type the RPC call locally instead.
type HistoryRpc = {
  data: TelemetryHistory | null;
  error: { code?: string; message?: string } | null;
};

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers });

export async function GET(request: Request) {
  try {
    if (!(await isOfficer())) return json({ error: "Sign in as an officer or administrator to view telemetry." }, 403);
    const params = new URL(request.url).searchParams;
    const range = params.get("range") ?? "1d";
    const sensorId = params.get("sensor") || null;
    const mode = params.get("mode") ?? "live";
    if (!["1d", "5d", "7d", "all"].includes(range) || !["live", "history"].includes(mode) ||
        (sensorId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sensorId))) {
      return json({ error: "Invalid monitoring filter." }, 400);
    }
    const client = await createClient();
    if (mode === "history") {
      const rpc = client.rpc.bind(client) as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<HistoryRpc>;
      const { data, error } = await rpc("monitoring_history", {
        p_range: range, ...(sensorId ? { p_sensor: sensorId } : {}),
      });
      if (error) {
        const missing = error.code === "PGRST202" || error.code === "42883";
        return json({ error: missing
          ? "History setup required: run backend/supabase/migrations/012_monitoring_history.sql in Supabase SQL Editor, then refresh. Live readings remain available."
          : "Could not load history. Retry and check the database function and connection." }, 503);
      }
      return json(data);
    }
    const now = Date.now();
    const start = rangeStart(range as TelemetryRange, now);
    const { data: sensors, error: sensorsError } = await client.from("sensors")
      .select("sensor_id, gps_lat, gps_lng").order("sensor_id");
    if (sensorsError) return json({ error: "Could not load sensors. Check your connection and permissions." }, 503);
    const selected = (sensors ?? []).filter((sensor) => !sensorId || sensor.sensor_id === sensorId);
    let alertQuery = client.from("alerts")
      .select("alert_id, sensor_id, alert_type, severity, resolved, created_at", { count: "exact" })
      .lte("created_at", new Date(now).toISOString())
      .order("created_at", { ascending: false }).order("alert_id").limit(100);
    let openQuery = client.from("alerts").select("alert_id", { head: true, count: "exact" }).eq("resolved", false);
    if (sensorId) { alertQuery = alertQuery.eq("sensor_id", sensorId); openQuery = openQuery.eq("sensor_id", sensorId); }
    if (start) alertQuery = alertQuery.gte("created_at", start);
    const [alerts, open, latest] = await Promise.all([
      alertQuery, openQuery,
      Promise.all(selected.map(async (sensor) => {
        const { data, error } = await client.from("sensor_readings")
          .select("temperature, humidity, movement, soil_moisture, rain, recorded_at")
          .eq("sensor_id", sensor.sensor_id).order("recorded_at", { ascending: false }).limit(1).maybeSingle();
        return { sensor, reading: data, error: error ? "Unable to read this sensor; check connection and RLS permissions." : null };
      })),
    ]);
    if (alerts.error || open.error) return json({ error: "Could not load alerts. Previous results may be outdated; retry." }, 503);
    return json({ checkedAt: new Date().toISOString(), sensors: sensors ?? [], latest,
      alerts: alerts.data ?? [], alertCount: alerts.count ?? 0, openCount: open.count ?? 0 });
  } catch {
    return json({ error: "Monitoring request failed. Check your session and connection, then retry." }, 503);
  }
}
