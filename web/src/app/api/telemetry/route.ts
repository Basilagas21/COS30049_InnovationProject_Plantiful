import { isOfficer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid, rangeStart, type ThreatAlert, type TelemetryHistory, type TelemetryRange } from "@/lib/telemetry";

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
        (sensorId && !isUuid(sensorId))) {
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
    // Resolution audit columns exist only after 013_alert_resolution.sql; fall back without them.
    const alertQuery = (columns: string) => {
      let query = client.from("alerts")
        .select(columns, { count: "exact" })
        .lte("created_at", new Date(now).toISOString())
        .order("created_at", { ascending: false }).order("alert_id").limit(100);
      if (sensorId) query = query.eq("sensor_id", sensorId);
      if (start) query = query.gte("created_at", start);
      return query;
    };
    const baseColumns = "alert_id, sensor_id, alert_type, severity, resolved, created_at";
    let openQuery = client.from("alerts").select("alert_id", { head: true, count: "exact" }).eq("resolved", false);
    if (sensorId) openQuery = openQuery.eq("sensor_id", sensorId);
    const [firstAlerts, open, latest] = await Promise.all([
      alertQuery(`${baseColumns}, resolved_by, resolved_at`), openQuery,
      Promise.all(selected.map(async (sensor) => {
        const { data, error } = await client.from("sensor_readings")
          .select("temperature, humidity, movement, soil_moisture, rain, recorded_at")
          .eq("sensor_id", sensor.sensor_id).order("recorded_at", { ascending: false }).limit(1).maybeSingle();
        return { sensor, reading: data, error: error ? "Unable to read this sensor; check connection and RLS permissions." : null };
      })),
    ]);
    let alerts = firstAlerts;
    const missingColumn = firstAlerts.error?.code === "42703" || firstAlerts.error?.code === "PGRST204";
    const resolutionReady = !missingColumn;
    if (!resolutionReady) alerts = await alertQuery(baseColumns);
    if (alerts.error || open.error) return json({ error: "Could not load alerts. Previous results may be outdated; retry." }, 503);
    const alertRows = (alerts.data ?? []) as unknown as ThreatAlert[];
    // Resolver names are best effort: if user_profiles RLS hides a profile, the UI says "an officer".
    const resolverIds = [...new Set(alertRows.flatMap((a) => (a.resolved_by ? [a.resolved_by] : [])))];
    const names = new Map<string, string>();
    if (resolverIds.length) {
      const { data: profiles } = await client.from("user_profiles").select("user_id, name").in("user_id", resolverIds);
      for (const profile of profiles ?? []) names.set(profile.user_id, profile.name);
    }
    return json({ checkedAt: new Date().toISOString(), sensors: sensors ?? [], latest,
      alerts: alertRows.map((a) => ({ ...a, resolved_by_name: a.resolved_by ? names.get(a.resolved_by) ?? null : null })),
      alertCount: alerts.count ?? 0, openCount: open.count ?? 0, resolutionReady });
  } catch {
    return json({ error: "Monitoring request failed. Check your session and connection, then retry." }, 503);
  }
}
