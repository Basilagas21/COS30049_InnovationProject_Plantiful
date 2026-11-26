import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/arrow";
import { SpeciesBrowser } from "@/components/species-browser";
import { fetchSpecies } from "@/lib/species";
import {
  conservationStatusGuide,
  visitorPlantQuestions,
} from "@/lib/plant-learning";
import {
  familyFromTaxonomy,
  isThreatenedStatus,
} from "@/lib/species-taxonomy";

export const metadata: Metadata = {
  title: "Discover Niah's plants | Plantiful",
  description:
    "Explore published plant species, visitor answers and conservation guidance for Niah National Park.",
};

const speciesPageTips = [
  {
    title: "Start with the name",
    body: "Check the scientific name, common name and plant family before reading the rest of the page.",
  },
  {
    title: "Check the status",
    body: "A conservation status is a quick signal, not the full story. Read the description and habitat notes too.",
  },
  {
    title: "Open the Q&A",
    body: "Species pages include short answers about the plant, its habitat and how visitors can help protect it.",
  },
];

function formatUpdated(value: string | null): string {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet";
  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export default async function DiscoverPage() {
  const species = await fetchSpecies({ publishedOnly: true });

  const threatenedCount = species.filter((entry) =>
    isThreatenedStatus(entry.conservationStatus),
  ).length;
  const familyCount = new Set(
    species
      .map((entry) => familyFromTaxonomy(entry.taxonomy))
      .filter((family): family is string => Boolean(family)),
  ).size;
  const lastUpdated = species.reduce<string | null>((latest, entry) => {
    if (!latest) return entry.updatedAt;
    return entry.updatedAt > latest ? entry.updatedAt : latest;
  }, null);

  const featured =
    species.find((entry) => entry.photoUrl) ??
    species.find((entry) =>
      entry.scientificName.toLowerCase().includes("rafflesia"),
    ) ??
    species[0] ??
    null;
  const heroImage = featured?.photoUrl ?? "/images/home/rafflesia.jpg";

  const stats = [
    { label: "Published species", value: String(species.length).padStart(2, "0") },
    { label: "Threatened", value: String(threatenedCount).padStart(2, "0") },
    { label: "Plant families", value: String(familyCount).padStart(2, "0") },
    { label: "Last updated", value: formatUpdated(lastUpdated) },
  ];

  const steps = [
    {
      step: "01",
      title: "Field capture",
      body: "Botanists record location, photos and plant traits while they are still in the forest.",
    },
    {
      step: "02",
      title: "Officer review",
      body: "A conservation officer checks the identification, evidence and record details before anything is published.",
    },
    {
      step: "03",
      title: "Public catalogue",
      body: "Approved observations linked to a published species become part of this public plant guide.",
    },
  ];

  return (
    <div className="explore-v2">
      <div className="explore-v2-screen">
        <section className="explore-v2-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt="" className="explore-v2-hero-img" />
          <div className="explore-v2-hero-scrim" />

          <div className="explore-v2-hero-grid">
            <div className="explore-v2-hero-left">
              <p className="eyebrow-badge eyebrow-badge-chartreuse">Discover</p>
              <h1 className="explore-v2-title">Explore Niah&apos;s plants</h1>
              <p className="explore-v2-lede">
                A public guide to the published species catalogue of Niah National Park.
                Search the catalogue, read visitor answers and learn how field records
                are verified before publication.
              </p>
              <div className="explore-v2-actions">
                <a href="#catalogue" className="home-btn">
                  Browse the catalogue
                  <Arrow className="home-arrow" />
                </a>
                <Link href="#questions" className="home-btn home-btn--ghost">
                  Read the visitor guide
                  <Arrow className="home-arrow" />
                </Link>
              </div>
            </div>

            {featured ? (
              <Link href={`/species/${featured.id}`} className="explore-featured group">
                <Arrow className="explore-featured-arrow" />
                <p className="explore-featured-eyebrow">Featured species</p>
                <h2 className="explore-featured-name">{featured.scientificName}</h2>
                <p className="explore-featured-common">
                  {featured.commonName ?? "Published species"}
                </p>
                {featured.conservationStatus && (
                  <span className="explore-featured-status">
                    {featured.conservationStatus}
                  </span>
                )}
                <p className="explore-featured-desc">
                  {featured.description ??
                    "A verified species record from the Niah National Park catalogue."}
                </p>
                <span className="explore-featured-link">Read the species profile</span>
              </Link>
            ) : (
              <div className="explore-featured">
                <p className="explore-featured-eyebrow">Catalogue in progress</p>
                <h2 className="explore-featured-name explore-featured-name--plain">
                  The first species are being verified
                </h2>
                <p className="explore-featured-desc">
                  Approved field observations will appear here once a conservation
                  officer publishes them.
                </p>
                <Link href="/records" className="explore-featured-link">
                  Explore verified observations <Arrow direction="right" size="1em" />
                </Link>
              </div>
            )}
          </div>

          <div className="explore-stats explore-v2-hero-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="explore-stat">
                <p className="explore-stat-label">{stat.label}</p>
                <p className="explore-stat-value">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="catalogue" className="explore-v2-catalogue">
          <div className="explore-section-head explore-v2-catalogue-head">
            <h2 className="explore-section-title heading-accent">Browse the plant guide</h2>
            <Link href="/species" className="explore-section-link">
              Open the species catalogue <Arrow direction="right" size="1em" />
            </Link>
          </div>
          <SpeciesBrowser species={species} officer={false} visitor />
        </section>
      </div>

      <section className="explore-v2-secondary">
        <div className="explore-v2-secondary-inner">
          <div className="explore-v2-steps">
            <h2 className="explore-section-title heading-accent">How a record becomes public</h2>
            <div className="explore-steps explore-v2-steps-row">
              {steps.map((step) => (
                <div key={step.step} className="explore-step">
                  <span className="explore-step-node">{step.step}</span>
                  <h3 className="explore-step-title">{step.title}</h3>
                  <p className="explore-step-body">{step.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="questions" className="mt-12 scroll-mt-24">
            <p className="eyebrow text-emerald">Visitor Q&amp;A</p>
            <h2 className="heading-accent mt-2 text-3xl font-semibold tracking-tight">
              Common questions
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-moss">
              These answers are for general learning. For park visits, follow the
              guidance of Niah National Park staff.
            </p>

            <div className="mt-6 grid gap-3 lg:grid-cols-2">
              {visitorPlantQuestions.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl border border-pine/10 bg-white p-5 transition-colors open:border-emerald/40 open:bg-sprout/30"
                >
                  <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-4 font-semibold text-pine sm:min-h-0 [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald transition-transform group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="m4 6 4 4 4-4" />
                    </svg>
                  </summary>
                  <p className="mt-3 border-t border-pine/10 pt-3 text-sm leading-7 text-moss">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <p className="eyebrow text-emerald">Conservation status</p>
            <h2 className="heading-accent mt-2 text-3xl font-semibold tracking-tight">
              What the labels mean
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-moss">
              Status labels can come from different assessment systems. Use them as
              a guide, not a final answer.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {conservationStatusGuide.map((entry) => (
                <div
                  key={entry.status}
                  className="rounded-2xl border border-pine/10 bg-white p-5"
                >
                  <h3 className="font-semibold text-pine">{entry.status}</h3>
                  <p className="mt-2 text-sm leading-6 text-moss">{entry.meaning}</p>
                </div>
              ))}
            </div>
          </div>

          <section className="mt-12 overflow-hidden rounded-[2rem] border border-pine/10 bg-white">
            <div className="border-b border-pine/10 bg-sprout/50 px-6 py-8 sm:px-10">
              <p className="eyebrow text-emerald">Using the guide</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-pine">
                How to read a species page
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-moss">
                Three quick checks help you understand what a species record tells
                you, and what still needs expert review.
              </p>
            </div>
            <div className="grid gap-4 p-6 sm:p-10 md:grid-cols-3">
              {speciesPageTips.map((tip, index) => (
                <article
                  key={tip.title}
                  className="rounded-2xl border border-pine/10 bg-cream/60 p-6 transition-colors hover:border-emerald/40 hover:bg-sprout/40"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald text-sm font-bold text-cream">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-pine">{tip.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-moss">{tip.body}</p>
                </article>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-pine/10 bg-sand/40 px-6 py-5 sm:px-10">
              <p className="text-sm text-moss">
                Each public species page is checked against a published record.
              </p>
              <Link
                href="/species"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald px-5 text-sm font-semibold text-cream hover:bg-pine sm:min-h-0"
              >
                Browse published species <Arrow direction="right" size="1em" />
              </Link>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
