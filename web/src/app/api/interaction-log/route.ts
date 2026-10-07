import { NextResponse } from "next/server";

export async function POST(request: Request) {
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
