// Reproductive state recorded on site. Mirrors the CHECK constraint on
// plant_records.phenology in the backend schema (migration 010).
export const PHENOLOGY_OPTIONS = [
  { value: 'vegetative', label: 'Vegetative' },
  { value: 'flowering', label: 'Flowering' },
  { value: 'fruiting', label: 'Fruiting' },
  { value: 'dormant', label: 'Dormant' },
] as const;

export type PhenologyValue = (typeof PHENOLOGY_OPTIONS)[number]['value'];

export function phenologyLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return PHENOLOGY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
