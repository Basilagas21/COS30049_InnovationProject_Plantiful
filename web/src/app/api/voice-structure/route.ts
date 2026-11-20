import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  structureFieldNote,
  structureFieldNoteFromAudio,
  isAllowedAudioMimeType,
  MAX_AUDIO_BYTES,
} from "@/lib/voice-structure";
import { aiErrorMessage } from "@/lib/gemini";
import { GroqError } from "@/lib/groq";

// Same-origin requests (nothing currently calls this route that way, but we
// keep the option open) use the normal cookie session. Cross-origin callers
// -- the mobile app, which is where this feature actually lives -- send a
// Supabase access token instead, same pattern as the mobile app's existing
// field-assist.ts -> /api/field-assist/[id] calls.
async function authenticatedUser(request: Request): Promise<{ id: string } | null> {
  const bearer = request.headers.get("authorization");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (bearer && url && anon) {
    const auth = createSupabaseClient(url, anon, {
      global: { headers: { Authorization: bearer } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await auth.auth.getUser();
    return data.user ?? null;
  }
  if (!bearer) {
    // No bearer token: this must be a same-origin browser request. Reject
    // anything claiming otherwise, same CSRF guard field-assist-server.ts
    // uses for its own non-GET, non-bearer requests.
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) return null;
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

// Rough base64-length ceiling corresponding to MAX_AUDIO_BYTES of raw audio,
// checked before we spend effort decoding or forwarding anything.
const MAX_AUDIO_BASE64_LENGTH = Math.ceil((MAX_AUDIO_BYTES * 4) / 3) + 1024;

export async function POST(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) {
    return Response.json({ error: "sign_in_required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  const record = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  if (!record) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    if (typeof record.audioBase64 === "string") {
      const audioBase64 = record.audioBase64;
      if (!audioBase64 || audioBase64.length > MAX_AUDIO_BASE64_LENGTH) {
        return Response.json({ error: "invalid_request" }, { status: 400 });
      }
      if (!isAllowedAudioMimeType(record.mimeType)) {
        return Response.json({ error: "unsupported_audio_type" }, { status: 400 });
      }
      const structured = await structureFieldNoteFromAudio(audioBase64, record.mimeType);
      return Response.json({ structured, error: null }, { headers: { "Cache-Control": "no-store" } });
    }

    const transcript = typeof record.transcript === "string" ? record.transcript.trim() : "";
    if (!transcript) {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }
    const structured = await structureFieldNote(transcript);
    return Response.json({ structured, error: null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof GroqError ? error.code : "voice_structure_unavailable";
    const status = error instanceof GroqError ? error.status : 503;
    return Response.json(
      { error: code, message: aiErrorMessage(code) },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
