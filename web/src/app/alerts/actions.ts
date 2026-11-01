"use server";

import { createClient } from "@/lib/supabase/server";
import { isOfficer } from "@/lib/auth";
import { isUuid } from "@/lib/telemetry";

// Marks an open threat alert resolved (#31 / S2-09). Resolution is final; the
// database trigger guard_alert_resolution stamps resolved_by/resolved_at and
// rejects reopening or edits to any other column.
export async function resolveAlert(alertId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isUuid(alertId)) {
    return { ok: false, error: "Invalid alert." };
  }
  if (!(await isOfficer())) {
    return { ok: false, error: "Conservation officer or administrator access required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alerts")
    .update({ resolved: true })
    .eq("alert_id", alertId)
    .eq("resolved", false)
    .select("alert_id");

  if (error) {
    if (error.code === "42703" || error.code === "PGRST204") {
      return {
        ok: false,
        error: "Alert resolution is not set up yet: run backend/scripts/013_alert_resolution.sql in the Supabase SQL Editor.",
      };
    }
    return { ok: false, error: "Could not resolve the alert. Check your connection and retry." };
  }

  // RLS filters rows silently, so a blocked or already-resolved update returns no rows.
  if (!data || data.length === 0) {
    const { data: current } = await supabase
      .from("alerts")
      .select("resolved")
      .eq("alert_id", alertId)
      .maybeSingle();
    if (current?.resolved) {
      return { ok: false, error: "This alert has already been resolved." };
    }
    return { ok: false, error: "Alert not found or you don't have permission to resolve it." };
  }

  return { ok: true };
}
