import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { fetchSpeciesById } from "@/lib/species";
import { isOfficer } from "@/lib/auth";
import { SpeciesForm } from "@/components/species-form";

export default async function EditSpeciesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await isOfficer())) redirect("/species");

  const entry = await fetchSpeciesById(id);
  if (!entry) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <Link href={`/species/${id}`} className="text-sm font-medium text-emerald hover:underline">
        ← Back to {entry.scientificName}
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-pine sm:text-4xl">
        Edit species
      </h1>
      <p className="mt-2 text-moss">
        Update taxonomy, conservation status, description, or publication state.
      </p>
      <SpeciesForm
        speciesId={id}
        initial={{
          scientific_name: entry.scientificName,
          common_name: entry.commonName,
          taxonomy: entry.taxonomy,
          conservation_status: entry.conservationStatus,
          description: entry.description,
          is_published: entry.isPublished,
        }}
      />
    </div>
  );
}