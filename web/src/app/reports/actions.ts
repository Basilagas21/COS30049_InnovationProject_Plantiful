"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isOfficer } from "@/lib/auth";
import type { ReportType } from "@/lib/reports";

const REPORTS_BUCKET = "reports";

type ObservationRow = {
  record_id: string;
  qr_code: string | null;
  provisional_name: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  gps_accuracy_m: number | null;
  height_cm: number | null;
  morphology: string | null;
  notes: string | null;
  approval_status: string;
  status: string;
  created_at: string;
  species: { scientific_name: string; common_name: string | null } | null;
};

function toCsvRow(row: ObservationRow): (string | number | null | undefined)[] {
  return [
    row.record_id,
    row.qr_code,
    row.provisional_name,
    row.species?.scientific_name ?? row.provisional_name ?? "unknown",
    row.species?.common_name,
    row.gps_lat,
    row.gps_lng,
    row.gps_accuracy_m,
    row.height_cm,
    row.morphology,
    row.notes,
    row.approval_status,
    row.status,
    row.created_at,
  ];
}

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function buildCsv(section: string, rows: (string | number | null | undefined)[][], headers: string[]): string {
  const header = headers.map(csvCell).join(",");
  const body = rows.map((row) => row.map(csvCell).join(","));
  return `${header}\n${body.join("\n")}\n# ${section}\n`;
}

const RANGE_HINT =
  'Use "all", a number of days (e.g. 30), or a date range like 2026-09-01..2026-09-30.';

function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidDate(value: string): boolean {
  return isDateOnly(value) || !isNaN(Date.parse(value));
}

export async function generateReport(
  type: ReportType,
  dataRange: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isOfficer())) {
    return { ok: false, error: "Conservation officer access required." };
  }

  const supabase = await createClient();
  const range = dataRange.trim();

  let fileName: string;
  let content: string;

  if (type === "species-catalogue") {
    const { data: species, error } = await supabase
      .from("species")
      .select(
        "scientific_name, common_name, taxonomy, conservation_status, description, is_published",
      )
      .order("scientific_name", { ascending: true });

    if (error) return { ok: false, error: error.message };
    const rows = (species ?? []).map((s) => [
      s.scientific_name,
      s.common_name,
      s.taxonomy,
      s.conservation_status,
      s.description,
      s.is_published ? "published" : "unpublished",
    ]);
    content = buildCsv(
      "Species catalogue",
      rows,
      [
        "scientific_name",
        "common_name",
        "taxonomy",
        "conservation_status",
        "description",
        "is_published",
      ],
    );
    fileName = "species-catalogue.csv";
  } else if (type === "conservation-status") {
    const { data: species, error } = await supabase
      .from("species")
      .select("scientific_name, common_name, conservation_status, is_published")
      .order("conservation_status", { ascending: false })
      .order("scientific_name", { ascending: true });

    if (error) return { ok: false, error: error.message };
    const rows = (species ?? []).map((s) => [
      s.scientific_name,
      s.common_name,
      s.conservation_status ?? "not assessed",
      s.is_published ? "published" : "unpublished",
    ]);
    content = buildCsv(
      "Conservation status",
      rows,
      ["scientific_name", "common_name", "conservation_status", "is_published"],
    );
    fileName = "conservation-status.csv";
  } else {
    let recordsQuery = supabase
      .from("plant_records")
      .select(
        `record_id, qr_code, provisional_name, gps_lat, gps_lng, gps_accuracy_m, height_cm, morphology, notes, approval_status, status, created_at,
         species ( scientific_name, common_name )`,
      )
      .order("created_at", { ascending: false });

    if (range && range !== "all") {
      const parts = range.split("..").map((part) => part.trim());
      if (parts.length > 2 || parts.some((part) => part === "")) {
        return { ok: false, error: `Invalid data range. ${RANGE_HINT}` };
      }

      if (parts.length === 2) {
        const [start, end] = parts;
        if (!isValidDate(start) || !isValidDate(end)) {
          return { ok: false, error: `Invalid data range. ${RANGE_HINT}` };
        }
        const startIso = isDateOnly(start) ? `${start}T00:00:00.000Z` : start;
        const endIso = isDateOnly(end) ? `${end}T23:59:59.999Z` : end;
        if (Date.parse(startIso) > Date.parse(endIso)) {
          return { ok: false, error: "Data range start must be on or before its end." };
        }
        recordsQuery = recordsQuery.gte("created_at", startIso).lte("created_at", endIso);
      } else if (/^\d+$/.test(range)) {
        const days = Number(range);
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        recordsQuery = recordsQuery.gte("created_at", cutoff);
      } else if (isDateOnly(range)) {
        recordsQuery = recordsQuery.gte("created_at", `${range}T00:00:00.000Z`);
      } else if (isValidDate(range)) {
        recordsQuery = recordsQuery.gte("created_at", range);
      } else {
        return { ok: false, error: `Invalid data range. ${RANGE_HINT}` };
      }
    }

    const { data: records, error } = await recordsQuery;

    if (error) return { ok: false, error: error.message };
    const rows = (records ?? []).map(toCsvRow);
    content = buildCsv(
      "Field observations",
      rows,
      [
        "record_id",
        "qr_code",
        "provisional_name",
        "species",
        "common_name",
        "gps_lat",
        "gps_lng",
        "gps_accuracy_m",
        "height_cm",
        "morphology",
        "notes",
        "approval_status",
        "status",
        "created_at",
      ],
    );
    fileName = "observations.csv";
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to generate a report." };
  }

  const path = `${user.id}/${Date.now()}-${fileName}`;
  const { data: uploaded, error: uploadError } = await supabase.storage
    .from(REPORTS_BUCKET)
    .upload(path, new Blob([content], { type: "text/csv" }), {
      contentType: "text/csv",
      upsert: false,
    });

  if (uploadError || !uploaded) {
    return { ok: false, error: uploadError?.message ?? "Could not upload the report file." };
  }

  const storedRange = range || null;
  const { error: insertError } = await supabase.from("reports").insert({
    generated_by: user.id,
    report_type: type,
    data_range: storedRange,
    file_url: uploaded.path,
    is_published: false,
  });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  revalidatePath("/reports");
  return { ok: true };
}