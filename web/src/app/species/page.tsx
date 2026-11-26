import Link from "next/link";
import { fetchSpecies } from "@/lib/species";
import { getCurrentRole, isAuthenticated, isOfficer } from "@/lib/auth";
import { SpeciesBrowser } from "@/components/species-browser";

export default async function SpeciesPage() {
  const [officer, authenticated, role] = await Promise.all([
    isOfficer(),
    isAuthenticated(),
    getCurrentRole(),
  ]);
  const publicView = !authenticated || role === "visitor";
  const species = await fetchSpecies({ publishedOnly: publicView });

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
          {publicView && (
            <p className="mt-2 text-sm text-moss">
              Visitors can see published species only. Unpublished catalogue entries and pending observations stay private.
            </p>
          )}
        </div>
        {officer ? (
          <Link
            href="/species/new"
            className="btn btn--primary h-11"
          >
            New species
          </Link>
        ) : (
          null
        )}
      </div>

      <SpeciesBrowser species={species} officer={officer} visitor={publicView} />
    </div>
  );
}
