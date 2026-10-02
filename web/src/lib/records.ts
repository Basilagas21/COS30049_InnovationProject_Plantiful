import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type RecordListItem = {
  id: string;
  qrCode: string | null;
  scientificName: string;
  commonName: string | null;
  conservationStatus: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
  heightCm: number | null;
  approvalStatus: "pending" | "approved" | "rejected";
  status: "draft" | "submitted";
  isPublished: boolean;
  createdAt: string;
};

export type RecordDetail = RecordListItem & {
  taxonomy: string | null;
  description: string | null;
  reviewedAt: string | null;
  syncedAt: string | null;
  deviceId: string | null;
};

const mockRecords: RecordDetail[] = [
  {
    id: "R-0001",
    qrCode: "PLT-0001",
    scientificName: "Nepenthes lowii",
    commonName: "Low's pitcher plant",
    taxonomy: "Caryophyllales · Nepenthaceae",
    conservationStatus: "Endangered",
    description:
      "Mature pitcher with upper and lower pitchers present. Pitcher rim in good condition; fruit set observed nearby. Light gaps moderate along the trail edge.",
    gpsLat: 3.9983,
    gpsLng: 113.7822,
    heightCm: 18,
    approvalStatus: "approved",
    status: "submitted",
    isPublished: true,
    createdAt: "2026-09-28T09:41:00Z",
    reviewedAt: "2026-09-28T10:02:00Z",
    syncedAt: "2026-09-28T10:05:00Z",
    deviceId: "plantiful-bot-01",
  },
  {
    id: "R-0002",
    qrCode: "PLT-0002",
    scientificName: "Rafflesia tuan-mudae",
    commonName: "Tuan Muda's rafflesia",
    taxonomy: "Malpighiales · Rafflesiaceae",
    conservationStatus: "Endangered",
    description: null,
    gpsLat: 3.9941,
    gpsLng: 113.7887,
    heightCm: 0.4,
    approvalStatus: "approved",
    status: "submitted",
    isPublished: true,
    createdAt: "2026-09-25T14:12:00Z",
    reviewedAt: "2026-09-26T09:30:00Z",
    syncedAt: "2026-09-25T14:20:00Z",
    deviceId: "plantiful-bot-01",
  },
  {
    id: "R-0003",
    qrCode: "PLT-0003",
    scientificName: "Dipterocarpus grandiflorus",
    commonName: "Keruing",
    taxonomy: "Malvales · Dipterocarpaceae",
    conservationStatus: "Vulnerable",
    description: null,
    gpsLat: 3.9907,
    gpsLng: 113.7899,
    heightCm: 3120,
    approvalStatus: "pending",
    status: "submitted",
    isPublished: false,
    createdAt: "2026-09-22T08:05:00Z",
    reviewedAt: null,
    syncedAt: "2026-09-22T08:11:00Z",
    deviceId: "plantiful-bot-02",
  },
  {
    id: "R-0004",
    qrCode: "PLT-0004",
    scientificName: "Calanthe triplicata",
    commonName: "Christmas orchid",
    taxonomy: "Asparagales · Orchidaceae",
    conservationStatus: null,
    description: null,
    gpsLat: 3.9829,
    gpsLng: 113.7745,
    heightCm: 85,
    approvalStatus: "approved",
    status: "submitted",
    isPublished: true,
    createdAt: "2026-09-18T16:22:00Z",
    reviewedAt: "2026-09-19T08:00:00Z",
    syncedAt: "2026-09-18T16:30:00Z",
    deviceId: "plantiful-bot-01",
  },
  {
    id: "R-0005",
    qrCode: "PLT-0005",
    scientificName: "Begonia sarawakensis",
    commonName: "Begonia",
    taxonomy: "Cucurbitales · Begoniaceae",
    conservationStatus: null,
    description: null,
    gpsLat: 3.9955,
    gpsLng: 113.779,
    heightCm: 42,
    approvalStatus: "pending",
    status: "draft",
    isPublished: false,
    createdAt: "2026-09-15T10:48:00Z",
    reviewedAt: null,
    syncedAt: null,
    deviceId: "plantiful-bot-02",
  },
  {
    id: "R-0006",
    qrCode: "PLT-0006",
    scientificName: "Eugenia palembanica",
    commonName: "Keruntun tree",
    taxonomy: "Myrtales · Myrtaceae",
    conservationStatus: "Endangered",
    description: null,
    gpsLat: 3.9882,
    gpsLng: 113.7811,
    heightCm: 2400,
    approvalStatus: "rejected",
    status: "submitted",
    isPublished: false,
    createdAt: "2026-09-11T12:33:00Z",
    reviewedAt: "2026-09-12T08:45:00Z",
    syncedAt: "2026-09-11T12:40:00Z",
    deviceId: "plantiful-bot-02",
  },
];

function toListItem(row: {
  record_id: string;
  qr_code: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  height_cm: number | null;
  approval_status: "pending" | "approved" | "rejected";
  status: "draft" | "submitted";
  created_at: string;
  reviewed_at: string | null;
  synced_at: string | null;
  device_id: string | null;
  species: {
    species_id: string;
    scientific_name: string;
    common_name: string | null;
    taxonomy: string | null;
    conservation_status: string | null;
    description: string | null;
    is_published: boolean;
  } | null;
}): RecordDetail {
  return {
    id: row.record_id,
    qrCode: row.qr_code,
    scientificName: row.species?.scientific_name ?? "Unknown species",
    commonName: row.species?.common_name ?? null,
    taxonomy: row.species?.taxonomy ?? null,
    conservationStatus: row.species?.conservation_status ?? null,
    description: row.species?.description ?? null,
    gpsLat: row.gps_lat,
    gpsLng: row.gps_lng,
    heightCm: row.height_cm,
    approvalStatus: row.approval_status,
    status: row.status,
    isPublished: row.species?.is_published ?? false,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    syncedAt: row.synced_at,
    deviceId: row.device_id,
  };
}

export async function fetchRecords(): Promise<RecordDetail[]> {
  if (!isSupabaseConfigured) return mockRecords;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("plant_records")
    .select(
      `record_id, qr_code, gps_lat, gps_lng, height_cm, approval_status, status, created_at, reviewed_at, synced_at, device_id,
       species (
         species_id, scientific_name, common_name, taxonomy, conservation_status, description, is_published
       )`,
    )
    .order("created_at", { ascending: false });

  if (error || !data) return mockRecords;
  return data.map(toListItem);
}

export async function fetchRecordById(id: string): Promise<RecordDetail | null> {
  if (!isSupabaseConfigured) {
    return mockRecords.find((r) => r.id === id) ?? null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("plant_records")
    .select(
      `record_id, qr_code, gps_lat, gps_lng, height_cm, approval_status, status, created_at, reviewed_at, synced_at, device_id,
       species (
         species_id, scientific_name, common_name, taxonomy, conservation_status, description, is_published
       )`,
    )
    .eq("record_id", id)
    .maybeSingle();

  if (error || !data) {
    return mockRecords.find((r) => r.id === id) ?? null;
  }
  return toListItem(data);
}