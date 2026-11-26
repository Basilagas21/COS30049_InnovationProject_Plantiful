const READ_ALERTS_KEY = "plantiful.readAlerts";
const RETENTION_KEY = "plantiful.alertRetentionDays";

export const DEFAULT_ALERT_RETENTION_DAYS = 30;
export const PREFERENCES_EVENT = "plantiful:alert-preferences";

export type AlertRetentionDays = 7 | 14 | 30 | 60 | 90;

export const RETENTION_OPTIONS: AlertRetentionDays[] = [7, 14, 30, 60, 90];

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function notify(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PREFERENCES_EVENT));
}

export function getReadAlertIds(): string[] {
  const store = storage();
  if (!store) return [];
  try {
    const value = JSON.parse(store.getItem(READ_ALERTS_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function isAlertRead(alertId: string): boolean {
  return getReadAlertIds().includes(alertId);
}

export function markAlertRead(alertId: string): void {
  const store = storage();
  if (!store) return;
  const ids = new Set(getReadAlertIds());
  ids.add(alertId);
  store.setItem(READ_ALERTS_KEY, JSON.stringify([...ids]));
  notify();
}

export function markAlertsRead(alertIds: string[]): void {
  const store = storage();
  if (!store) return;
  const ids = new Set(getReadAlertIds());
  alertIds.forEach((id) => ids.add(id));
  store.setItem(READ_ALERTS_KEY, JSON.stringify([...ids]));
  notify();
}

export function clearReadAlerts(): void {
  const store = storage();
  if (!store) return;
  store.removeItem(READ_ALERTS_KEY);
  notify();
}

export function getAlertRetentionDays(): AlertRetentionDays {
  const store = storage();
  if (!store) return DEFAULT_ALERT_RETENTION_DAYS;
  const value = Number(store.getItem(RETENTION_KEY));
  return RETENTION_OPTIONS.includes(value as AlertRetentionDays)
    ? (value as AlertRetentionDays)
    : DEFAULT_ALERT_RETENTION_DAYS;
}

export function setAlertRetentionDays(days: AlertRetentionDays): void {
  const store = storage();
  if (!store) return;
  store.setItem(RETENTION_KEY, String(days));
  notify();
}

export function withinRetention(createdAt: string, days: AlertRetentionDays): boolean {
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) return false;
  return created >= Date.now() - days * 86_400_000;
}
