import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type InquiryStatus = "new" | "read" | "archived";

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
};

export const INQUIRIES_PAGE_SIZE = 8;

export type InquiriesResult = {
  inquiries: Inquiry[];
  total: number;
  newCount: number;
  // Set when Supabase is configured but the query failed, or when it isn't
  // configured at all — either way, an empty list is never shown as if it
  // meant "no inquiries yet."
  error: string | null;
};

// Contact-form submissions from the standalone visitor-site's /inquiry
// page. That site writes these with the public anon key (INSERT-only, per
// backend/supabase/migrations/add_inquiries.sql); only conservation
// officers and admins can read them, which is enforced by RLS on the
// `inquiries` table, not by this function.
export async function fetchInquiries({
  page = 1,
  pageSize = INQUIRIES_PAGE_SIZE,
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<InquiriesResult> {
  if (!isSupabaseConfigured) {
    return {
      inquiries: [],
      total: 0,
      newCount: 0,
      error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const supabase = await createClient();
  const countResult = await supabase
    .from("inquiries")
    .select("inquiry_id", { count: "exact", head: true });

  if (countResult.error) {
    return {
      inquiries: [],
      total: 0,
      newCount: 0,
      error: countResult.error.message,
    };
  }

  const total = countResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = (safePage - 1) * pageSize;

  const [listResult, newResult] = await Promise.all([
    supabase
      .from("inquiries")
      .select("inquiry_id, name, email, subject, message, status, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1),
    supabase
      .from("inquiries")
      .select("inquiry_id", { count: "exact", head: true })
      .eq("status", "new"),
  ]);

  if (listResult.error || !listResult.data) {
    return {
      inquiries: [],
      total,
      newCount: 0,
      error: listResult.error?.message || "Could not reach Supabase.",
    };
  }

  if (newResult.error) {
    return {
      inquiries: [],
      total,
      newCount: 0,
      error: newResult.error.message,
    };
  }

  return {
    inquiries: listResult.data.map((row) => ({
      id: row.inquiry_id,
      name: row.name,
      email: row.email,
      subject: row.subject,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
    })),
    total,
    newCount: newResult.count ?? 0,
    error: null,
  };
}
