"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isOfficer } from "@/lib/auth";

export type SpeciesInput = {
  scientific_name: string;
  common_name?: string | null;
  taxonomy?: string | null;
  conservation_status?: string | null;
  description?: string | null;
  ecology?: string | null;
  cultural_significance?: string | null;
  is_published?: boolean;
};

export async function createSpecies(
  input: SpeciesInput,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  if (!(await isOfficer())) {
    return { ok: false, error: "Conservation officer access required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("species")
    .insert(input)
    .select("species_id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/species");
  return { ok: true, id: data.species_id };
}

export async function updateSpecies(
  speciesId: string,
  input: SpeciesInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isOfficer())) {
    return { ok: false, error: "Conservation officer access required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("species")
    .update(input)
    .eq("species_id", speciesId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/species");
  revalidatePath(`/species/${speciesId}`);
  return { ok: true };
}

export async function deleteSpecies(
  speciesId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isOfficer())) {
    return { ok: false, error: "Conservation officer access required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("species")
    .delete()
    .eq("species_id", speciesId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/species");
  return { ok: true };
}