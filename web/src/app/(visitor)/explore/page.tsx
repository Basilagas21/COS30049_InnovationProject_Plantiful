import Link from "next/link";
import { fetchSpecies } from "@/lib/species";
import {
  familyFromTaxonomy,
  isThreatenedStatus,
} from "@/lib/species-taxonomy";
import { visitorPlantQuestions } from "@/lib/plant-learning";
import { SpeciesBrowser } from "@/components/species-browser";
import { Arrow } from "@/components/arrow";

function formatUpdated(value: string | null): string {
  if (!value) return "Not yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet";

  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export default async function ExplorePage() {
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
    { label: "Published species", value: String(species.length) },
    { label: "Threatened", value: String(threatenedCount) },
    { label: "Plant families", value: String(familyCount) },
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
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <section className="explore-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage} alt="" className="explore-hero-img" />
        <div className="explore-hero-scrim" />

        <div className="explore-hero-grid">
          <div>
            <h1 className="explore-hero-title">
              Explore <span className="explore-accent">Niah&apos;s</span> plants
            </h1>
            <p className="explore-hero-lede">
              A public reference to the published species catalogue of Niah
              National Park. Search by scientific or common name, browse by
              family, and see how field observations are verified before
              publication.
            </p>
            <div className="explore-hero-actions">
              <a href="#catalogue" className="btn btn--primary">
                Browse the catalogue
              </a>
              <Link href="/map" className="btn btn--on-dark">
                Open the species map
              </Link>
            </div>
          </div>

          {featured ? (
            <Link href={`/species/${featured.id}`} className="explore-featured group">
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
              <span className="explore-featured-link">
                Read the species profile
                <Arrow direction="right" size="1em" />
              </span>
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
              <Link href="/map" className="explore-featured-link">
                Explore the map <Arrow direction="right" size="1em" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-pine/10 bg-white p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-moss">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-pine">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.step}
            className="rounded-2xl border border-pine/10 bg-white p-5"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sprout text-xs font-bold text-emerald">
              {step.step}
            </span>
            <h2 className="mt-4 font-semibold text-pine">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-moss">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-3xl border border-pine/10 bg-sprout/60 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow text-emerald">Visitor Q&amp;A</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-pine">
              Questions visitors often ask
            </h2>
          </div>
          <Link
            href="/learn"
            className="text-sm font-semibold text-emerald hover:underline"
          >
            Read the learning guide <Arrow direction="right" size="1em" />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {visitorPlantQuestions.slice(0, 4).map((item) => (
            <div key={item.question} className="rounded-2xl bg-white p-5">
              <h3 className="font-semibold text-pine">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-moss">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="catalogue" className="mt-12 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow text-emerald">Published catalogue</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-pine">
              Browse the plant guide
            </h2>
          </div>
          <Link
            href="/records"
            className="text-sm font-semibold text-emerald hover:underline"
          >
            Explore verified observations <Arrow direction="right" size="1em" />
          </Link>
        </div>

        <SpeciesBrowser species={species} officer={false} visitor />
      </section>
    </div>
  );
}
