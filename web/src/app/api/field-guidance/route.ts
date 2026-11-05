import { assistContext, assistError, smallJson, UUID } from '@/lib/field-assist-server';
import { IdentificationError } from '@/lib/field-assist-provider';

export async function POST(request: Request) {
  try {
    const body = await smallJson(request);
    if (typeof body.recordId !== 'string') throw new IdentificationError('invalid_record', 400);
    const context = await assistContext(request, body.recordId);
    if (!context.reviewer) throw new IdentificationError('reviewer_required', 403);
    const { speciesId, source, kind } = body;
    if (typeof speciesId !== 'string' || !UUID.test(speciesId) || typeof source !== 'string' || !source.trim() || source.length > 1000) throw new IdentificationError('invalid_guidance', 400);
    const { db, user } = context;
    if (kind === 'guidance') {
      const { prompts } = body;
      if (!Array.isArray(prompts) || prompts.length < 1 || prompts.length > 10 || prompts.some(p => typeof p !== 'string' || !p.trim() || p.length > 400)) throw new IdentificationError('invalid_prompts', 400);
      const { data, error } = await db.from('ai_species_guidance').select('revision').eq('species_id', speciesId).order('revision', { ascending: false }).limit(1);
      if (error) throw new IdentificationError('guidance_unavailable', 503);
      const { error: writeError } = await db.from('ai_species_guidance').insert({ species_id: speciesId, prompts, source: source.trim(), revision: (data[0]?.revision ?? 0) + 1, reviewed_by: user.id });
      if (writeError) throw new IdentificationError('guidance_conflict_retry', 409);
    } else if (kind === 'alias') {
      const { scientificName, taxonId, provider } = body;
      if (!['plantnet','kindwise'].includes(String(provider)) || typeof scientificName !== 'string' || !scientificName.trim() || scientificName.length > 300 || typeof taxonId !== 'string' || taxonId.length > 200) throw new IdentificationError('invalid_alias', 400);
      const { error } = await db.from('ai_species_aliases').insert({ species_id: speciesId, scientific_name: scientificName.trim(), provider, provider_taxon_id: taxonId.trim() || null, source: source.trim(), reviewed_by: user.id });
      if (error) throw new IdentificationError('alias_save_failed', 409);
    } else throw new IdentificationError('invalid_guidance_action', 400);
    return Response.json({ saved: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return assistError(error); }
}
