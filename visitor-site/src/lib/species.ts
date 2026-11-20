import { getPublicSupabaseClient } from "@/lib/supabase";

export type PublicSpecies = {
  id: string;
  scientificName: string;
  commonName: string | null;
  taxonomy: string | null;
  conservationStatus: string | null;
  description: string | null;
  ecology: string | null;
  culturalSignificance: string | null;
  photoUrl: string | null;
};

export type SpeciesListResult =
  | { state: "not_configured" }
  | { state: "error"; message: string }
  | { state: "ok"; species: PublicSpecies[]; verifiedObservationCount: number | null };

export type SpeciesDetailResult =
  | { state: "not_configured" }
  | { state: "error"; message: string }
  | { state: "ok"; species: PublicSpecies | null };

function toPublicSpecies(row: {
  species_id: string;
  scientific_name: string;
  common_name: string | null;
  taxonomy: string | null;
  conservation_status: string | null;
  description: string | null;
  ecology: string | null;
  cultural_significance: string | null;
  species_photos?: { photo_url: string }[] | null;
}): PublicSpecies {
  return {
    id: row.species_id,
    scientificName: row.scientific_name,
    commonName: row.common_name,
    taxonomy: row.taxonomy,
    conservationStatus: row.conservation_status,
    description: row.description,
    ecology: row.ecology,
    culturalSignificance: row.cultural_significance,
    photoUrl: row.species_photos?.[0]?.photo_url ?? null,
  };
}

/**
 * Fetches published species plus a count of approved ("verified") field
 * observations, for the public species explorer on the homepage.
 *
 * Distinguishes three real states instead of collapsing them into one
 * misleading "no species yet" message:
 *  - not_configured: NEXT_PUBLIC_SUPABASE_URL / ANON_KEY aren't set in this
 *    deployment, so there's nothing to query yet.
 *  - error: the query ran but failed (network, RLS, etc.) — different from
 *    "zero species exist".
 *  - ok: the query succeeded, species may still be an empty array.
 */
export async function fetchPublicSpeciesData(): Promise<SpeciesListResult> {
  const supabase = getPublicSupabaseClient();
  if (!supabase) return { state: "not_configured" };

  const [speciesRes, observationsRes] = await Promise.all([
    supabase
      .from("species")
      .select(
        `species_id, scientific_name, common_name, taxonomy, conservation_status, description, ecology, cultural_significance,
         species_photos ( photo_url )`,
      )
      .eq("is_published", true)
      .order("scientific_name", { ascending: true }),
    supabase
      .from("plant_records")
      .select("record_id", { count: "exact", head: true })
      .eq("approval_status", "approved"),
  ]);

  if (speciesRes.error) {
    return { state: "error", message: speciesRes.error.message };
  }

  return {
    state: "ok",
    species: (speciesRes.data ?? []).map(toPublicSpecies),
    // A failed count query shouldn't hide the species list — just omit the stat.
    verifiedObservationCount: observationsRes.error ? null : (observationsRes.count ?? 0),
  };
}

/** Fetches one published species by id for the visitor-friendly plant page.
 *  Unpublished species are never returned here (RLS already blocks the anon
 *  role from reading them, and this also filters explicitly to be clear). */
export async function fetchPublicSpeciesById(id: string): Promise<SpeciesDetailResult> {
  const supabase = getPublicSupabaseClient();
  if (!supabase) return { state: "not_configured" };

  const { data, error } = await supabase
    .from("species")
    .select(
      `species_id, scientific_name, common_name, taxonomy, conservation_status, description, ecology, cultural_significance,
       species_photos ( photo_url )`,
    )
    .eq("species_id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error) return { state: "error", message: error.message };
  return { state: "ok", species: data ? toPublicSpecies(data) : null };
}

/**
 * Plain-language IUCN Red List category reference, most to least at-risk.
 * Data Deficient / Not Evaluated aren't risk levels, so they're listed last.
 * Source: IUCN Red List Categories & Criteria (summarised for a general
 * audience) — see https://livingrainforest.org/learning-resources/iucn-conservation-status-explained
 *
 * Plantiful's own `conservation_status` field is set by SFC's botanists and
 * may not always match a full, current official Red List assessment for
 * that exact species — this is a general reference for what the wording
 * means, not a live lookup against the IUCN database.
 */
export const CONSERVATION_STATUS_GLOSSARY = [
  {
    code: "EX",
    name: "Extinct",
    summary:
      "No individuals of the species are known to survive anywhere, after extensive searching.",
  },
  {
    code: "EW",
    name: "Extinct in the Wild",
    summary:
      "The species only survives in cultivation or captivity, or well outside its original range.",
  },
  {
    code: "CR",
    name: "Critically Endangered",
    summary: "Facing an extremely high risk of extinction in the wild.",
  },
  {
    code: "EN",
    name: "Endangered",
    summary: "Facing a very high risk of extinction in the wild.",
  },
  {
    code: "VU",
    name: "Vulnerable",
    summary: "Facing a high risk of extinction in the wild.",
  },
  {
    code: "NT",
    name: "Near Threatened",
    summary:
      "Not currently threatened enough to qualify as at-risk, but likely to become so if current pressures (such as habitat loss) continue.",
  },
  {
    code: "LC",
    name: "Least Concern",
    summary: "Widespread and abundant, with no major current threats.",
  },
  {
    code: "DD",
    name: "Data Deficient",
    summary:
      "Not enough information exists to judge extinction risk — this doesn't mean the species is safe, only that it hasn't been assessed well enough yet.",
  },
  {
    code: "NE",
    name: "Not Evaluated",
    summary: "Hasn't yet been assessed against the Red List criteria.",
  },
] as const;

export function describeConservationStatus(status: string | null): string | null {
  if (!status) return null;
  const match = CONSERVATION_STATUS_GLOSSARY.find(
    (entry) => entry.name.toLowerCase() === status.toLowerCase(),
  );
  return match?.summary ?? null;
}
