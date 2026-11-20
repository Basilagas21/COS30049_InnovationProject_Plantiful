// Turns a botanist's spoken field note into suggested values for a few known
// record fields. The actual capture happens in the mobile app (botanists are
// in the field, not at a laptop): this is the backend the app calls, mirroring
// the mobile app's existing field-assist.ts pattern (bearer-token request to
// this web deployment). The botanist reviews and can edit every value before
// anything is saved; this never writes to the database itself.
import { transcribeAudioGroq, chatJSONGroq } from "@/lib/groq";

// MIME types the mobile recorder is known to produce (expo-audio's
// HIGH_QUALITY preset: .m4a/AAC on iOS/Android, WebM on web via the
// browser's MediaRecorder), plus a few common equivalents. Never pass an
// arbitrary client-supplied string through to the transcription request
// unchecked -- groq.ts has its own, narrower mapping from mime type to the
// file extension Groq actually needs, which is the real enforcement point.
const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/3gpp",
  "audio/ogg",
]);

export function isAllowedAudioMimeType(mimeType: unknown): mimeType is string {
  return typeof mimeType === "string" && ALLOWED_AUDIO_MIME_TYPES.has(mimeType);
}

// Raw audio byte budget before base64 inflation; field notes are short, a
// few MB is generous for a recording well under a minute.
export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

export type StructuredFieldNote = {
  heightCm: number | null;
  phenology: "vegetative" | "flowering" | "fruiting" | "dormant" | "unknown" | null;
  morphology: string | null;
  notes: string | null;
};

// Groq's JSON mode (unlike Gemini's responseSchema) doesn't enforce field
// names or types itself -- it only guarantees the reply parses as JSON --
// so the shape has to be spelled out in the prompt instead, and validate()
// below does the actual enforcement regardless of what comes back.
const JSON_SHAPE_INSTRUCTION = `Respond with a JSON object with exactly these fields, and nothing else:
{
  "heightCm": number or null,
  "phenology": one of "vegetative", "flowering", "fruiting", "dormant", "unknown", or null,
  "morphology": string or null,
  "notes": string or null
}`;

const PHENOLOGY_VALUES = new Set(["vegetative", "flowering", "fruiting", "dormant", "unknown"]);

function validate(raw: unknown): StructuredFieldNote {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { heightCm: null, phenology: null, morphology: null, notes: null };
  }
  const body = raw as Record<string, unknown>;
  const height = typeof body.heightCm === "number" && Number.isFinite(body.heightCm) && body.heightCm >= 0 && body.heightCm < 10000
    ? Math.round(body.heightCm * 10) / 10
    : null;
  const phenology =
    typeof body.phenology === "string" && PHENOLOGY_VALUES.has(body.phenology)
      ? (body.phenology as StructuredFieldNote["phenology"])
      : null;
  const morphology = typeof body.morphology === "string" && body.morphology.trim() ? body.morphology.trim().slice(0, 2000) : null;
  const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 2000) : null;
  return { heightCm: height, phenology, morphology, notes };
}

export async function structureFieldNote(transcript: string): Promise<StructuredFieldNote> {
  const systemPrompt = `You extract structured data from a botanist's spoken field note. Extract only what is explicitly said. Use null for anything not mentioned -- never guess or invent a value, and never attempt to identify the plant species. ${JSON_SHAPE_INSTRUCTION}`;
  const userPrompt = `Transcript: """${transcript.slice(0, 2000)}"""`;

  const raw = await chatJSONGroq(systemPrompt, userPrompt);
  return validate(raw);
}

/**
 * Same extraction, but starting from a recorded audio clip rather than a
 * pre-transcribed string. Used by the mobile app, which has no built-in
 * speech-to-text: Groq's Whisper endpoint transcribes the clip first, then
 * the transcript is extracted the same way as the text path above. The
 * model is told explicitly to only use what's actually said, so a quiet or
 * unclear recording yields nulls rather than a guess.
 */
export async function structureFieldNoteFromAudio(
  audioBase64: string,
  mimeType: string,
): Promise<StructuredFieldNote> {
  const transcript = await transcribeAudioGroq(audioBase64, mimeType);
  return structureFieldNote(transcript);
}
