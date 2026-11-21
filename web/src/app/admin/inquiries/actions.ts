"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isOfficer } from "@/lib/auth";
import type { InquiryStatus } from "@/lib/inquiries";

export async function setInquiryStatus(
  inquiryId: string,
  status: InquiryStatus,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isOfficer())) {
    return { ok: false, error: "Conservation officer access required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .update({ status })
    .eq("inquiry_id", inquiryId)
    .select("inquiry_id");

  if (error) {
    return { ok: false, error: error.message };
  }
  // RLS filters rows silently, so an update it blocks returns no error and no rows.
  if (!data || data.length === 0) {
    return { ok: false, error: "Inquiry not found or you don't have permission to update it." };
  }

  revalidatePath("/admin/inquiries");
  return { ok: true };
}
