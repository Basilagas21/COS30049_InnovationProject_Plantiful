import type { Metadata } from "next";
import Link from "next/link";
import { SpeciesExplorer } from "@/components/species-explorer";
import { PLANTIFUL_APP_URL } from "@/lib/config";
import { fetchPublicSpeciesData, CONSERVATION_STATUS_GLOSSARY } from "@/lib/species";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Species | Plantiful",
  description:
    "Browse Niah National Park's published, verified plant species, filterable by conservation status. No sign-in required.",
};

export default async function SpeciesPage() {
  const speciesResult = await fetchPublicSpeciesData();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <Link href="/" className="block text-sm font-medium text-emerald hover:underline">
        ← Back to home
      </Link>

      <p className="eyebrow mt-6 text-emerald">See the data for yourself</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pine">
        Explore verified plants
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-moss">
        Every plant below has been through SFC&apos;s review process and
        published to the public record. Filter by conservation status to see
        what&apos;s been found.
      </p>

      {speciesResult.state === "not_configured" && (
        <p className="mt-6 rounded-2xl border border-pine/10 bg-sand/60 p-5 text-sm text-moss">
          Live species data isn&apos;t connected in this environment. Once this
          site&apos;s{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          and{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          env vars are set to the real project, published species will appear
          here automatically. This isn&apos;t placeholder or fake data:
          it&apos;s the real catalogue, read-only.
        </p>
      )}

      {speciesResult.state === "error" && (
        <p className="mt-6 rounded-2xl border border-danger/20 bg-danger/5 p-5 text-sm text-danger">
          We couldn&apos;t load species data just now ({speciesResult.message}).
          This is a connection problem, not an empty catalogue. Please
          try again shortly.
        </p>
      )}

      {speciesResult.state === "ok" && (
        <>
          <p className="mt-4 text-sm font-semibold text-pine">
            {speciesResult.species.length} published species
            {speciesResult.verifiedObservationCount !== null && (
              <> · {speciesResult.verifiedObservationCount} verified field observations</>
            )}
          </p>

          {speciesResult.species.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-pine/10 bg-white p-5 text-sm text-moss">
              No published species yet. Field botanists are still
              surveying and submitting records for review. Check back soon.
            </p>
          ) : (
            <SpeciesExplorer species={speciesResult.species} />
          )}
        </>
      )}

      <Reveal>
        <details className="group mt-8 rounded-2xl border border-pine/10 bg-white p-5">
          <summary className="cursor-pointer list-none font-semibold text-pine [&::-webkit-details-marker]:hidden">
            What do conservation status labels mean?
          </summary>
          <p className="mt-3 text-sm leading-6 text-moss">
            Standard IUCN Red List categories, from most to least at-risk.
            Plantiful&apos;s own status field reflects what SFC&apos;s botanists have
            recorded for a species and may not always match a full, current
            official Red List assessment.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {CONSERVATION_STATUS_GLOSSARY.map((entry) => (
              <div key={entry.code} className="rounded-xl bg-sand/60 p-3">
                <dt className="text-sm font-semibold text-pine">{entry.name}</dt>
                <dd className="mt-1 text-xs leading-5 text-moss">{entry.summary}</dd>
              </div>
            ))}
          </dl>
        </details>
      </Reveal>

      <p className="mt-8 text-sm text-moss">
        Looking for more, like search, the interactive map, or logging in as
        a botanist?{" "}
        <a href={PLANTIFUL_APP_URL} className="font-semibold text-emerald hover:underline">
          Open the full knowledge system ↗
        </a>
      </p>
    </div>
  );
}
