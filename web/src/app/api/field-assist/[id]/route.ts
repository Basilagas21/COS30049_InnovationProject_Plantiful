import { assistContext, assistError, evidenceSnapshot, providerConfig, retainEvidence, smallJson, UUID } from '@/lib/field-assist-server';
import { identifyPlant, IdentificationError } from '@/lib/field-assist-provider';
import { matchSpecies } from '@/lib/field-assist-evidence';
import type { Attempt, Candidate, AssistResponse } from '@/lib/field-assist-types';

export const runtime = 'nodejs';
export const maxDuration = 120;
type Context = { params: Promise<{ id: string }> };
const reply = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET(request: Request, { params }: Context) {
  try {
    const context = await assistContext(request, (await params).id);
    const { db, owner, reviewer, record } = context;
    const [attemptsResult, catalogueResult] = await Promise.all([
      db.from('ai_identification_attempts').select('*').eq('record_id', record.record_id).order('created_at', { ascending: false }).limit(20),
      db.from('species').select('species_id,scientific_name').order('scientific_name').limit(1000),
    ]);
    if (attemptsResult.error || catalogueResult.error) throw new IdentificationError('field_assist_migration_required', 503);
    const attempts: Attempt[] = attemptsResult.data ?? [];
    const archivePaths = [...new Set(attempts.flatMap(a => a.photos.map(p => p.evidence_path).filter(Boolean)))];
    if (archivePaths.length) {
      const { data: signed } = await db.storage.from('ai-evidence').createSignedUrls(archivePaths, 300);
      const previews = new Map((signed ?? []).map(item => [item.path, item.signedUrl]));
      for (const attempt of attempts) for (const photo of attempt.photos) photo.preview_url = previews.get(photo.evidence_path) ?? undefined;
    }
    let snapshot: Awaited<ReturnType<typeof evidenceSnapshot>> | null = null;
    let evidenceError: string | undefined;
    if (attempts.length) {
      try { snapshot = await evidenceSnapshot(context); } catch (error) {
        evidenceError = error instanceof IdentificationError ? error.code : 'evidence_check_failed';
      }
    }
    const decisionsResult = attempts.length ? await db.from('ai_identification_decisions').select('*')
      .in('attempt_id', attempts.map(a => a.attempt_id)).order('created_at', { ascending: false }).limit(100) : { data: [], error: null };
    if (decisionsResult.error) throw new IdentificationError('history_unavailable', 503);
    const config = providerConfig();
    const result: AssistResponse = { enabled: Boolean(config), provider: config?.provider ?? null, owner, reviewer,
      attempts: attempts.map(a => ({ ...a, stale: snapshot ? a.fingerprint !== snapshot.fingerprint : null })),
      decisions: decisionsResult.data ?? [], catalogue: catalogueResult.data ?? [], evidenceError };
    return reply(result);
  } catch (error) { return assistError(error); }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const context = await assistContext(request, (await params).id);
    if (!context.owner) throw new IdentificationError('owner_required', 403);
    const config = providerConfig();
    if (!config) throw new IdentificationError('provider_not_configured', 503);
    const snapshot = await evidenceSnapshot(context);
    const { db, record, user } = context;
    const { data: reserved, error: reserveError } = await db.rpc('ai_reserve_attempt', {
      p_record: record.record_id, p_user: user.id, p_provider: config.provider, p_fingerprint: snapshot.fingerprint,
      p_version: record.version, p_photos: snapshot.photos, p_evidence: snapshot.evidence,
    });
    if (reserveError) throw new IdentificationError(reserveError.code === 'P0001' ? 'request_limit_reached' : 'unable_to_start_identification', reserveError.code === 'P0001' ? 429 : 409);
    const attempt = reserved.attempt as Attempt;
    if (!reserved.created) return reply({ attempt, cached: true }, attempt.status === 'processing' ? 202 : 200);
    const started = Date.now();
    try {
      await retainEvidence(context, snapshot);
      const result = await identifyPlant(config.provider, config.key, snapshot.images);
      const [catalogue, aliases, guidance] = await Promise.all([
        db.from('species').select('species_id,scientific_name').limit(1000),
        db.from('ai_species_aliases').select('*').eq('provider', config.provider).limit(5000),
        db.from('ai_species_guidance').select('*').order('revision', { ascending: false }).limit(5000),
      ]);
      if (catalogue.error || aliases.error || guidance.error) throw new IdentificationError('catalogue_unavailable', 503);
      const candidates: Candidate[] = result.candidates.map(candidate => {
        const mapped = matchSpecies(candidate.scientificName, candidate.taxonId, config.provider, catalogue.data ?? [], aliases.data ?? []);
        const guide = guidance.data?.find(g => g.species_id === mapped.speciesId);
        return { ...candidate, ...mapped, ...(guide ? { guidance: { prompts: guide.prompts, source: guide.source, revision: guide.revision, reviewedAt: guide.reviewed_at } } : {}) };
      });
      const { error } = await db.from('ai_identification_attempts').update({ status: candidates.length ? 'succeeded' : 'no_match',
        candidates, model_version: result.version, duration_ms: Date.now() - started, completed_at: new Date().toISOString() })
        .eq('attempt_id', attempt.attempt_id).eq('status', 'processing');
      if (error) throw new IdentificationError('result_save_failed', 503);
      return reply({ attemptId: attempt.attempt_id });
    } catch (error) {
      await db.from('ai_identification_attempts').update({ status: 'failed',
        error_code: error instanceof IdentificationError ? error.code : 'identification_failed',
        duration_ms: Date.now() - started, completed_at: new Date().toISOString() }).eq('attempt_id', attempt.attempt_id).eq('status', 'processing');
      throw error;
    }
  } catch (error) { return assistError(error); }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const context = await assistContext(request, (await params).id);
    const body = await smallJson(request);
    const { attemptId, role, outcome, note = '', speciesId, candidateIndex } = body;
    if (typeof attemptId !== 'string' || !UUID.test(attemptId) || !['collector', 'officer'].includes(String(role)) ||
      !['selected', 'unidentified', 'needs_evidence'].includes(String(outcome)) || typeof note !== 'string' || note.length > 2000) throw new IdentificationError('invalid_decision', 400);
    if ((role === 'collector' && !context.owner) || (role === 'officer' && !context.reviewer)) throw new IdentificationError('decision_not_allowed', 403);
    const { data: attempt, error } = await context.db.from('ai_identification_attempts').select('*')
      .eq('attempt_id', attemptId).eq('record_id', context.record.record_id).maybeSingle();
    if (error || !attempt) throw new IdentificationError('attempt_unavailable', 404);
    const snapshot = await evidenceSnapshot(context);
    if (snapshot.fingerprint !== attempt.fingerprint) throw new IdentificationError('evidence_changed_request_again', 409);
    let name: string | null = null;
    let species: string | null = null;
    if (outcome === 'selected') {
      if (typeof speciesId === 'string' && UUID.test(speciesId)) {
        const { data, error: speciesError } = await context.db.from('species').select('species_id,scientific_name').eq('species_id', speciesId).maybeSingle();
        if (speciesError || !data) throw new IdentificationError('species_unavailable', 400);
        name = data.scientific_name; species = data.species_id;
      } else if (Number.isInteger(candidateIndex) && Number(candidateIndex) >= 0 && Number(candidateIndex) < attempt.candidates.length) {
        const candidate = attempt.candidates[Number(candidateIndex)] as Candidate;
        name = candidate.scientificName; species = candidate.speciesId ?? null;
      } else throw new IdentificationError('select_species_or_candidate', 400);
    }
    const { error: decisionError } = await context.db.rpc('ai_record_decision', { p_attempt: attemptId, p_actor: context.user.id,
      p_role: role, p_species: species, p_name: name, p_outcome: outcome, p_note: note.trim(), p_fingerprint: snapshot.fingerprint });
    if (decisionError) throw new IdentificationError('decision_conflict_reload', 409);
    return reply({ saved: true });
  } catch (error) { return assistError(error); }
}
