"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RefreshIcon } from "@/components/icons";
import type { LiveTelemetry, ThreatAlert } from "@/lib/telemetry";
import {
  getAlertRetentionDays,
  getReadAlertIds,
  markAlertRead,
  markAlertsRead,
  PREFERENCES_EVENT,
  withinRetention,
  type AlertRetentionDays,
} from "@/lib/notification-preferences";

type AlertState = {
  alerts: ThreatAlert[];
  openCount: number;
  checkedAt: string | null;
  error: string | null;
};

const PAGE_SIZE = 6;

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

export function AlertNotifications() {
  const [state, setState] = useState<AlertState | null>(null);
  const [busy, setBusy] = useState(false);
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [refreshToken, setRefreshToken] = useState(0);
  const [retentionDays, setRetentionDays] = useState<AlertRetentionDays>(30);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const load = useCallback(async (signal?: AbortSignal) => {
    setBusy(true);
    try {
      const response = await fetch("/api/telemetry?mode=live&range=all", {
        cache: "no-store",
        signal,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not load alerts.");
      const live = body as LiveTelemetry;
      setState({
        alerts: live.alerts,
        openCount: live.openCount,
        checkedAt: live.checkedAt,
        error: null,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setState((previous) => ({
        alerts: previous?.alerts ?? [],
        openCount: previous?.openCount ?? 0,
        checkedAt: previous?.checkedAt ?? null,
        error: error instanceof Error ? error.message : "Could not load alerts.",
      }));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, 30_000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [load, refreshToken]);

  useEffect(() => {
    const sync = () => {
      setRetentionDays(getAlertRetentionDays());
      setReadIds(new Set(getReadAlertIds()));
    };
    const timer = window.setTimeout(sync, 0);
    window.addEventListener(PREFERENCES_EVENT, sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(PREFERENCES_EVENT, sync);
    };
  }, []);

  const retained = (state?.alerts ?? []).filter((alert) =>
    withinRetention(alert.created_at, retentionDays),
  );

  const filtered = retained.filter((alert) => {
    if (severity !== "all" && alert.severity !== severity) return false;
    if (status === "open" && alert.resolved) return false;
    if (status === "resolved" && !alert.resolved) return false;
    return true;
  });

  const unreadOpen = retained.filter(
    (alert) => !alert.resolved && !readIds.has(alert.alert_id),
  ).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(from, from + PAGE_SIZE);

  function openAlert(alertId: string) {
    markAlertRead(alertId);
    setReadIds(new Set(getReadAlertIds()));
  }

  return (
    <div className="monitor-workspace mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 lg:py-12">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow text-emerald">Plantiful / Field intelligence</p>
          <h1 className="mt-3 font-semibold">Alert notifications</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-moss">
            Threat detections from the monitoring devices. Each card is one
            alert event with its severity, sensor and review state.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/monitoring" className="btn btn--quiet min-h-11">
            Monitoring dashboard
          </Link>
          <button
            type="button"
            disabled={busy || unreadOpen === 0}
            onClick={() => {
              markAlertsRead(retained.map((alert) => alert.alert_id));
              setReadIds(new Set(getReadAlertIds()));
            }}
            className="btn btn--quiet min-h-11 disabled:opacity-50"
          >
            Mark all read
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRefreshToken((value) => value + 1)}
            className="btn btn--primary min-h-11"
          >
            {busy ? "Checking…" : <>Refresh <RefreshIcon size="1em" /></>}
          </button>
        </div>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="monitor-panel">
          <p className="eyebrow text-moss">Unread open alerts</p>
          <p className="mt-3 text-4xl font-semibold text-pine">{unreadOpen}</p>
          <p className="mt-2 text-xs text-moss">Cards older than {retentionDays} days are hidden</p>
        </div>
        <div className="monitor-panel">
          <p className="eyebrow text-moss">Shown in view</p>
          <p className="mt-3 text-4xl font-semibold text-pine">{filtered.length}</p>
          <p className="mt-2 text-xs text-moss">After the filters below</p>
        </div>
        <div className="monitor-panel">
          <p className="eyebrow text-moss">Last checked</p>
          <p className="mt-3 text-lg font-semibold text-pine">
            {state?.checkedAt ? `${formatTime(state.checkedAt)} MYT` : "Waiting"}
          </p>
          <p className="mt-2 text-xs text-moss">Auto-refresh every 30 seconds</p>
        </div>
      </div>

      {state?.error && (
        <div role="alert" className="monitor-notice mt-6">
          {state.error} Previous results may be outdated.
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-end gap-4">
        <label className="text-xs text-moss">
          Severity
          <select
            className="field-input mt-1"
            value={severity}
            onChange={(event) => {
              setSeverity(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="text-xs text-moss">
          Status
          <select
            className="field-input mt-1"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
        <p className="text-xs text-moss">
          The API keeps the newest 100 events. Retention is set in your profile.
        </p>
      </div>

      {!state && (
        <p className="monitor-panel mt-6">Loading alert notifications…</p>
      )}

      {state && filtered.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-pine/15 bg-sand/60 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-pine">No matching alerts</p>
          <p className="mt-1 text-sm text-moss">
            This is not proof that conditions are normal. Check sensor freshness
            on the monitoring dashboard.
          </p>
        </div>
      )}

      {visible.length > 0 && (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((alert) => {
            const read = readIds.has(alert.alert_id);
            return (
              <li
                key={alert.alert_id}
                className={`monitor-panel flex flex-col gap-4 transition-opacity ${
                  read ? "opacity-65" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow text-moss">Sensor {alert.sensor_id.slice(0, 8)}</p>
                    <h2 className="mt-2 text-lg font-semibold capitalize">
                      {alert.alert_type.replace(/_/g, " ")}
                    </h2>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      SEVERITY_STYLE[alert.severity] ?? "bg-sand text-moss"
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-sand px-2.5 py-1 text-moss">
                    {alert.resolved ? "Resolved" : read ? "Read" : "Open"}
                  </span>
                  <span className="text-moss">{formatTime(alert.created_at)} MYT</span>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-pine/10 pt-3">
                  <Link
                    href="/monitoring#alerts-heading"
                    onClick={() => openAlert(alert.alert_id)}
                    className="text-sm font-semibold text-emerald hover:underline"
                  >
                    View on timeline
                  </Link>
                  {!read && (
                    <button
                      type="button"
                      onClick={() => openAlert(alert.alert_id)}
                      className="min-h-10 rounded-full bg-sprout px-3 text-xs font-semibold text-emerald hover:bg-chartreuse"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Alert pagination"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-pine/10 pt-4 text-sm"
        >
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="btn btn--quiet min-h-11 disabled:opacity-40"
          >
            Previous
          </button>
          <p className="font-mono text-xs text-moss">
            Page {safePage} of {totalPages} · Showing {filtered.length ? from + 1 : 0} to {Math.min(from + PAGE_SIZE, filtered.length)}
          </p>
          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="btn btn--quiet min-h-11 disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
