"use client";

import { useId, useState } from "react";
import type { HistoryPoint, TelemetryHistory } from "@/lib/telemetry";

export function monitoringTime(value: string, short = false) {
  return new Date(value).toLocaleString("en-MY", {
    timeZone: "Asia/Kuching", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", ...(short ? {} : { second: "2-digit" }),
  });
}

type Metric = "temperature" | "humidity" | "soil_moisture";
const METRICS = {
  temperature: { title: "Temperature", unit: "°C", color: "var(--chart-temperature)", thresholds: [36, 40] },
  humidity: { title: "Air humidity", unit: "% RH", color: "var(--chart-humidity)", thresholds: [25, 40] },
  soil_moisture: { title: "Soil moisture", unit: "% relative", color: "var(--chart-soil)", thresholds: [] },
};

export function TrendChart({ history, metric }: { history: TelemetryHistory; metric: Metric }) {
  const id = useId().replace(/:/g, "");
  const { title, unit, color, thresholds } = METRICS[metric];
  const minKey = `${metric}_min` as keyof HistoryPoint;
  const maxKey = `${metric}_max` as keyof HistoryPoint;
  const values = history.points.flatMap((p) => p[metric] == null ? [] : [Number(p[minKey]), Number(p[maxKey])]);
  const low = Math.min(0, ...values);
  const high = metric === "temperature" ? Math.max(45, ...values) + 2 : 100;
  const start = Date.parse(history.start);
  const end = Date.parse(history.end);
  const x = (p: HistoryPoint) => 43 + (Date.parse(p.time) - start) / Math.max(1, end - start) * 470;
  const y = (v: number) => 174 - (v - low) / (high - low) * 150;
  const plotted = history.points.map((p) => ({
    point: p, x: x(p), value: p[metric] == null ? null : y(p[metric]!),
  }));
  const path = plotted.map((entry, i) => {
    if (entry.value == null) return "";
    const previous = plotted[i - 1];
    return `${previous && previous.value != null ? "L" : "M"}${entry.x},${entry.value}`;
  }).join(" ");
  const last = history.points.findLast((p) => p[metric] != null)?.[metric];
  return <section className="monitor-panel">
    <div className="flex items-start justify-between gap-3">
      <div><p className="eyebrow text-moss">Environmental trend</p><h3 className="mt-2 text-lg font-semibold">{title}</h3></div>
      <span className="monitor-icon" style={{ color }}>↗</span>
    </div>
    <p className="mt-5 text-3xl font-semibold tracking-tight">{last == null ? "—" : last.toFixed(1)} <span className="text-sm font-normal text-moss">{unit}</span></p>
    <p className="mt-1 text-xs text-moss">Most recent non-empty bucket average in this range</p>
    {!values.length ? <p className="flex h-52 items-center justify-center text-sm text-moss">No {title.toLowerCase()} data in this range.</p> :
      <svg viewBox="0 0 530 210" className="mt-4 w-full" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>{title} history</title>
        <desc id={`${id}-desc`}>Average line with min/max whiskers. Missing buckets break the line. Values range from {Math.min(...values).toFixed(1)} to {Math.max(...values).toFixed(1)} {unit}. Times are MYT. A data table follows the charts.</desc>
        {[low, (high + low) / 2, high].map((v) => <g key={v}>
          <line x1="43" x2="513" y1={y(v)} y2={y(v)} stroke="var(--chart-grid)" strokeDasharray="3 5" />
          <text x="35" y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--chart-label)">{v.toFixed(0)}</text>
        </g>)}
        {thresholds.map((v) => <g key={v}>
          <line x1="43" x2="513" y1={y(v)} y2={y(v)} stroke="var(--danger)" strokeOpacity=".55" strokeDasharray="5 5" />
          <text x="510" y={y(v) - 4} textAnchor="end" fontSize="10" fill="var(--danger)">Rule: {v}</text>
        </g>)}
        {history.points.filter((p) => p[metric] != null).map((p) => <g key={p.time}>
          <title>{monitoringTime(p.time)} MYT · average {p[metric]?.toFixed(1)} · min {Number(p[minKey]).toFixed(1)} · max {Number(p[maxKey]).toFixed(1)} {unit}</title>
          <line x1={x(p)} x2={x(p)} y1={y(Number(p[minKey]))} y2={y(Number(p[maxKey]))} stroke={color} strokeOpacity=".22" strokeWidth="3" />
          <circle cx={x(p)} cy={y(p[metric]!)} r="2.3" fill={color} />
        </g>)}
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <text x="43" y="201" fontSize="10" fill="var(--chart-label)">{monitoringTime(history.start, true)}</text>
        <text x="513" y="201" textAnchor="end" fontSize="10" fill="var(--chart-label)">{monitoringTime(history.end, true)}</text>
      </svg>}
    <p className="text-xs leading-relaxed text-moss">{metric === "soil_moisture" ? "Relative probe calibration; not laboratory soil water content." : metric === "humidity" ? "Low air humidity drives the drought-stress rule; it is not proof of soil drought." : "Heat warning ≥36 °C; critical ≥40 °C."}</p>
  </section>;
}

