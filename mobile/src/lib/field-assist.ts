import { supabase } from './supabase';

export function assistEndpoint(recordId: string) {
  const origin = process.env.EXPO_PUBLIC_FIELD_ASSIST_URL;
  if (!origin) throw new Error('AI Field Assist is not configured. Your offline record is safe.');
  return `${origin.replace(/\/$/, '')}/api/field-assist/${encodeURIComponent(recordId)}`;
}
export async function fieldAssistRequest(recordId: string, method = 'GET', body?: unknown) {
  const endpoint = assistEndpoint(recordId);
  const session = await supabase?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) throw new Error('Sign in to use AI Field Assist.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(endpoint, { method, signal: controller.signal, headers: {
      Authorization: `Bearer ${token}`, 'Content-Type': 'application/json',
    }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error.replace(/_/g, ' ') : 'AI request failed. Try again when connected.');
    return data;
  } finally { clearTimeout(timer); }
}
