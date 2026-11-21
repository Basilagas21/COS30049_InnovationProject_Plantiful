import { NextResponse } from "next/server";

// Simple in-memory per-IP throttle. Resets per server instance/restart;
// good enough to stop casual log-spam on this student prototype without
// adding an external rate-limiting dependency.
const WINDOW_MS = 10_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, { count: number; windowStart: number }>();

function isThrottled(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isThrottled(ip)) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  let target = "unknown";
  try {
    const body: unknown = await request.json();
    const value = (body as { target?: unknown } | null)?.target;
    if (typeof value === "string") target = value.slice(0, 200);
  } catch {
    // malformed payload: still log the attempt
  }
  console.log(`[ui] ${new Date().toTimeString().slice(0, 8)} ${target}`);
  return NextResponse.json({ ok: true });
}
