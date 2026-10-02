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
  const { error } = await supabase
    .from("plant_records")
    .update({ approval_status: decision })
    .eq("record_id", recordId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/records");
  revalidatePath(`/records/${recordId}`);
  return { ok: true };
}