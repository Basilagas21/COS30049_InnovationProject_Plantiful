import Link from "next/link";
import { fetchSpecies } from "@/lib/species";
import { isAuthenticated, isOfficer } from "@/lib/auth";
import { SpeciesBrowser } from "@/components/species-browser";

export default async function SpeciesPage() {
  const [species, officer, authenticated] = await Promise.all([
    fetchSpecies(),
    isOfficer(),
    isAuthenticated(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="heading-accent text-3xl font-bold tracking-tight sm:text-4xl">
            Species catalogue
          </h1>
          <p className="mt-2 text-moss">
            {!authenticated && species.length === 0
              ? "No published species yet. Published species will appear here once a conservation officer approves a linked observation."
              : `${species.length} plant species · taxonomy, conservation status and descriptions`}
          </p>
        </div>
        {officer ? (
          <Link
            href="/species/new"
            className="inline-flex h-11 items-center justify-center rounded-full bg-emerald px-6 text-sm font-semibold text-cream transition-colors hover:bg-pine"
          >
            New species
          </Link>
        ) : (
          null
        )}
      </div>

      <SpeciesBrowser species={species} officer={officer} visitor={!authenticated} />
    </div>
  );
}
