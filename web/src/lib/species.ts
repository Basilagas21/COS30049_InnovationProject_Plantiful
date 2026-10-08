import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type SpeciesListItem = {
  id: string;
  scientificName: string;
  commonName: string | null;
  taxonomy: string | null;
  conservationStatus: string | null;
  description: string | null;
  ecology: string | null;
  culturalSignificance: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  photoUrl: string | null;
  photoCount: number;
};

export type SpeciesPhoto = {
  photoId: string;
  photoUrl: string;
  uploadedAt: string;
};

export type SpeciesDetail = SpeciesListItem & {
  photos: SpeciesPhoto[];
};

const mockSpecies: SpeciesListItem[] = [
  {
    id: "SP-0001",
    scientificName: "Nepenthes lowii",
    commonName: "Low's pitcher plant",
    taxonomy: "Caryophyllales · Nepenthaceae",
    conservationStatus: "Endangered",
    description:
      "Pitcher plant endemic to Borneo, named after Hugh Low. Notable for the distinctive lid that excretes nectar, attracting tree shrews that feed on it.",
    ecology: null,
    culturalSignificance: null,
    isPublished: true,
    createdAt: "2026-08-01T09:00:00Z",
    updatedAt: "2026-08-01T09:00:00Z",
    photoUrl: null,
    photoCount: 0,
  },
  {
    id: "SP-0002",
    scientificName: "Rafflesia tuan-mudae",
    commonName: "Tuan Muda's rafflesia",
    taxonomy: "Malpighiales · Rafflesiaceae",
    conservationStatus: "Endangered",
    description:
      "Parasitic plant known for producing some of the largest flowers in the world, up to a metre across, found only on specific host vines.",
    ecology: null,
    culturalSignificance: null,
    isPublished: true,
    createdAt: "2026-08-03T09:00:00Z",
    updatedAt: "2026-08-03T09:00:00Z",
    photoUrl: null,
    photoCount: 0,
  },
  {
    id: "SP-0003",
    scientificName: "Dipterocarpus grandiflorus",
    commonName: "Keruing",
    taxonomy: "Malvales · Dipterocarpaceae",
    conservationStatus: "Vulnerable",
    description:
      "Large dipterocarp timber tree prized for its resin and hardwood; a key canopy species of the lowland dipterocarp forest around Niah.",
    ecology: null,
    culturalSignificance: null,
    isPublished: true,
    createdAt: "2026-08-05T09:00:00Z",
    updatedAt: "2026-08-05T09:00:00Z",
    photoUrl: null,
    photoCount: 0,
  },
  {
    id: "SP-0004",
    scientificName: "Calanthe triplicata",
    commonName: "Christmas orchid",
    taxonomy: "Asparagales · Orchidaceae",
    conservationStatus: null,
    description:
      "Terrestrial orchid with tall spikes of small white flowers, common on shady forest floors.",
    ecology: null,
    culturalSignificance: null,
    isPublished: true,
    createdAt: "2026-08-08T09:00:00Z",
    updatedAt: "2026-08-08T09:00:00Z",
    photoUrl: null,
    photoCount: 0,
  },
  {
    id: "SP-0005",
    scientificName: "Begonia sarawakensis",
    commonName: "Begonia",
    taxonomy: "Cucurbitales · Begoniaceae",
    conservationStatus: null,
    description: null,
    ecology: null,
    culturalSignificance: null,
    isPublished: false,
    createdAt: "2026-09-01T09:00:00Z",
    updatedAt: "2026-09-01T09:00:00Z",
    photoUrl: null,
    photoCount: 0,
  },
  {
    id: "SP-0006",
    scientificName: "Eugenia palembanica",
    commonName: "Keruntun tree",
    taxonomy: "Myrtales · Myrtaceae",
    conservationStatus: "Endangered",
    description: null,
    ecology: null,
    culturalSignificance: null,
    isPublished: false,
    createdAt: "2026-09-02T09:00:00Z",
    updatedAt: "2026-09-02T09:00:00Z",
    photoUrl: null,
    photoCount: 0,
  },
];

function toListItem(row: {
  species_id: string;
  scientific_name: string;
  common_name: string | null;
  taxonomy: string | null;
  conservation_status: string | null;
  description: string | null;
  ecology: string | null;
  cultural_significance: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  species_photos?: { photo_url: string }[] | null;
}): SpeciesListItem {
  return {
    id: row.species_id,
    scientificName: row.scientific_name,
    commonName: row.common_name,
    taxonomy: row.taxonomy,
    conservationStatus: row.conservation_status,
    description: row.description,
    ecology: row.ecology,
    culturalSignificance: row.cultural_significance,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    photoUrl: row.species_photos?.[0]?.photo_url ?? null,
    photoCount: row.species_photos?.length ?? 0,
  };
}

function toDetail(row: {
  species_id: string;
  scientific_name: string;
  common_name: string | null;
  taxonomy: string | null;
  conservation_status: string | null;
  description: string | null;
  ecology: string | null;
  cultural_significance: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}): Omit<SpeciesListItem, "photoUrl" | "photoCount"> {
  return {
    id: row.species_id,
    scientificName: row.scientific_name,
    commonName: row.common_name,
    taxonomy: row.taxonomy,
    conservationStatus: row.conservation_status,
    description: row.description,
    ecology: row.ecology,
    culturalSignificance: row.cultural_significance,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchSpecies(options?: {
  publishedOnly?: boolean;
}): Promise<SpeciesListItem[]> {
  if (!isSupabaseConfigured) {
    return options?.publishedOnly
      ? mockSpecies.filter((s) => s.isPublished)
      : mockSpecies;
  }

  const supabase = await createClient();

  let query = supabase
    .from("species")
    .select(
      `species_id, scientific_name, common_name, taxonomy, conservation_status, description, ecology, cultural_significance, is_published, created_at, updated_at,
       species_photos ( photo_url )`,
    )
    .order("scientific_name", { ascending: true });

  if (options?.publishedOnly) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;

  if (error || !data) return mockSpecies;
  return data.map(toListItem);
}

export async function fetchSpeciesById(id: string): Promise<SpeciesDetail | null> {
  if (!isSupabaseConfigured) {
    const base = mockSpecies.find((s) => s.id === id);
    return base ? { ...base, photos: [] } : null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("species")
    .select(
      "species_id, scientific_name, common_name, taxonomy, conservation_status, description, ecology, cultural_significance, is_published, created_at, updated_at",
    )
    .eq("species_id", id)
    .maybeSingle();

  if (error || !data) {
    const base = mockSpecies.find((s) => s.id === id);
    return base ? { ...base, photos: [] } : null;
  }

  const { data: photoRows, error: photoError } = await supabase
    .from("species_photos")
    .select("photo_id, photo_url, uploaded_at")
    .eq("species_id", id)
    .order("uploaded_at", { ascending: false });

  const photos =
    photoError || !photoRows
      ? []
      : photoRows.map((photo) => ({
          photoId: photo.photo_id,
          photoUrl: photo.photo_url,
          uploadedAt: photo.uploaded_at,
        }));

  return {
    ...toDetail(data),
    photoUrl: photos[0]?.photoUrl ?? null,
    photoCount: photos.length,
    photos,
  };
}