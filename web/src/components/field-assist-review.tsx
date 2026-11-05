"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { AssistResponse, Attempt } from '@/lib/field-assist-types';
import { PhotoImg } from '@/components/photo-img';

const buttonClass = 'rounded-xl bg-emerald px-4 py-3 text-sm font-semibold text-white disabled:opacity-50';
async function fetchHistory(endpoint: string, signal?: AbortSignal): Promise<AssistResponse> {
  const response = await fetch(endpoint, { cache: 'no-store', signal });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.replaceAll('_', ' ') ?? 'Unable to load AI history');
  return result;
}
export function FieldAssistReview({ recordId }: { recordId: string }) {
  const [data, setData] = useState<AssistResponse | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(true);
  const [note, setNote] = useState('');
  const [species, setSpecies] = useState('');
  const [selected, setSelected] = useState('');
  const endpoint = `/api/field-assist/${encodeURIComponent(recordId)}`;
  const load = useCallback(async () => {
    try {
      const result = await fetchHistory(endpoint);
      setData(result); setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load AI history'); }
    finally { setBusy(false); }
  }, [endpoint]);
  useEffect(() => {
    const controller = new AbortController();
    fetchHistory(endpoint, controller.signal).then(result => {
      if (!controller.signal.aborted) { setData(result); setMessage(''); }
    }).catch(error => {
      if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'Unable to load AI history');
    }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [endpoint]);
  const attempt: Attempt | undefined = data?.attempts.find(a => a.attempt_id === selected) ?? data?.attempts[0];
  const canReview = Boolean(data?.reviewer && attempt?.stale === false && ['succeeded', 'no_match'].includes(attempt.status));
  async function decide(outcome: string, extra: object = {}) {
    setBusy(true);
    try {
      const response = await fetch(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: attempt?.attempt_id, role: 'officer', outcome, note, ...extra }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.replaceAll('_', ' ') ?? 'Could not record decision');
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not record decision'); }
    finally { setBusy(false); }
  }
  return <section id="ai-field-assist" className="mt-8 space-y-4 rounded-2xl border border-pine/15 bg-surface p-5">
    <h2 className="text-xl font-semibold text-pine">AI Field Assist review</h2>
    <p className="text-sm text-moss">AI suggestions are unverified. Identification decisions are recorded separately from observation approval and species publication. This panel does not overwrite the observation species assignment.</p>
    <button className={buttonClass} disabled={busy} onClick={() => { setBusy(true); void load(); }}>{busy ? 'Loading…' : 'Refresh evidence and history'}</button>
    {message && <p role="status" className="text-sm text-danger">{message}</p>}
    {data && !data.attempts.length && <p className="text-moss">No identification attempt recorded. The collector can request suggestions after syncing photographs.</p>}
    {data && data.attempts.length > 0 && <label className="block text-sm text-pine">Identification attempt
      <select className="mt-1 block w-full rounded-lg border p-2" value={attempt?.attempt_id} onChange={e => { setSelected(e.target.value); setNote(''); setSpecies(''); }}>
        {data.attempts.map(a => <option key={a.attempt_id} value={a.attempt_id}>{new Date(a.created_at).toLocaleString()} · {a.provider} · {a.status}</option>)}
      </select>
    </label>}
    {attempt && <>
      <p className="text-sm text-moss">Model {attempt.model_version ?? 'not exposed by provider'} · {attempt.duration_ms == null ? 'Timing unavailable' : `${attempt.duration_ms} ms`} · Record revision {attempt.record_version}</p>
      {attempt.stale !== false && <p className="text-danger">{attempt.stale ? 'Evidence changed since this attempt. Request a new identification before making a decision.' : 'Current evidence could not be verified. Decisions are disabled until verification succeeds.'}</p>}
      {attempt.error_code && <p className="text-danger">{attempt.error_code.replaceAll('_', ' ')}</p>}
      <p className="text-sm text-moss">Recorded evidence: {String(attempt.evidence.analysedPhotoCount ?? attempt.photos.length)} analysed photos. Location {attempt.evidence.locationRecorded ? 'recorded' : 'missing'}. GPS accuracy {typeof attempt.evidence.gpsAccuracyM === 'number' ? `±${attempt.evidence.gpsAccuracyM} m` : 'unavailable'}. Field notes {attempt.evidence.fieldNotesRecorded ? 'supplied' : 'missing'}.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{attempt.photos.map(photo => <figure key={photo.photo_id}>
        <PhotoImg src={photo.preview_url ?? null} alt="Archived photograph analysed in this identification attempt" className="aspect-square w-full rounded-xl object-contain" />
        <figcaption className="break-all text-xs text-moss">Photo {photo.photo_id}<br />SHA-256 {photo.sha256}</figcaption>
      </figure>)}</div>
      <p className="text-xs text-moss">These are private, content-addressed copies of the analysed photographs. Preview links expire after five minutes. Refresh to renew them. Current evidence is checked separately for changes.</p>
      {attempt.status === 'no_match' && <p>No suitable match returned. This is not evidence that the plant is a new species.</p>}
      <div className="space-y-3">{attempt.candidates.map((candidate, index) => <div key={candidate.scientificName} className="space-y-2 rounded-xl bg-sprout/40 p-4">
        <h3 className="font-semibold italic">{candidate.scientificName}</h3>
        <p className="text-sm">{candidate.commonNames.join(', ')}</p>
        <p className="text-xs text-moss">Provider score {candidate.score.toFixed(3)}, not a calibrated correctness probability. Mapping {candidate.mapping ?? 'unmapped'}.</p>
        {candidate.speciesId && <Link href={`/species/${candidate.speciesId}`} className="block text-sm text-emerald underline">Open catalogue reference</Link>}
        {candidate.guidance && <div className="text-sm"><ul className="list-inside list-disc">{candidate.guidance.prompts.map(p => <li key={p}>{p}</li>)}</ul><p>Source {candidate.guidance.source} · revision {candidate.guidance.revision}</p></div>}
        <button className={buttonClass} disabled={busy || !canReview} onClick={() => void decide('selected', { candidateIndex: index })}>Record officer identification</button>
      </div>)}</div>
      {data?.reviewer && <div className="space-y-3">
        <label className="block text-sm">Review note<textarea className="mt-1 block w-full rounded-lg border p-3" value={note} onChange={e => setNote(e.target.value)} maxLength={2000} /></label>
        <label className="block text-sm">Correct to another catalogue species<select className="mt-1 block w-full rounded-lg border p-3" value={species} onChange={e => setSpecies(e.target.value)}>
          <option value="">Choose a species</option>{data.catalogue.map(s => <option key={s.species_id} value={s.species_id}>{s.scientific_name}</option>)}
        </select></label>
        <div className="flex flex-wrap gap-2">
          <button className={buttonClass} disabled={busy || !canReview || !species} onClick={() => void decide('selected', { speciesId: species })}>Record corrected identification</button>
          <button className={buttonClass} disabled={busy || !canReview} onClick={() => void decide('unidentified')}>Keep unidentified</button>
          <button className={buttonClass} disabled={busy || !canReview} onClick={() => void decide('needs_evidence')}>Record evidence request</button>
        </div>
      </div>}
    </>}
    {!!data?.decisions.length && <div className="space-y-2"><h3 className="font-semibold">Decision history</h3>{data.decisions.map(d => <div key={d.decision_id} className="rounded-xl border p-3 text-sm">
      <p>{d.decision_role === 'officer' ? 'Officer review' : 'Collector provisional choice'} · {d.scientific_name ?? d.outcome.replaceAll('_', ' ')}</p>
      <p className="text-xs text-moss">{new Date(d.created_at).toLocaleString()} · Attempt {d.attempt_id} · Reviewer {d.actor_id}</p><p>{d.note}</p>
    </div>)}</div>}
    {data?.reviewer && <GuidanceEditor recordId={recordId} catalogue={data.catalogue} />}
  </section>;
}

function GuidanceEditor({ recordId, catalogue }: { recordId: string; catalogue: AssistResponse['catalogue'] }) {
  const [species, setSpecies] = useState('');
  const [prompts, setPrompts] = useState('');
  const [source, setSource] = useState('');
  const [alias, setAlias] = useState('');
  const [provider, setProvider] = useState('plantnet');
  const [taxonId, setTaxonId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function save(kind: string) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/field-guidance', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, speciesId: species, kind, prompts: prompts.split('\n').map(p => p.trim()).filter(Boolean), source, scientificName: alias, provider, taxonId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.replaceAll('_', ' ') ?? 'Unable to save');
      setMessage('Saved with your reviewer identity. Historical identification results retain their original guidance.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save'); }
    finally { setBusy(false); }
  }
  return <details className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">Manage reviewed guidance and aliases</summary>
    <div className="mt-3 space-y-3 text-sm">
      <p>Enter source-backed guidance you have reviewed. Do not publish generated diagnostic claims without checking them.</p>
      <label className="block">Species<select className="block w-full rounded border p-2" value={species} onChange={e => setSpecies(e.target.value)}><option value="">Choose species</option>{catalogue.map(s => <option key={s.species_id} value={s.species_id}>{s.scientific_name}</option>)}</select></label>
      <label className="block">Reference or source<input className="block w-full rounded border p-2" value={source} onChange={e => setSource(e.target.value)} maxLength={1000} /></label>
      <label className="block">Capture prompts, one per line<textarea className="block w-full rounded border p-2" value={prompts} onChange={e => setPrompts(e.target.value)} maxLength={4000} /></label>
      <button className={buttonClass} disabled={busy || !species || !source.trim() || !prompts.trim()} onClick={() => void save('guidance')}>Publish reviewed guidance revision</button>
      <label className="block">Alias provider<select className="block rounded border p-2" value={provider} onChange={e => setProvider(e.target.value)}><option value="plantnet">Pl@ntNet (GBIF ID)</option><option value="kindwise">Kindwise (suggestion ID)</option></select></label>
      <label className="block">Reviewed scientific name or synonym<input className="block w-full rounded border p-2" value={alias} onChange={e => setAlias(e.target.value)} maxLength={300} /></label>
      <label className="block">Provider taxon ID, if verified<input className="block w-full rounded border p-2" value={taxonId} onChange={e => setTaxonId(e.target.value)} maxLength={200} /></label>
      <button className={buttonClass} disabled={busy || !species || !source.trim() || !alias.trim()} onClick={() => void save('alias')}>Save reviewed mapping</button>
      {message && <p role="status">{message}</p>}
    </div>
  </details>;
}
