"use client";

import { useEffect, useState } from "react";
import {
  getAlertRetentionDays,
  PREFERENCES_EVENT,
  RETENTION_OPTIONS,
  setAlertRetentionDays,
  type AlertRetentionDays,
} from "@/lib/notification-preferences";

export function NotificationPreferences() {
  const [days, setDays] = useState<AlertRetentionDays>(30);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = () => setDays(getAlertRetentionDays());
    load();
    window.addEventListener(PREFERENCES_EVENT, load);
    return () => window.removeEventListener(PREFERENCES_EVENT, load);
  }, []);

  function save(value: AlertRetentionDays) {
    setDays(value);
    setAlertRetentionDays(value);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="mt-3 rounded-2xl border border-pine/10 bg-cream p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-pine">Alert notification retention</p>
          <p className="mt-0.5 text-xs leading-5 text-moss">
            Hide alert cards and badge counts older than this period. The source
            alert records remain in the database.
          </p>
        </div>
        <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-moss">
          This device
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label htmlFor="alert-retention" className="text-sm font-medium text-pine">
          Keep notifications for
        </label>
        <select
          id="alert-retention"
          value={days}
          onChange={(event) => save(Number(event.target.value) as AlertRetentionDays)}
          className="field-input h-10 min-w-32"
        >
          {RETENTION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option} days
            </option>
          ))}
        </select>
        {saved && (
          <span role="status" className="text-sm font-semibold text-emerald">
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
