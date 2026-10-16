"use client";

import { useId } from "react";
import type { HistoryPoint, TelemetryHistory } from "@/lib/telemetry";

export function monitoringTime(value: string, short = false) {
  return new Date(value).toLocaleString("en-MY", {
    timeZone: "Asia/Kuching", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", ...(short ? {} : { second: "2-digit" }),
  });
}

type Metric = "temperature" | "humidity" | "soil_moisture";
const METRICS = {
  temperature: { title: "Temperature", unit: "°C", color: "#bb642c", thresholds: [36, 40] },
  humidity: { title: "Air humidity", unit: "% RH", color: "#327c92", thresholds: [25, 40] },
  soil_moisture: { title: "Soil moisture", unit: "% relative", color: "#367849", thresholds: [] },
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
          <line x1="43" x2="513" y1={y(v)} y2={y(v)} stroke="#0c342c18" strokeDasharray="3 5" />
          <text x="35" y={y(v) + 4} textAnchor="end" fontSize="11" fill="#6b7568">{v.toFixed(0)}</text>
        </g>)}
        {thresholds.map((v) => <g key={v}>
          <line x1="43" x2="513" y1={y(v)} y2={y(v)} stroke="#b54a3b" strokeOpacity=".55" strokeDasharray="5 5" />
          <text x="510" y={y(v) - 4} textAnchor="end" fontSize="10" fill="#b54a3b">Rule: {v}</text>
        </g>)}
        {history.points.filter((p) => p[metric] != null).map((p) => <g key={p.time}>
          <title>{monitoringTime(p.time)} MYT · average {p[metric]?.toFixed(1)} · min {Number(p[minKey]).toFixed(1)} · max {Number(p[maxKey]).toFixed(1)} {unit}</title>
          <line x1={x(p)} x2={x(p)} y1={y(Number(p[minKey]))} y2={y(Number(p[maxKey]))} stroke={color} strokeOpacity=".22" strokeWidth="3" />
          <circle cx={x(p)} cy={y(p[metric]!)} r="2.3" fill={color} />
        </g>)}
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <text x="43" y="201" fontSize="10" fill="#6b7568">{monitoringTime(history.start, true)}</text>
        <text x="513" y="201" textAnchor="end" fontSize="10" fill="#6b7568">{monitoringTime(history.end, true)}</text>
      </svg>}
    <p className="text-xs leading-relaxed text-moss">{metric === "soil_moisture" ? "Relative probe calibration; not laboratory soil water content." : metric === "humidity" ? "Low air humidity drives the drought-stress rule; it is not proof of soil drought." : "Heat warning ≥36 °C; critical ≥40 °C."}</p>
  </section>;
}

export function EventStrips({ history }: { history: TelemetryHistory }) {
  return <section className="monitor-panel">
    <p className="eyebrow text-moss">Activity over time</p><h3 className="mt-2 text-xl font-semibold">Movement & rain</h3>
    <p className="mt-2 text-sm text-moss">Green marks a bucket with a positive reading. Grey means readings without a detection; blank means no data.</p>
    {(["movement_samples", "rain_samples"] as const).map((key) => <div key={key} className="mt-5">
      <div className="mb-2 flex justify-between text-sm"><span>{key === "movement_samples" ? "Movement" : "Rain detected"}</span><span className="text-moss">{history.points.reduce((n, p) => n + p[key], 0).toLocaleString()} positive samples</span></div>
      <svg viewBox="0 0 720 30" className="w-full" role="img" aria-label={`${key === "movement_samples" ? "Movement" : "Rain"} detections across the selected range; counts are samples, not distinct events.`}>
        {history.points.map((p, i) => <rect key={p.time} x={i * 720 / history.points.length} y={p[key] ? 2 : 12}
          width={Math.max(.5, 720 / history.points.length - 1)} height={p[key] ? 26 : 8} rx="1"
          fill={!p.samples ? "transparent" : p[key] ? "#367849" : "#dce3d7"}>
          <title>{monitoringTime(p.time)} MYT: {p[key]} positive / {p.samples} samples</title>
        </rect>)}
      </svg>
    </div>)}
    <div className="mt-2 flex justify-between text-xs text-moss"><span>{monitoringTime(history.start, true)}</span><span>{monitoringTime(history.end, true)} MYT</span></div>
    <p className="mt-4 text-xs text-moss">Consecutive positive samples can belong to one event. Counts are not individual animals, visitors or rainfall amounts.</p>
  </section>;
}
