import type { Metadata } from "next";
import Link from "next/link";
import { PLANTIFUL_APP_URL } from "@/lib/config";
import { fetchPublicSpeciesData, CONSERVATION_STATUS_GLOSSARY } from "@/lib/species";
import { Reveal } from "@/components/reveal";
import { Counter } from "@/components/counter";

export const metadata: Metadata = {
  title: "Species | Plantiful",
  description:
    "A taste of Niah National Park's published, verified plant species. No sign-in required.",
};

// This page is deliberately a teaser, not a second catalogue. The full
// searchable, filterable, mapped catalogue already lives in the main
// Plantiful app (see PLANTIFUL_APP_URL below); re-implementing all of
// that here just to run it against the same species table was duplicated
// effort for a strictly weaker result. A handful of examples plus a clear
// link to the real thing is simpler to maintain and honest about what
// this standalone site is for.
const TEASER_COUNT = 6;

function statusBadgeClass(status: string | null): string {
  if (!status) return "bg-sand text-moss";
  const s = status.toLowerCase();
  if (s.includes("critically") || s.includes("endangered")) return "bg-danger/15 text-danger";
  if (s.includes("vulnerable")) return "bg-danger/10 text-danger";
  if (s.includes("least concern")) return "bg-sprout text-emerald";
  if (s.includes("near threatened")) return "bg-chartreuse/30 text-pine";
  return "bg-sand text-moss";
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export default async function SpeciesPage() {
  const speciesResult = await fetchPublicSpeciesData();

  return (
    <div className="page-fade-in mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <Link href="/" className="block text-sm font-medium text-emerald hover:underline">
        ← Back to home
      </Link>

      <p className="eyebrow mt-6 text-emerald">A taste of the catalogue</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pine">
        Verified plants of Niah
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-moss">
        Every plant here has been through SFC&apos;s review process and
        published to the public record. This page shows a few examples. The
        full searchable catalogue, with the interactive map, lives in
        Plantiful&apos;s knowledge system.
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
            <Counter value={speciesResult.species.length} /> published species
            {speciesResult.verifiedObservationCount !== null && (
              <>
                {" "}
                · <Counter value={speciesResult.verifiedObservationCount} /> verified field
                observations
              </>
            )}
          </p>

          {speciesResult.species.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-pine/10 bg-white p-5 text-sm text-moss">
              No published species yet. Field botanists are still
              surveying and submitting records for review. Check back soon.
            </p>
          ) : (
            <Reveal className="mt-6 flex flex-wrap justify-center gap-4 reveal-stagger">
              {speciesResult.species.slice(0, TEASER_COUNT).map((item) => (
                <Link
                  key={item.id}
                  href={`/plants/${item.id}`}
                  className="card-lift flex basis-full flex-col rounded-2xl border border-pine/10 bg-white p-5 transition-colors hover:border-emerald/40 sm:basis-[calc(50%_-_0.5rem)] lg:basis-[calc(33.3333%_-_0.6667rem)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-pine">
                      {item.commonName || item.scientificName}
                    </h3>
                    {item.conservationStatus && (
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(item.conservationStatus)}`}
                      >
                        {item.conservationStatus}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm italic text-moss">{item.scientificName}</p>
                  {item.description && (
                    <p className="mt-3 text-sm leading-6 text-moss">{truncate(item.description, 140)}</p>
                  )}
                  <span className="mt-auto pt-4 text-sm font-semibold text-emerald">View plant →</span>
                </Link>
              ))}
            </Reveal>
          )}
        </>
      )}

      <Reveal>
        <div className="mt-8 rounded-3xl border border-pine/10 bg-sprout/60 p-6 sm:p-8">
          <p className="eyebrow text-emerald">Want more?</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-pine">
            Search by name, filter by family, or see the map
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-moss">
            The full catalogue lives in Plantiful&apos;s knowledge system: every
            published species, searchable by scientific or common name, with
            an interactive map of field observations.
          </p>
          <a
            href={`${PLANTIFUL_APP_URL}/species`}
            className="btn-pop mt-5 inline-flex rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-pine"
          >
            Browse the full catalogue ↗
          </a>
        </div>
      </Reveal>

      <Reveal>
        <details className="group mt-8 rounded-2xl border border-pine/10 bg-white p-5 transition-colors duration-300 open:bg-sprout/30">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-pine [&::-webkit-details-marker]:hidden">
            What do conservation status labels mean?
            <span
              aria-hidden="true"
              className="text-lg text-emerald transition-transform duration-300 group-open:rotate-45"
            >
              +
            </span>
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
    </div>
  );
}
