"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isOfficer } from "@/lib/auth";

export type ApprovalDecision = "approved" | "rejected";

export async function setRecordApproval(
  recordId: string,
  decision: ApprovalDecision,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isOfficer())) {
    return { ok: false, error: "Conservation officer access required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("plant_records")
    .update({
      approval_status: decision,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("record_id", recordId)
    .select("record_id");

  if (error) {
    return { ok: false, error: error.message };
  }
  // RLS filters rows silently, so an update it blocks returns no error and no rows.
  if (!data || data.length === 0) {
    return { ok: false, error: "Record not found or you don't have permission to review it." };
  }

  revalidatePath("/records");
  revalidatePath(`/records/${recordId}`);
  return { ok: true };
}