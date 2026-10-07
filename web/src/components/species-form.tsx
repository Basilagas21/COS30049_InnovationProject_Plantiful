"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSpecies, updateSpecies, type SpeciesInput } from "@/app/species/actions";

type Props = {
  speciesId?: string;
  initial?: Partial<SpeciesInput>;
};

export function SpeciesForm({ speciesId, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    const input: SpeciesInput = {
      scientific_name: String(formData.get("scientific_name") ?? "").trim(),
      common_name: textOrNull(formData.get("common_name")),
      taxonomy: textOrNull(formData.get("taxonomy")),
      conservation_status: textOrNull(formData.get("conservation_status")),
      description: textOrNull(formData.get("description")),
      is_published: formData.get("is_published") === "on",
    };

    if (!input.scientific_name) {
      setError("Scientific name is required.");
      return;
    }

    startTransition(async () => {
      const result = speciesId
        ? await updateSpecies(speciesId, input)
        : await createSpecies(input);
      if (!result.ok) {
        setError(result.error ?? "Could not save species.");
        return;
      }
      router.push(speciesId ? `/species/${speciesId}` : "/species");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="mt-8 max-w-2xl rounded-3xl border border-pine/10 bg-white p-6">
      <Field label="Scientific name" required>
        <input
          name="scientific_name"
          defaultValue={initial?.scientific_name}
          placeholder="e.g. Nepenthes lowii"
          className="field-input"
        />
      </Field>

      <Field label="Common name">
        <input
          name="common_name"
          defaultValue={initial?.common_name ?? ""}
          placeholder="e.g. Low's pitcher plant"
          className="field-input"
        />
      </Field>

      <Field label="Taxonomy">
        <input
          name="taxonomy"
          defaultValue={initial?.taxonomy ?? ""}
          placeholder="e.g. Caryophyllales · Nepenthaceae"
          className="field-input"
        />
      </Field>

      <Field label="Conservation status">
        <select
          name="conservation_status"
          defaultValue={initial?.conservation_status ?? ""}
          className="field-input"
        >
          <option value="">Not assessed</option>
          <option>Data deficient</option>
          <option>Least concern</option>
          <option>Near threatened</option>
          <option>Vulnerable</option>
          <option>Endangered</option>
          <option>Critically endangered</option>
        </select>
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          defaultValue={initial?.description ?? ""}
          rows={5}
          placeholder="Botanical description, habitat, key identifying features…"
          className="field-input resize-y"
        />
      </Field>

      <label className="flex items-center gap-3 rounded-2xl bg-sprout/70 px-4 py-3 text-sm font-medium text-pine">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={Boolean(initial?.is_published)}
          className="h-4 w-4 accent-emerald"
        />
        Published — visible to the public
      </label>

      {error && <p className="mt-4 text-sm font-semibold text-danger">{error}</p>}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-emerald px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-pine disabled:opacity-50"
        >
          {isPending ? "Saving…" : speciesId ? "Save changes" : "Create species"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => router.back()}
          className="rounded-full border border-pine/20 px-6 py-2.5 text-sm font-semibold text-pine transition-colors hover:bg-sprout disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function textOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-5 block">
      <span className="mb-1.5 block text-sm font-semibold text-pine">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  );
}