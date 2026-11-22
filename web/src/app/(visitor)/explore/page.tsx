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
              <h1 className="explore-v2-title">
                Explore <span className="explore-accent">Niah&apos;s</span> plants
              </h1>
              <p className="explore-v2-lede">
                A public reference to the published species catalogue of Niah
                National Park. Search by scientific or common name, browse by
                family, and see how field observations are verified before
                publication.
              </p>
              <div className="explore-v2-actions">
                <a href="#catalogue" className="home-btn">
                  Browse the catalogue
                  <Arrow className="home-arrow" />
                </a>
                <Link href="/map" className="home-btn home-btn--ghost">
                  Open the species map
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
                <span className="explore-featured-link">
                  Read the species profile
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

          <div className="explore-stats explore-v2-hero-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="explore-stat">
                <p className="explore-stat-label">{stat.label}</p>
                <p className="explore-stat-value">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="catalogue"
          className="explore-v2-catalogue scroll-mt-24"
        >
          <div className="explore-section-head explore-v2-catalogue-head">
            <h2 className="explore-section-title">Browse the plant guide</h2>
            <Link href="/records" className="explore-section-link">
              Explore verified observations <Arrow direction="right" size="1em" />
            </Link>
          </div>
          <SpeciesBrowser species={species} officer={false} visitor />
        </section>
      </div>

      <section className="explore-v2-secondary">
        <div className="explore-v2-secondary-inner">
          <div className="explore-v2-steps">
            <h2 className="explore-section-title">How a record becomes public</h2>
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

          <div className="explore-v2-qa">
            <div className="explore-section-head">
              <h2 className="explore-section-title">Questions visitors often ask</h2>
              <Link href="/learn" className="explore-section-link">
                Read the learning guide <Arrow direction="right" size="1em" />
              </Link>
            </div>
            <div className="explore-qa-grid">
              {visitorPlantQuestions.slice(0, 4).map((item) => (
                <div key={item.question} className="explore-qa-item">
                  <h3 className="explore-qa-q">{item.question}</h3>
                  <p className="explore-qa-a">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
