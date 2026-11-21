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

export type InquiriesResult = {
  inquiries: Inquiry[];
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
export async function fetchInquiries(): Promise<InquiriesResult> {
  if (!isSupabaseConfigured) {
    return {
      inquiries: [],
      error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("inquiry_id, name, email, subject, message, status, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return {
      inquiries: [],
      error: error?.message || "Could not reach Supabase.",
    };
  }

  return {
    inquiries: data.map((row) => ({
      id: row.inquiry_id,
      name: row.name,
      email: row.email,
      subject: row.subject,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
    })),
    error: null,
  };
}
