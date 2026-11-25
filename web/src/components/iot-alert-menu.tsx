"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { BellIcon } from "@/components/icons";
import type { LiveTelemetry, ThreatAlert } from "@/lib/telemetry";

type AlertSummary = {
  openCount: number;
  alerts: ThreatAlert[];
  error: string | null;
  checkedAt: string | null;
};

const SEVERITY_STYLE: Record<string, string> = {
  critical: "bg-danger/10 text-danger",
  high: "bg-danger/10 text-danger",
  medium: "bg-sand text-pine",
  low: "bg-sprout text-emerald",
};

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString("en-MY", {
    timeZone: "Asia/Kuching",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function IotAlertMenu() {
  const panelId = useId();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<AlertSummary | null>(null);

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;

    async function load() {
      if (document.hidden) return;
      controller?.abort();
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 20_000);
      try {
        const response = await fetch("/api/telemetry?mode=live&range=1d", {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Monitoring is unavailable.");
        }
        const live = body as LiveTelemetry;
        if (!active) return;
        setSummary({
          openCount: live.openCount,
          alerts: live.alerts.filter((alert) => !alert.resolved).slice(0, 5),
          error: null,
          checkedAt: live.checkedAt,
        });
      } catch (error) {
        if (!active || (error instanceof Error && error.name === "AbortError")) {
          return;
        }
        setSummary((previous) => ({
          openCount: previous?.openCount ?? 0,
          alerts: previous?.alerts ?? [],
          error: error instanceof Error ? error.message : "Monitoring is unavailable.",
          checkedAt: previous?.checkedAt ?? null,
        }));
      } finally {
        clearTimeout(timeout);
        controller = null;
      }
    }

    const initial = setTimeout(() => void load(), 0);
    const timer = setInterval(() => void load(), 30_000);
    const onVisible = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      clearTimeout(initial);
      clearInterval(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const openCount = summary?.openCount ?? 0;

  return (
    <div ref={container} className="relative shrink-0">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          openCount > 0
            ? `IoT alerts, ${openCount} open`
            : "IoT alerts, no open alerts"
        }
        onClick={() => setOpen((value) => !value)}
        className="relative flex min-h-11 w-11 items-center justify-center rounded-full border border-pine/15 bg-surface text-pine transition hover:bg-sprout"
      >
        <BellIcon size="1.1rem" />
        {openCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-[0.65rem] font-bold leading-none text-white">
            {openCount > 99 ? "99+" : openCount}
          </span>
        )}
      </button>

      {open && (
        <section
          id={panelId}
          aria-label="IoT alerts"
          className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-pine/15 bg-surface text-sm text-pine shadow-xl"
        >
          <div className="border-b border-pine/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-moss">
                IoT alerts
              </p>
              <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-moss">
                {summary ? `${openCount} open` : "Checking"}
              </span>
            </div>
            <p className="mt-2 text-xs text-moss">
              {summary?.checkedAt
                ? `Checked ${formatTime(summary.checkedAt)} MYT`
                : "Waiting for the latest telemetry"}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {summary?.error && (
              <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">
                {summary.error}
              </p>
            )}
            {summary?.alerts.length ? (
              summary.alerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className="rounded-xl px-3 py-2 hover:bg-sprout/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold capitalize">
                      {alert.alert_type.replace(/_/g, " ")}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
                        SEVERITY_STYLE[alert.severity] ?? "bg-sand text-moss"
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-moss">
                    Sensor {alert.sensor_id.slice(0, 8)} · {formatTime(alert.created_at)} MYT
                  </p>
                </div>
              ))
            ) : (
              <p className="px-3 py-6 text-center text-xs text-moss">
                No open alerts in the last 24 hours. Check sensor freshness in
                the monitoring dashboard before treating this as normal.
              </p>
            )}
          </div>

          <div className="border-t border-pine/10 p-2">
            <Link
              href="/alerts#alerts-heading"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center justify-center rounded-xl bg-emerald px-3 text-sm font-semibold text-cream hover:bg-pine"
            >
              Open monitoring dashboard
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
