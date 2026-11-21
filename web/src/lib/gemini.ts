// Shared helper for the three AI-backed features (natural-language search,
// voice field note structuring, species translation). Mirrors the gating
// and error-handling style already used by field-assist-provider.ts: a
// single config check, a typed error class, and strict validation of
// whatever comes back rather than trusting it.

export class GeminiError extends Error {
  constructor(
    public code: string,
    public status = 503,
  ) {
    super(code);
  }
}

export function geminiConfig(): { apiKey: string; model: string } | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return { apiKey, model: process.env.GEMINI_MODEL || "gemini-3.8-flash" };
}

type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new GeminiError("ai_invalid_response", 502);
  }
  return value as JsonObject;
}

function extractText(payload: unknown): string {
  const body = object(payload);
  const candidates = body.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new GeminiError("ai_empty_response", 502);
  }
  const content = object(candidates[0]).content;
  const parts = content ? object(content).parts : null;
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new GeminiError("ai_empty_response", 502);
  }
  const text = object(parts[0]).text;
  if (typeof text !== "string" || !text.trim()) {
    throw new GeminiError("ai_empty_response", 502);
  }
  return text;
}

type ContentPart = { text: string } | { inlineData: { mimeType: string; data: string } };

// 503 ("model overloaded, try again") and 429 (rate limited) are the two
// Gemini statuses that are explicitly described as transient rather than a
// real problem with the request -- worth a couple of automatic retries
// before giving up, instead of making the user tap retry themselves.
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

async function callGemini(
  parts: ContentPart[],
  responseSchema: Record<string, unknown>,
  timeoutMs: number,
  fetcher: typeof fetch,
): Promise<unknown> {
  const config = geminiConfig();
  if (!config) throw new GeminiError("ai_not_configured", 503);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let response: Response;
    try {
      response = await fetcher(url, {
        method: "POST",
        // Newer Google AI Studio keys (the "AQ." prefixed "Authentication Key"
        // format, as opposed to the older "AIzaSy..." keys) are only accepted
        // via the x-goog-api-key header, not the old ?key= query parameter --
        // sending one as ?key= gets a 401 ACCESS_TOKEN_TYPE_UNSUPPORTED even
        // though the key itself is valid. The header works for both key
        // formats, so use it unconditionally instead of branching on format.
        headers: { "Content-Type": "application/json", "x-goog-api-key": config.apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "error",
        cache: "no-store",
      });
    } catch (error) {
      // Logged so the actual cause (DNS failure, TLS error, proxy refusal,
      // genuine timeout, ...) shows up in the server terminal instead of only
      // ever reaching the client as a generic "unavailable" message.
      console.error("[gemini] request to Gemini failed before a response came back:", error);
      throw new GeminiError(
        error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)
          ? "ai_timeout"
          : "ai_unavailable",
        502,
      );
    }

    const rawBody = await response.text();

    if (!response.ok) {
      // This is the single most useful line for debugging "AI unavailable":
      // Gemini's actual error body (invalid key, model not found, permission
      // denied, quota exceeded, bad request, ...) lands right here.
      console.error(`[gemini] Gemini returned HTTP ${response.status}:`, rawBody.slice(0, 4000));
      if ((response.status === 503 || response.status === 429) && attempt < MAX_ATTEMPTS) {
        console.warn(`[gemini] transient ${response.status}, retrying (attempt ${attempt + 1}/${MAX_ATTEMPTS})...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        continue;
      }
      throw new GeminiError(response.status === 429 ? "ai_quota" : "ai_unavailable", 502);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error("[gemini] response body was not valid JSON:", rawBody.slice(0, 4000));
      throw new GeminiError("ai_invalid_response", 502);
    }

    const text = extractText(payload);
    try {
      return JSON.parse(text);
    } catch {
      console.error("[gemini] structured text was not valid JSON:", text.slice(0, 4000));
      throw new GeminiError("ai_invalid_json", 502);
    }
  }

  // Unreachable: the loop always either returns or throws above. Satisfies
  // the compiler's control-flow analysis.
  throw new GeminiError("ai_unavailable", 502);
}

/**
 * Calls Gemini's generateContent endpoint in strict JSON mode and returns
 * the parsed (but not yet validated) JSON. Every caller must validate the
 * shape itself before trusting any field, same discipline as
 * field-assist-provider.ts applies to third-party photo-ID responses.
 */
export async function geminiJSON(
  prompt: string,
  responseSchema: Record<string, unknown>,
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  return callGemini([{ text: prompt }], responseSchema, 20000, fetcher);
}

/**
 * Same contract as geminiJSON, but sends an audio clip (base64) alongside
 * the instruction text, for features that work from a recording rather
 * than client-transcribed text (e.g. the mobile app's voice field notes).
 * Audio understanding needs a longer timeout than a plain text prompt.
 */
export async function geminiJSONFromAudio(
  instruction: string,
  audioBase64: string,
  mimeType: string,
  responseSchema: Record<string, unknown>,
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  return callGemini(
    [{ text: instruction }, { inlineData: { mimeType, data: audioBase64 } }],
    responseSchema,
    // 45s was cutting it too close for real audio-understanding calls and
    // aborting requests Gemini would otherwise have answered. The mobile
    // client's own abort timeout (voice-field-note.ts) matches this value.
    90000,
    fetcher,
  );
}

// Shared across providers (Gemini and Groq both throw these same codes via
// their own error classes), so the wording stays provider-agnostic.
export function aiErrorMessage(code: string): string {
  switch (code) {
    case "ai_not_configured":
      return "This AI feature needs an API key configured on the server. Ask an admin to set one up.";
    case "ai_quota":
      return "The AI provider is temporarily rate-limited. Try again in a moment.";
    case "ai_timeout":
      return "The AI provider took too long to respond. Try again.";
    case "unsupported_audio_type":
      return "That recording's audio format isn't supported. Try recording again.";
    default:
      return "The AI provider is unavailable right now. Try again shortly.";
  }
}
