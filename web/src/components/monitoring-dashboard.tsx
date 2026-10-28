"use client";

import { useEffect, useState } from "react";
import { RANGES, STALE_AFTER_MS, overallStatus, readingStatus, type LiveTelemetry, type TelemetryHistory, type TelemetryRange } from "@/lib/telemetry";
import { EventStrips, monitoringTime, TrendChart } from "./monitoring-charts";

// Separate live/history clocks; abort old filter requests and never overlap polls.
function useTelemetry<T>(url: string, interval: number, enabled: boolean, refresh: number) {
  const [result, setResult] = useState<{ url: string; data?: T; error?: string; receivedAt?: string }>({ url: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let disposed = false;
    let controller: AbortController | null = null;
    async function load() {
      if (disposed || controller || document.hidden) return;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 25_000);
      setBusy(true);
      try {
        const response = await fetch(url, { cache: "no-store", signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not load monitoring data.");
        if (!disposed) setResult({ url, data: body as T, receivedAt: new Date().toISOString() });
      } catch (error) {
        if (!disposed) setResult((previous) => ({
          ...(previous.url === url ? previous : { url }),
          error: error instanceof Error && error.name !== "AbortError" ? error.message : "Request timed out. Previous data may be outdated; retry.",
        }));
      } finally {
        clearTimeout(timeout);
        controller = null;
        if (!disposed) setBusy(false);
      }
    }
    const initial = setTimeout(() => void load(), 0);
    const timer = enabled ? setInterval(() => void load(), interval) : undefined;
    const visible = () => { if (enabled && !document.hidden) void load(); };
    document.addEventListener("visibilitychange", visible);
    return () => { disposed = true; clearTimeout(initial); clearInterval(timer); controller?.abort(); document.removeEventListener("visibilitychange", visible); };
  }, [url, interval, enabled, refresh]);
  return { ...(result.url === url ? result : { url }), busy };
}

function StatusPill({ status }: { status: string }) {
  const style = status === "Normal" || status === "Fresh" ? "bg-sprout text-emerald" :
    status === "Critical" || status === "Read error" ? "bg-danger/10 text-danger" : "bg-sand text-pine";
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${style}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}

function ageText(value: string, now: number) {
  const seconds = Math.max(0, Math.floor((now - Date.parse(value)) / 1000));
  return seconds < 60 ? `${seconds}s ago` : seconds < 3600 ? `${Math.floor(seconds / 60)}m ago` : `${Math.floor(seconds / 3600)}h ago`;
}

export function MonitoringDashboard() {
  const [range, setRange] = useState<TelemetryRange>("1d");
  const [sensor, setSensor] = useState("");
  const [auto, setAuto] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [now, setNow] = useState(0);
  const [severity, setSeverity] = useState("all");
  const [alertState, setAlertState] = useState("all");
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const query = new URLSearchParams({ range, sensor }).toString();
  const live = useTelemetry<LiveTelemetry>(`/api/telemetry?mode=live&${query}`, 10_000, auto, refresh);
  const history = useTelemetry<TelemetryHistory>(`/api/telemetry?mode=history&${query}`, 60_000, auto, refresh);
  const clock = now || (live.data ? Date.parse(live.data.checkedAt) : 0);
  const latest = live.data?.latest ?? [];
  const statuses = latest.map(({ reading, error }) => error ? "Read error" : readingStatus(reading, clock));
  const overall = live.error ? "Read error" : !live.data ? "Loading" : overallStatus(statuses);
  const fresh = latest.filter(({ reading, error }) => !error && reading && clock - Date.parse(reading.recorded_at) <= STALE_AFTER_MS && Date.parse(reading.recorded_at) <= clock + 60_000).length;
  const newest = latest.flatMap(({ reading }) => reading ? [reading.recorded_at] : []).sort().at(-1);
  const alerts = (live.data?.alerts ?? []).filter((a) => (severity === "all" || a.severity === severity) && (alertState === "all" || a.resolved === (alertState === "resolved")));
  const hasStale = statuses.some((s) => ["Stale", "No data", "Check clock", "Read error"].includes(s));
  const panel = "monitor-panel";

  return <div className="monitor-workspace mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-8 lg:py-12">
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="eyebrow text-emerald">Plantiful / Field intelligence</p><h1 className="mt-3 font-semibold">Plant monitoring</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-moss">A closer look at the conditions around your plants. Environmental readings, field activity and threat alerts in one place.</p></div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-emerald" />Auto-refresh</label>
        <button onClick={() => setRefresh((n) => n + 1)} disabled={live.busy || history.busy} className="rounded-full bg-pine px-5 py-3 text-sm font-medium text-cream disabled:opacity-50">{live.busy ? "Checking…" : "Refresh now ↻"}</button>
      </div>
    </header>

    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-pine/10 py-3 text-xs text-moss" aria-live="polite">
      <span>{auto ? "Auto-refresh: readings / alerts 10s · charts 60s · pauses in hidden tabs" : "Auto-refresh paused — use Refresh now"}</span>
      <span>Dashboard checked: {live.data ? `${monitoringTime(live.data.checkedAt)} MYT` : "Waiting for data"}</span>
    </div>
    {live.error && <div role="alert" className="monitor-notice mt-5">{live.error} {live.data && "Showing the last successful response."}</div>}
    {hasStale && <div role="status" className="monitor-notice mt-5"><strong>Some sensors have no recent readings.</strong> Refreshing the website does not create new measurements. Check that the ESP32 is connected, the Python bridge is still printing new lines, and the computer has internet. Sensor freshness expires after 60 seconds; the separate silent-sensor alert uses the evaluator’s 30-minute threshold.</div>}

    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <section className="monitor-hero md:col-span-2">
        <div className="relative z-10 max-w-md"><span className="eyebrow text-sprout">Your field, at a glance</span><h2 className="mt-5 text-3xl font-semibold">Conditions now</h2><div className="mt-4"><StatusPill status={overall} /></div><p className="mt-5 text-sm leading-relaxed text-cream/80">Based on the latest temperature, air humidity and movement readings. Historical alerts remain separate until reviewed.</p><p className="mt-5 text-xs text-cream/70">{newest ? `Newest reading: ${monitoringTime(newest)} MYT · ${ageText(newest, clock)}` : "No reading received for the selected sensors yet."}</p></div>
      </section>
      <section className={panel}><p className="eyebrow text-moss">Sensor freshness</p><div className="my-5 flex items-center gap-4"><div className="monitor-ring" style={{ background: `conic-gradient(var(--chart-progress) ${latest.length ? fresh / latest.length * 360 : 0}deg, var(--chart-track) 0deg)` }}><span>{live.data ? `${fresh}/${latest.length}` : "—"}</span></div><p className="text-sm text-moss">reporting<br />within 60s</p></div><p className="text-xs leading-relaxed text-moss">Freshness indicates incoming data, not plant health. Null measurements may still need inspection.</p></section>
      <section className={panel}><p className="eyebrow text-moss">Needs review</p><p className="mt-6 text-5xl font-semibold">{live.data?.openCount ?? "—"}</p><h2 className="mt-2 text-base font-medium">Unresolved alerts</h2><p className="mt-5 text-xs leading-relaxed text-moss">All-time count for the selected sensors. A normal new reading does not automatically close an earlier alert.</p></section>
    </div>

    <section className="mt-9" aria-label="Monitoring filters">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1 rounded-2xl bg-pine/5 p-1.5">{Object.entries(RANGES).map(([value, label]) => <button key={value} aria-pressed={range === value} onClick={() => setRange(value as TelemetryRange)} className={`rounded-full px-4 py-2.5 text-sm transition ${range === value ? "bg-white font-semibold text-emerald shadow-sm" : "text-moss hover:text-pine"}`}>{label}</button>)}</div>
        <label className="flex items-center gap-3 text-sm text-moss">Sensor<select value={sensor} onChange={(e) => setSensor(e.target.value)} className="rounded-full border border-pine/10 bg-white px-4 py-3 text-pine"><option value="">All sensors</option>{live.data?.sensors.map((s) => <option key={s.sensor_id} value={s.sensor_id}>Sensor {s.sensor_id.slice(0, 8)}</option>)}{sensor && !live.data?.sensors.some((s) => s.sensor_id === sensor) && <option value={sensor}>Sensor {sensor.slice(0, 8)}</option>}</select></label>
      </div>
      <p className="mt-3 text-xs text-moss">Time ranges apply to charts and the alert timeline. Current conditions always use the latest reading. All times: Malaysia (MYT, UTC+8).</p>
    </section>

    <section className="mt-7" aria-labelledby="sensor-heading"><div className="mb-4 flex items-center justify-between"><h2 id="sensor-heading" className="text-xl font-semibold">Latest sensor readings</h2><span className="text-xs text-moss">{latest.length} in view</span></div>
      {!live.data && !live.error && <p className={panel}>Loading live readings…</p>}
      {live.data && !latest.length && <p className={panel}>No sensors registered in this view. Start the bridge to register your node.</p>}
      <div className="grid gap-4 lg:grid-cols-2">{latest.map(({ sensor: item, reading, error }, i) => <article key={item.sensor_id} className={panel}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow text-moss">Field node</p><h3 className="mt-2 text-lg font-semibold">Sensor {item.sensor_id.slice(0, 8)}</h3><p className="mt-1 text-xs text-moss">Registered location: {item.gps_lat != null && item.gps_lng != null ? `${item.gps_lat.toFixed(4)}, ${item.gps_lng.toFixed(4)}` : "Not set"} · fixed coordinates</p></div><StatusPill status={statuses[i]} /></div>
        {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{[
          ["Temperature", reading?.temperature == null ? "—" : `${reading.temperature.toFixed(1)} °C`, "warm"],
          ["Air humidity", reading?.humidity == null ? "—" : `${reading.humidity.toFixed(0)} %`, "cool"],
          ["Soil moisture", reading?.soil_moisture == null ? "—" : `${reading.soil_moisture.toFixed(0)} %`, "green"],
          ["Movement", reading?.movement == null ? "Unknown" : reading.movement ? "Detected" : "Not detected", "green"],
          ["Rain", reading?.rain == null ? "Unknown" : reading.rain ? "Detected" : "Dry", "cool"],
          ["Reading age", reading ? ageText(reading.recorded_at, clock) : "No data", "warm"],
        ].map(([label, value, tone]) => <div key={label} className={`monitor-metric monitor-${tone}`}><dt className="text-xs text-moss">{label}</dt><dd className="mt-3 text-lg font-semibold">{value}</dd></div>)}</dl>
        <p className="mt-4 text-xs text-moss">Last reading: {reading ? `${monitoringTime(reading.recorded_at)} MYT` : "Never received"}</p>
      </article>)}</div>
    </section>

    <section className="mt-9" aria-labelledby="history-heading"><div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><p className="eyebrow text-emerald">Patterns & changes</p><h2 id="history-heading" className="mt-2 text-xl font-semibold">Environmental history</h2></div><p className="text-xs text-moss">Charts checked: {history.receivedAt ? `${monitoringTime(history.receivedAt)} MYT` : "Not loaded"}</p></div>
      {history.error && <p role="alert" className="monitor-notice mb-4">{history.error} {history.data && "Charts below are from the previous successful request."}</p>}
      {!history.data && !history.error && <p className={panel}>Loading environmental history…</p>}
      {history.data && <>
        <p className="mb-4 text-xs leading-relaxed text-moss">{history.data.points.reduce((n, p) => n + p.samples, 0).toLocaleString()} stored samples · {Math.round(history.data.bucket_seconds / 60)}-minute buckets · average lines with min/max whiskers · gaps mean no samples. {sensor ? "Selected sensor only." : "All sensors combined, weighted by sample count; select one sensor for its individual trend."}</p>
        <div className="grid gap-4 xl:grid-cols-3">{(["temperature", "humidity", "soil_moisture"] as const).map((metric) => <TrendChart key={metric} metric={metric} history={history.data!} />)}</div>
        <div className="mt-4"><EventStrips history={history.data} /></div>
        <details className="mt-4 rounded-2xl border border-pine/10 bg-white p-5"><summary className="cursor-pointer text-sm font-medium">View chart data as a table</summary><div className="mt-4 max-h-80 overflow-auto"><table><caption className="sr-only">Bucket averages and positive sample counts, Malaysia time</caption><thead><tr>{["Bucket start (MYT)", "Samples", "Temp °C", "Humidity %", "Soil %", "Movement samples", "Rain samples"].map((label) => <th key={label} className="p-3 text-left">{label}</th>)}</tr></thead><tbody>{history.data.points.map((p) => <tr key={p.time}>{[monitoringTime(p.time), p.samples, p.temperature?.toFixed(1) ?? "—", p.humidity?.toFixed(1) ?? "—", p.soil_moisture?.toFixed(1) ?? "—", p.movement_samples, p.rain_samples].map((v, i) => <td key={i} className="whitespace-nowrap p-3">{v}</td>)}</tr>)}</tbody></table></div></details>
      </>}
    </section>

    <section className={`${panel} mt-9`} aria-labelledby="alerts-heading">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow text-emerald">Field activity</p><h2 id="alerts-heading" className="mt-2 text-xl font-semibold">Threat alert timeline</h2></div><div className="flex flex-wrap gap-3"><label className="text-xs text-moss">Severity<select className="field-input mt-1" value={severity} onChange={(e) => setSeverity(e.target.value)}>{["all", "critical", "high", "medium", "low"].map((s) => <option key={s} value={s}>{s === "all" ? "All severities" : s}</option>)}</select></label><label className="text-xs text-moss">Status<select className="field-input mt-1" value={alertState} onChange={(e) => setAlertState(e.target.value)}><option value="all">All statuses</option><option value="open">Open</option><option value="resolved">Resolved</option></select></label></div></div>
      <p className="mt-4 text-xs leading-relaxed text-moss">Alert times show when an event was created, not when the page refreshed. Repeated conditions have a six-hour cooldown. These filters apply to the newest 100 events in the chosen range.</p>
      <p className="mt-2 text-xs text-moss">{live.data ? `${alerts.length} shown · ${live.data.alertCount} total events in range` : "Waiting for alerts"}</p>
      {live.data && !alerts.length && <p className="py-8 text-sm text-moss">No matching alerts in this view. This does not confirm normal conditions; check sensor freshness above.</p>}
      <ol className="mt-5 space-y-0">{alerts.map((a) => <li key={a.alert_id} className="relative border-l-2 border-emerald/15 pb-6 pl-6 last:pb-0"><span className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white ${a.severity === "critical" || a.severity === "high" ? "bg-danger" : "bg-emerald"}`} /><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-medium capitalize">{a.alert_type.replace(/_/g, " ")}</h3><div className="flex gap-2"><span className={`rounded-full px-3 py-1 text-xs ${a.severity === "critical" || a.severity === "high" ? "bg-danger/10 text-danger" : "bg-sprout text-emerald"}`}>{a.severity}</span><span className="rounded-full bg-sand px-3 py-1 text-xs">{a.resolved ? "Resolved" : "Open"}</span></div></div><p className="mt-2 text-xs text-moss">{monitoringTime(a.created_at)} MYT · Sensor {a.sensor_id.slice(0, 8)}</p></li>)}</ol>
    </section>
  </div>;
}
