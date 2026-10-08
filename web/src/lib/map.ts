import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  commonName: string | null;
  conservationStatus: string | null;
  heightCm: number | null;
  createdAt: string;
  photoUrl: string | null;
};

const mockPoints: MapPoint[] = [
  {
    id: "R-0001",
    lat: 3.9983,
    lng: 113.7822,
    label: "Nepenthes lowii",
    commonName: "Low's pitcher plant",
    conservationStatus: "Endangered",
    heightCm: 18,
    createdAt: "2026-09-28T09:41:00Z",
    photoUrl: null,
  },
  {
    id: "R-0002",
    lat: 3.9941,
    lng: 113.7887,
    label: "Rafflesia tuan-mudae",
    commonName: "Tuan Muda's rafflesia",
    conservationStatus: "Endangered",
    heightCm: 0.4,
    createdAt: "2026-09-25T14:12:00Z",
    photoUrl: null,
  },
  {
    id: "R-0003",
    lat: 3.9907,
    lng: 113.7899,
    label: "Dipterocarpus grandiflorus",
    commonName: "Keruing",
    conservationStatus: "Vulnerable",
    heightCm: 3120,
    createdAt: "2026-09-22T08:05:00Z",
    photoUrl: null,
  },
  {
    id: "R-0004",
    lat: 3.9829,
    lng: 113.7745,
    label: "Calanthe triplicata",
    commonName: "Christmas orchid",
    conservationStatus: null,
    heightCm: 85,
    createdAt: "2026-09-18T16:22:00Z",
    photoUrl: null,
  },
  {
    id: "R-0006",
    lat: 3.9882,
    lng: 113.7811,
    label: "Eugenia palembanica",
    commonName: "Keruntun tree",
    conservationStatus: "Endangered",
    heightCm: 2400,
    createdAt: "2026-09-11T12:33:00Z",
    photoUrl: null,
  },
];

function toPoint(row: {
  record_id: string;
  species_id: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  height_cm: number | null;
  created_at: string;
}): { id: string; speciesId: string | null; lat: number; lng: number } | null {
  if (row.gps_lat == null || row.gps_lng == null) return null;
  return {
    id: row.record_id,
    speciesId: row.species_id,
    lat: row.gps_lat,
    lng: row.gps_lng,
  };
}

export async function fetchMapPoints(speciesId?: string | null): Promise<MapPoint[]> {
  if (!isSupabaseConfigured) return mockPoints;

  const supabase = await createClient();

  let query = supabase
    .from("plant_records")
    .select("record_id, species_id, gps_lat, gps_lng, height_cm, created_at")
    .not("gps_lat", "is", null)
    .not("gps_lng", "is", null)
    .eq("approval_status", "approved")
    .eq("status", "submitted")
    .order("created_at", { ascending: false })
    .limit(500);

  if (speciesId) {
    query = query.eq("species_id", speciesId);
  }

  const { data, error } = await query;

  if (error || !data) return mockPoints;

  const points = data
    .map(toPoint)
    .filter((point): point is NonNullable<ReturnType<typeof toPoint>> => point !== null);
  if (points.length === 0) return [];

  const speciesIds = [
    ...new Set(points.map((p) => p.speciesId).filter((id): id is string => id !== null)),
  ];

  let speciesByName = new Map<string, { scientific_name: string; common_name: string | null; conservation_status: string | null }>();
  if (speciesIds.length > 0) {
    const { data: species, error: speciesError } = await supabase
      .from("species")
      .select("species_id, scientific_name, common_name, conservation_status")
      .in("species_id", speciesIds);

    if (!speciesError && species) {
      speciesByName = new Map(species.map((s) => [s.species_id, s]));
    }
  }

  const photoByRecord = new Map<string, string>();
  const { data: photoRows, error: photoError } = await supabase
    .from("plant_record_photos")
    .select("record_id, photo_url")
    .in("record_id", points.map((p) => p.id))
    .order("taken_at", { ascending: true });

  if (!photoError && photoRows) {
    for (const row of photoRows) {
      if (!photoByRecord.has(row.record_id)) {
        photoByRecord.set(row.record_id, row.photo_url);
      }
    }
  }

  return points.map((point) => {
    const species = point.speciesId ? speciesByName.get(point.speciesId) : undefined;
    return {
      id: point.id,
      lat: point.lat,
      lng: point.lng,
      label: species?.scientific_name ?? "Unknown species",
      commonName: species?.common_name ?? null,
      conservationStatus: species?.conservation_status ?? null,
      heightCm: data.find((r) => r.record_id === point.id)?.height_cm ?? null,
      createdAt: data.find((r) => r.record_id === point.id)?.created_at ?? "",
      photoUrl: photoByRecord.get(point.id) ?? null,
    };
  });
}