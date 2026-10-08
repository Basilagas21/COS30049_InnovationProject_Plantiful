import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type ReportListItem = {
  id: string;
  reportType: string | null;
  dataRange: string | null;
  fileUrl: string | null;
  isPublished: boolean;
  createdAt: string;
};

export type ReportsResult = {
  reports: ReportListItem[];
  error: string | null;
};

export type { ReportType } from "@/lib/report-types";
export { REPORT_TYPES } from "@/lib/report-types";

const REPORTS_BUCKET = "reports";
const DOWNLOAD_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

function toListItem(row: {
  report_id: string;
  report_type: string | null;
  data_range: string | null;
  file_url: string | null;
  is_published: boolean;
  created_at: string;
}): ReportListItem {
  return {
    id: row.report_id,
    reportType: row.report_type,
    dataRange: row.data_range,
    fileUrl: row.file_url,
    isPublished: row.is_published,
    createdAt: row.created_at,
  };
}

function storagePathOf(fileUrl: string): string | null {
  if (!fileUrl.startsWith("http")) return fileUrl;
  const match = fileUrl.match(/\/object\/(?:public|sign)\/reports\/([^?]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function resolveFileUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fileUrl: string | null,
): Promise<string | null> {
  if (!fileUrl) return null;
  const path = storagePathOf(fileUrl);
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(REPORTS_BUCKET)
    .createSignedUrl(path, DOWNLOAD_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    console.error(`resolveFileUrl failed for ${path}: ${error?.message ?? "no signed url"}`);
    return null;
  }
  return data.signedUrl;
}

export async function fetchReports(): Promise<ReportsResult> {
  if (!isSupabaseConfigured) {
    return {
      reports: [],
      error: "Supabase is not configured, so reports cannot be loaded.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("report_id, report_type, data_range, file_url, is_published, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    const message = error?.message ?? "The reports query returned no data.";
    console.error(`fetchReports failed: ${message}`);
    return { reports: [], error: message };
  }

  const reports = await Promise.all(
    data.map(async (row) => ({
      ...toListItem(row),
      fileUrl: await resolveFileUrl(supabase, row.file_url),
    })),
  );

  return { reports, error: null };
}