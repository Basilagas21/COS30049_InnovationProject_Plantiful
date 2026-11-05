import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { Pressable, TextInput } from '@/lib/interactionLog';
import { useTheme } from '@/lib/theme';
import { fieldAssistRequest } from '@/lib/field-assist';
import { getCurrentUserId } from '@/lib/currentUser';
import type { AssistResponse } from '../../../web/src/lib/field-assist-types';

export function FieldAssistPanel({ serverId, synced }: { serverId: string | null; synced: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<AssistResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [cached, setCached] = useState(false);
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const refresh = useCallback(async () => {
    if (!serverId) return;
    setBusy(true);
    let cacheKey: string | null = null;
    try {
      const user = await getCurrentUserId();
      cacheKey = user ? `field-assist:${user}:${serverId}` : null;
      const result: AssistResponse = await fieldAssistRequest(serverId);
      setData(result); setCached(false); setMessage('');
      if (cacheKey) await AsyncStorage.setItem(cacheKey, JSON.stringify(result)).catch(() => {});
    } catch (error) {
      setCached(true);
      setMessage(error instanceof Error ? error.message : 'Unable to refresh. Check your connection.');
      if (cacheKey) {
        try { const saved = await AsyncStorage.getItem(cacheKey); if (saved) setData(JSON.parse(saved)); } catch { /* Cache is optional. */ }
      }
    } finally { setBusy(false); }
  }, [serverId]);
  useFocusEffect(useCallback(() => { setData(null); void refresh(); }, [refresh]));
  async function act(method: string, body?: unknown) {
    if (!serverId || busy) return;
    setBusy(true); setMessage('');
    try { await fieldAssistRequest(serverId, method, body); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Request failed. Your record is safe.'); }
    finally { setBusy(false); }
  }
  const attempt = data?.attempts[0];
  const canDecide = synced && !cached && data?.owner && attempt?.stale === false && ['succeeded', 'no_match'].includes(attempt.status);
  const button = (label: string, action: () => void, disabled = false) => <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || disabled }}
    disabled={busy || disabled} onPress={action} style={{ minHeight: 44, justifyContent: 'center', padding: 12, borderRadius: 12,
      backgroundColor: colors.sprout, opacity: busy || disabled ? 0.5 : 1 }}><Text style={{ color: colors.emerald, fontWeight: '600' }}>{label}</Text></Pressable>;
  const decide = (outcome: string, extra: object = {}) => void act('PATCH', { attemptId: attempt?.attempt_id, role: 'collector', outcome, note, ...extra });
  return <View style={{ padding: 16, gap: 12, borderRadius: 20, backgroundColor: colors.white }}>
    <Text style={{ fontSize: 20, fontWeight: '700', color: colors.pine }}>AI Field Assist</Text>
    <Text style={{ color: colors.muted }}>Suggestions are unverified. Save as unidentified when uncertain. AI does not confirm a species.</Text>
    {(!serverId || !synced) && <>
      <Text style={{ color: colors.pine }}>Upload required. Save and sync the latest record and photos before requesting or selecting suggestions.</Text>
      {button('Open Sync', () => router.push('/sync'))}
    </>}
    {serverId && <>
      {button('Refresh identification history', () => void refresh())}
      {data && !data.enabled && <Text style={{ color: colors.muted }}>Provider not configured. Your observation is still saved normally.</Text>}
      {data?.owner && button(attempt?.status === 'failed' ? 'Retry identification' : 'Suggest species', () => void act('POST'), !synced || !data.enabled)}
      <Text style={{ color: colors.muted, fontSize: 12 }}>Requesting sends up to five uploaded photo files, ordered by photo ID, to {data?.provider ?? 'the configured provider'}. All must show the same plant. No separate coordinate or note fields are added. Embedded image metadata may be included.</Text>
    </>}
    {busy && <ActivityIndicator color={colors.emerald} />}
    {!!message && <Text accessibilityLiveRegion="polite" style={{ color: colors.danger }}>{message}</Text>}
    {cached && data && <Text style={{ color: colors.muted }}>Cached history. Current evidence cannot be verified while disconnected. Refresh before making a decision.</Text>}
    {attempt && <>
      <Text style={{ color: colors.pine }}>{attempt.provider} · {attempt.status.replace('_', ' ')} · {new Date(attempt.created_at).toLocaleString()}</Text>
      {attempt.stale !== false && <Text style={{ color: colors.danger }}>{attempt.stale ? 'Evidence changed. Request suggestions again.' : 'Unable to verify current evidence.'}</Text>}
      {attempt.status === 'processing' && <Text style={{ color: colors.muted }}>Processing. Refresh shortly. Interrupted attempts can be retried after three minutes.</Text>}
      {attempt.error_code && <Text style={{ color: colors.danger }}>{attempt.error_code.replace(/_/g, ' ')}</Text>}
      {attempt.status === 'no_match' && <Text style={{ color: colors.pine }}>No suitable match returned. Keep unidentified or choose a catalogue species using your own assessment.</Text>}
      {attempt.candidates.map((candidate, index) => <View key={`${candidate.scientificName}-${index}`} style={{ padding: 12, gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12 }}>
        <Text style={{ color: colors.pine, fontWeight: '700' }}>{candidate.scientificName}</Text>
        <Text style={{ color: colors.muted }}>{candidate.commonNames.join(', ')}</Text>
        <Text style={{ color: colors.muted }}>Provider score {candidate.score.toFixed(3)} · not a verified probability of correctness</Text>
        {candidate.speciesId ? button('View catalogue reference', () => router.push({ pathname: '/species/[id]', params: { id: candidate.speciesId! } })) : <Text style={{ color: colors.muted }}>No local catalogue match. No species will be created.</Text>}
        {candidate.guidance && <>
          {candidate.guidance.prompts.map(prompt => <Text key={prompt} style={{ color: colors.pine }}>• {prompt}</Text>)}
          <Text style={{ color: colors.muted, fontSize: 12 }}>Reviewed guidance r{candidate.guidance.revision} · {candidate.guidance.source}</Text>
        </>}
        {button('Select provisionally', () => decide('selected', { candidateIndex: index }), !canDecide)}
      </View>)}
      {canDecide && <>
        <TextInput value={note} onChangeText={setNote} maxLength={2000} multiline placeholder="Why this choice? What remains uncertain?" placeholderTextColor={colors.muted}
          accessibilityLabel="Identification decision note" style={{ color: colors.pine, borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: 12 }} />
        {button('Keep unidentified', () => decide('unidentified'))}
        <TextInput value={search} onChangeText={setSearch} placeholder="Or search another catalogue species" placeholderTextColor={colors.muted}
          accessibilityLabel="Search catalogue for provisional identification" style={{ color: colors.pine, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12 }} />
        {search.trim().length > 1 && data?.catalogue.filter(s => s.scientific_name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
          .map(s => <View key={s.species_id}>{button(`Select ${s.scientific_name}`, () => decide('selected', { speciesId: s.species_id }))}</View>)}
      </>}
    </>}
    {!!data?.decisions.length && <>
      <Text style={{ color: colors.pine, fontWeight: '700' }}>Decision history</Text>
      {data.decisions.slice(0, 10).map(d => <View key={d.decision_id} style={{ gap: 4 }}>
        <Text style={{ color: colors.pine }}>{d.decision_role === 'officer' ? 'Officer review' : 'Collector provisional choice'} · {d.scientific_name ?? d.outcome.replace('_', ' ')}</Text>
        <Text style={{ color: colors.muted }}>{new Date(d.created_at).toLocaleString()} · {d.note}</Text>
      </View>)}
    </>}
    {(data?.attempts.length ?? 0) > 1 && <Text style={{ color: colors.muted }}>Earlier attempts: {data?.attempts.slice(1).map(a => `${a.provider} ${a.status} (${new Date(a.created_at).toLocaleDateString()})`).join('; ')}</Text>}
  </View>;
}
