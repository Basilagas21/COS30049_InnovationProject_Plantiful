import { NextResponse } from "next/server";
import { getPublicSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

// Public contact-form endpoint for the /inquiry page. No sign-in on this
// site, so this route accepts anonymous submissions and writes them with
// the public anon key — the same key the rest of this site already uses
// read-only elsewhere. What actually keeps this safe is the database side:
// backend/supabase/migrations/add_inquiries.sql gives the anon role an
// INSERT-only policy on `inquiries` (no select/update/delete), so this
// route can never read anything back, including the row it just created.
// Reviewing submissions happens in the main app's /admin/inquiries page,
// signed in as a conservation officer or admin.

const MAX_LENGTHS = {
  name: 200,
  email: 320,
  subject: 200,
  message: 4000,
} as const;

// Deliberately simple — matches the format check the database's own CHECK
// constraint applies, not full RFC 5322 validation.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type InquiryPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

function readField(body: unknown, key: keyof InquiryPayload): string {
  const value = (body as Record<string, unknown> | null)?.[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "That submission wasn't readable. Please try again." },
      { status: 400 },
    );
  }

  const fields: InquiryPayload = {
    name: readField(body, "name"),
    email: readField(body, "email"),
    subject: readField(body, "subject"),
    message: readField(body, "message"),
  };

  if (!fields.name || !fields.email || !fields.subject || !fields.message) {
    return NextResponse.json(
      { ok: false, error: "Please fill in your name, email, subject and message." },
      { status: 400 },
    );
  }
  if (!EMAIL_PATTERN.test(fields.email)) {
    return NextResponse.json(
      { ok: false, error: "That email address doesn't look right." },
      { status: 400 },
    );
  }
  for (const key of Object.keys(MAX_LENGTHS) as Array<keyof typeof MAX_LENGTHS>) {
    if (fields[key].length > MAX_LENGTHS[key]) {
      return NextResponse.json(
        { ok: false, error: `${key[0].toUpperCase()}${key.slice(1)} is too long.` },
        { status: 400 },
      );
    }
  }

  if (!isSupabaseConfigured) {
    // Honest state, not a fabricated success — this environment simply
    // isn't wired to a real database (see visitor-site/README.md).
    return NextResponse.json(
      {
        ok: false,
        error:
          "This site isn't connected to a database in this environment, so inquiries can't be saved right now.",
      },
      { status: 503 },
    );
  }

  const supabase = getPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Inquiries can't be saved right now. Please try again shortly." },
      { status: 503 },
    );
  }

  const { error } = await supabase.from("inquiries").insert({
    name: fields.name,
    email: fields.email,
    subject: fields.subject,
    message: fields.message,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "We couldn't save your inquiry just now. Please try again shortly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
