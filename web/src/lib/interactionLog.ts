export function reportInteraction(target: string): void {
  if (typeof window === "undefined") return;
  try {
    void fetch("/api/interaction-log", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: target.slice(0, 200) }),
    }).catch(() => undefined);
  } catch {
    // logging must never break the UI
  }
}
