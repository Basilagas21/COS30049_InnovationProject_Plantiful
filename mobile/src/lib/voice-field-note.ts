import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Structures a spoken field note into a few known record fields. The actual
// AI call happens on the web deployment (no AI SDK on-device, same reason
// AI Field Assist works this way): this just records audio, sends it there,
// and returns the suggestion for the botanist to review. Mirrors the
// existing field-assist.ts request pattern (bearer token to the configured
// web origin), just without a record id in the path.

export type Phenology = 'vegetative' | 'flowering' | 'fruiting' | 'dormant' | 'unknown';

export type StructuredFieldNote = {
  heightCm: number | null;
  phenology: Phenology | null;
  morphology: string | null;
  notes: string | null;
};

// expo-audio's recording preset uses a different container per platform
// (.m4a/AAC on iOS & Android, WebM on web, via the browser's MediaRecorder).
// The mime type sent to the server has to match what was actually recorded,
// or Gemini fails to decode the audio.
export const VOICE_RECORDING_MIME_TYPE = Platform.OS === 'web' ? 'audio/webm' : 'audio/mp4';

// Matches the server's own cap (web/src/lib/voice-structure.ts). Checked
// client-side too so a long recording fails fast with a clear message
// instead of a slow upload that gets rejected anyway.
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

// expo-file-system's File class is not implemented on web at all (it just
// warns and no-ops). On web the recorder instead hands back a blob: URL, so
// read it the plain browser way: fetch it, then base64-encode the blob with
// FileReader.
async function readAudioAsBase64(uri: string): Promise<{ base64: string; size: number }> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('Could not read that recording.');
    }
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const commaIndex = result.indexOf(',');
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      };
      reader.onerror = () => reject(new Error('Could not read that recording.'));
      reader.readAsDataURL(blob);
    });
    return { base64, size: blob.size };
  }

  const file = new File(uri);
  const info = file.info();
  if (!info.exists || !info.size) {
    throw new Error('Could not read that recording.');
  }
  const base64 = await file.base64();
  return { base64, size: info.size };
}

function voiceStructureEndpoint() {
  const origin = process.env.EXPO_PUBLIC_FIELD_ASSIST_URL;
  if (!origin) {
    throw new Error('AI voice notes are not configured. Your recording is kept, just not sent.');
  }
  return `${origin.replace(/\/$/, '')}/api/voice-structure`;
}

export async function structureVoiceNote(audioUri: string, mimeType: string): Promise<StructuredFieldNote> {
  const { base64: audioBase64, size } = await readAudioAsBase64(audioUri);
  if (size > MAX_AUDIO_BYTES) {
    throw new Error('That recording is too long. Keep voice notes under about a minute.');
  }

  const session = await supabase?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) {
    throw new Error('Sign in to use voice notes.');
  }

  // Matches the server's own audio-call timeout (web/src/lib/gemini.ts). Audio
  // understanding is slower than a plain text prompt, so this needs real
  // headroom -- 45s was cutting it too close and aborting valid requests.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch(voiceStructureEndpoint(), {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, mimeType }),
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      const message = typeof data.message === 'string' ? data.message : 'Could not structure that note. Try again.';
      throw new Error(message);
    }
    return data.structured as StructuredFieldNote;
  } finally {
    clearTimeout(timer);
  }
}