export function EventStrips({ history }: { history: TelemetryHistory }) {
  const [view, setView] = useState<"recorded" | "full">("recorded");
  // Recorded-period buckets are aggregated separately in SQL. Trimming the
  // full-range buckets cannot recover the detail lost in a 28-minute bucket.
  const activity = view === "recorded" ? history.activity : history;
  const points = activity?.points ?? [];
  const hasReadings = points.some((p) => p.samples > 0);
  // Fixed CSS-pixel geometry for every filter, including All history.
  const cellWidth = 8;
  const barWidth = 6;
  const stripWidth = Math.max(1, points.length * cellWidth);

  return <section className="monitor-panel">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="eyebrow text-moss">Activity over time</p><h3 className="mt-2 text-xl font-semibold">Movement & rain</h3></div>
      <div role="group" aria-label="Activity chart time scale" className="flex flex-wrap gap-1 rounded-2xl bg-pine/5 p-1">
        {(["recorded", "full"] as const).map((value) => <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)} className={`rounded-full px-3 py-2 text-xs transition ${view === value ? "bg-white font-semibold text-emerald shadow-sm" : "text-moss hover:text-pine"}`}>{value === "recorded" ? "Recorded period" : "Full time range"}</button>)}
      </div>
    </div>
    <p className="mt-2 text-sm text-moss">Green marks a bucket with a positive reading. Grey means readings without a detection. Blank means no data.</p>
    <p className="mt-2 text-xs leading-relaxed text-moss">{view === "recorded" ? "Recorded period shows the stored readings within your filter. The same readings use the same grouping across filters." : "Full time range includes empty time before and after recordings."} Bars keep the same size and spacing. Scroll horizontally for longer timelines.{activity && ` Each bucket covers up to ${Number((activity.bucket_seconds / 60).toFixed(2))} minutes.`}</p>
    <p className="mt-2 text-xs text-moss">Selected range: {monitoringTime(history.start, true)} to {monitoringTime(history.end, true)} MYT</p>
    {!activity ? <p role="status" className="monitor-notice mt-4">Activity history update required. Run backend/supabase/migrations/012_monitoring_history.sql in Supabase SQL Editor, then refresh this dashboard.</p> : !hasReadings ? <p className="py-8 text-sm text-moss">No stored readings in this range.</p> : <>
      {(["movement_samples", "rain_samples"] as const).map((key) => <div key={key} className="mt-5">
        <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm"><span>{key === "movement_samples" ? "Movement" : "Rain detected"}</span><span className="text-moss">{points.reduce((n, p) => n + p[key], 0).toLocaleString()} positive samples</span></div>
        <div className="overflow-x-auto pb-2" tabIndex={0} role="region" aria-label={`${key === "movement_samples" ? "Movement" : "Rain"} timeline. Scroll horizontally to view all buckets.`}>
        <svg width={stripWidth} height="48" viewBox={`0 0 ${stripWidth} 48`} className="block max-w-none" role="img" aria-label={`${key === "movement_samples" ? "Movement" : "Rain"} detections from ${monitoringTime(activity.start)} to ${monitoringTime(activity.end)} MYT. Counts are samples, not distinct events.`}>
          {points.map((p, i) => <rect key={p.time} x={i * cellWidth + (cellWidth - barWidth) / 2} y={p[key] ? 2 : 18}
            width={barWidth} height={p[key] ? 44 : 12} rx="1"
            fill={!p.samples ? "transparent" : p[key] ? "var(--chart-progress)" : "var(--chart-empty)"}>
            <title>{monitoringTime(p.time)} MYT: {p[key]} positive / {p.samples} samples</title>
          </rect>)}
        </svg>
        </div>
      </div>)}
      <p className="mt-2 text-xs text-moss">Displayed period: {monitoringTime(activity.start, true)} to {monitoringTime(activity.end, true)} MYT</p>
    </>}
    <p className="mt-4 text-xs text-moss">Consecutive positive samples can belong to one event. Counts are not individual animals, visitors or rainfall amounts.</p>
  </section>;
}
