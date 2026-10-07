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

const mockReports: ReportListItem[] = [
  {
    id: "RP-0001",
    reportType: "observations",
    dataRange: "2026-09-01..2026-09-30",
    fileUrl: null,
    isPublished: true,
    createdAt: "2026-10-01T08:00:00Z",
  },
  {
    id: "RP-0002",
    reportType: "species-catalogue",
    dataRange: "all",
    fileUrl: null,
    isPublished: false,
    createdAt: "2026-09-20T14:30:00Z",
  },
];

export type { ReportType } from "@/lib/report-types";
export { REPORT_TYPES } from "@/lib/report-types";

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

export async function fetchReports(): Promise<ReportListItem[]> {
  if (!isSupabaseConfigured) return mockReports;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("report_id, report_type, data_range, file_url, is_published, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return mockReports;
  return data.map(toListItem);
}