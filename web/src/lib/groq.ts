// Groq-backed replacement for the voice field note feature specifically
// (transcription + structuring). Gemini is left in place for the other two
// AI features (nl-search, translate) -- this file only covers what
// voice-structure.ts needs. Two calls instead of Gemini's one: Groq's
// Whisper endpoint transcribes the audio to text, then a Groq chat model
// extracts the structured JSON from that text. Mirrors gemini.ts's
// error-handling shape (a typed error, logging the real response body,
// retrying transient failures) since that's what actually got this feature
// working after a lot of trial and error with the previous provider.

export class GroqError extends Error {
  constructor(
    public code: string,
    public status = 503,
  ) {
    super(code);
  }
}

function groqConfig(): { apiKey: string } | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return { apiKey };
}

// 503/429 are transient on Groq same as they were on Gemini -- worth a
// couple of automatic retries before giving up.
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

async function groqFetch(url: string, init: RequestInit, timeoutMs: number): Promise<string> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
    } catch (error) {
      console.error(`[groq] request to ${url} failed before a response came back:`, error);
      throw new GroqError(
        error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name) ? "ai_timeout" : "ai_unavailable",
        502,
      );
    }

    const rawBody = await response.text();

    if (!response.ok) {
      console.error(`[groq] ${url} returned HTTP ${response.status}:`, rawBody.slice(0, 4000));
      if ((response.status === 503 || response.status === 429) && attempt < MAX_ATTEMPTS) {
        console.warn(`[groq] transient ${response.status}, retrying (attempt ${attempt + 1}/${MAX_ATTEMPTS})...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        continue;
      }
      throw new GroqError(response.status === 429 ? "ai_quota" : "ai_unavailable", 502);
    }

    return rawBody;
  }
  throw new GroqError("ai_unavailable", 502);
}

// Groq's transcription endpoint identifies the audio format from the
// filename extension on the multipart part, not the mime type string, and
// only accepts a specific set of extensions. Map the mime types this app
// actually sends (see voice-field-note.ts: audio/mp4 on iOS/Android,
// audio/webm on web) rather than guessing for anything broader -- a wrong
// guess here means Groq silently mis-decodes the audio, same mistake the
// mimeType mismatch with Gemini caused earlier.
const MIME_TO_GROQ_EXTENSION: Record<string, string> = {
  "audio/mp4": "m4a",
  "audio/m4a": "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
};

/**
 * Transcribes a recorded audio clip to plain text via Groq's Whisper
 * endpoint. Equivalent to the first half of what Gemini did in one call.
 */
export async function transcribeAudioGroq(audioBase64: string, mimeType: string): Promise<string> {
  const config = groqConfig();
  if (!config) throw new GroqError("ai_not_configured", 503);

  const extension = MIME_TO_GROQ_EXTENSION[mimeType];
  if (!extension) throw new GroqError("unsupported_audio_type", 400);

  const bytes = Buffer.from(audioBase64, "base64");
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mimeType }), `recording.${extension}`);
  form.append("model", "whisper-large-v3-turbo");
  form.append("response_format", "json");

  const rawBody = await groqFetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: form,
    },
    60000,
  );

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("[groq] transcription response was not valid JSON:", rawBody.slice(0, 4000));
    throw new GroqError("ai_invalid_response", 502);
  }
  const text = payload && typeof payload === "object" ? (payload as Record<string, unknown>).text : null;
  if (typeof text !== "string") {
    console.error("[groq] transcription response had no text field:", rawBody.slice(0, 4000));
    throw new GroqError("ai_empty_response", 502);
  }
  return text;
}

/**
 * Sends a text prompt to a Groq chat model and returns the parsed JSON
 * object it replies with. Groq's "json_object" mode guarantees the reply
 * parses as JSON but -- unlike Gemini's responseSchema -- doesn't enforce
 * field names or types, so callers must still validate the shape
 * themselves (voice-structure.ts's validate() already does this for every
 * provider, which is what makes swapping providers here safe).
 */
export async function chatJSONGroq(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const config = groqConfig();
  if (!config) throw new GroqError("ai_not_configured", 503);

  const rawBody = await groqFetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        // llama-3.3-70b-versatile returned model_not_found -- Groq's docs
        // list it (and llama-3.1-8b-instant) as Enterprise-only access now.
        // gpt-oss-20b is the smallest model with published, non-Enterprise
        // pricing/limits, so it's the one an ordinary free-tier key can use.
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    },
    20000,
  );

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("[groq] chat response was not valid JSON:", rawBody.slice(0, 4000));
    throw new GroqError("ai_invalid_response", 502);
  }
  const body = payload as Record<string, unknown>;
  const choices = Array.isArray(body.choices) ? body.choices : null;
  const content = choices?.[0] && typeof choices[0] === "object" ? (choices[0] as Record<string, unknown>).message : null;
  const text = content && typeof content === "object" ? (content as Record<string, unknown>).content : null;
  if (typeof text !== "string" || !text.trim()) {
    console.error("[groq] chat response had no message content:", rawBody.slice(0, 4000));
    throw new GroqError("ai_empty_response", 502);
  }

  try {
    return JSON.parse(text);
  } catch {
    console.error("[groq] structured text was not valid JSON:", text.slice(0, 4000));
    throw new GroqError("ai_invalid_json", 502);
  }
}
