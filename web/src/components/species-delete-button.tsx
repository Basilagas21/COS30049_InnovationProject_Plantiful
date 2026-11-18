"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSpecies } from "@/app/species/actions";

type Props = {
  speciesId: string;
  speciesName: string;
};

export function SpeciesDeleteButton({ speciesId, speciesName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    const confirmed = confirm(`Delete ${speciesName}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteSpecies(speciesId);
      if (!result.ok) {
        setError(result.error ?? "Could not delete the species.");
        return;
      }
      router.push("/species");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        className="btn btn--danger"
      >
        {isPending ? "Deleting…" : "Delete species"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
