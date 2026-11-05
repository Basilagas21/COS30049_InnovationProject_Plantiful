export type EvidenceInput = {
  photoCount: number; latitude?: number | null; longitude?: number | null; accuracyM?: number | null;
  identified: boolean; provisionalName?: string | null; morphology?: string; notes?: string;
};
export const EVIDENCE_PARTS = ['leaf', 'bark or stem', 'flower', 'fruit', 'whole plant'] as const;
export type EvidencePart = typeof EVIDENCE_PARTS[number];
export type PartState = 'not checked' | 'photographed' | 'not available';
export function partState(notes: string, part: EvidencePart): PartState {
  if (notes.split('\n').includes(`[Field evidence: ${part} = photographed]`)) return 'photographed';
  if (notes.split('\n').includes(`[Field evidence: ${part} = not available]`)) return 'not available';
  return 'not checked';
}
export function cyclePart(notes: string, part: EvidencePart): string {
  const current = partState(notes, part);
  const lines = notes.split('\n').filter(line => line !== `[Field evidence: ${part} = photographed]` && line !== `[Field evidence: ${part} = not available]`);
  const clean = lines.join('\n').trimEnd();
  const next = current === 'not checked' ? 'photographed' : current === 'photographed' ? 'not available' : null;
  return next ? `${clean}${clean ? '\n' : ''}[Field evidence: ${part} = ${next}]` : clean;
}
export function evidenceChecklist(input: EvidenceInput) {
  const coordinates = typeof input.latitude === 'number' && Number.isFinite(input.latitude) && Math.abs(input.latitude) <= 90 &&
    typeof input.longitude === 'number' && Number.isFinite(input.longitude) && Math.abs(input.longitude) <= 180;
  const accuracy = typeof input.accuracyM === 'number' && Number.isFinite(input.accuracyM) && input.accuracyM >= 0;
  const notes = (input.notes ?? '').split('\n').filter(line => !line.startsWith('[Field evidence: ')).join('\n').trim();
  return [
    { key: 'photo', complete: input.photoCount > 0, label: input.photoCount > 0 ? 'Photo attached' : 'Add a clear plant photograph' },
    { key: 'location', complete: coordinates, label: coordinates ? `Location recorded${accuracy ? ` · reported accuracy ±${Math.round(input.accuracyM!)} m` : ' · accuracy unavailable'}` : 'Capture the plant location if possible' },
    { key: 'identification', complete: input.identified, label: input.identified ? 'Catalogue species selected · still subject to review' : input.provisionalName?.trim() ? 'Provisional name recorded · identification unresolved' : 'Unidentified · you can save it this way' },
    { key: 'notes', complete: Boolean(input.morphology?.trim() || notes), label: input.morphology?.trim() || notes ? 'Field description supplied' : 'Describe visible features or uncertainty' },
  ];
}
