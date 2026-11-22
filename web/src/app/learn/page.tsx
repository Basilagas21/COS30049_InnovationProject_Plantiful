import type { Metadata } from "next";
import Link from "next/link";
import {
  conservationStatusGuide,
  visitorPlantQuestions,
} from "@/lib/plant-learning";
import { ParticleField } from "@/components/particle-field";
import { Reveal } from "@/components/reveal";
import { StickySpotlight } from "@/components/sticky-spotlight";

export const metadata: Metadata = {
  title: "Learn about Niah's plants | Plantiful",
  description:
    "Visitor questions about the plants of Niah National Park, scientific names, conservation status and field safety.",
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

export default function LearnPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#0c342c] text-[#fffdee]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/home/rafflesia.jpg"
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0c342c] via-[#0c342c]/95 to-[#0c342c]/55" />
        <ParticleField density="soft" />

        <div className="relative max-w-3xl p-8 sm:p-12">
          <span className="inline-flex rounded-full bg-[#e3ef26] px-3 py-1 text-sm font-semibold text-[#0c342c]">
            Visitor learning guide
          </span>
          <h1 className="heading-accent mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            Learn about Niah&apos;s plants
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#e2fbce]">
            Short answers to common visitor questions about plant names,
            conservation status, field safety and the published catalogue.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/explore"
              className="btn-glow rounded-full bg-[#e3ef26] px-6 py-3 text-sm font-semibold text-[#0c342c] transition-colors hover:bg-[#e2fbce]"
            >
              Explore the catalogue
            </Link>
            <Link
              href="/map"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-[#fffdee] transition-colors hover:bg-white/10"
            >
              Open the species map
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <p className="eyebrow-badge eyebrow-badge-emerald">Visitor Q&amp;A</p>
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
              className="group rounded-2xl border border-pine/10 bg-white p-5 open:bg-sprout/30"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-pine [&::-webkit-details-marker]:hidden">
                {item.question}
                <span aria-hidden="true" className="text-lg text-emerald">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-moss">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <p className="eyebrow-badge eyebrow-badge-chartreuse">Conservation status</p>
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
              <p className="mt-2 text-sm leading-6 text-moss">
                {entry.meaning}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="using-the-guide" className="mt-12 scroll-mt-24 rounded-3xl border border-pine/10 bg-sprout/60 p-6 sm:p-8">
        <div className="lg:hidden">
          <p className="eyebrow-badge eyebrow-badge-sprout">Using the guide</p>
          <h2 className="heading-accent mt-2 text-3xl font-semibold tracking-tight">
            How to read a species page
          </h2>
        </div>

        <div className="spotlight-desktop-wrap mt-6 hidden lg:block">
          <StickySpotlight
            facts={speciesPageTips}
            bgImage="/images/home/hornbill.jpeg"
            header={
              <>
                <p className="eyebrow-badge eyebrow-badge-sprout">Using the guide</p>
                <h2 className="heading-accent font-semibold tracking-tight">
                  How to read a species page
                </h2>
              </>
            }
          />
        </div>

        <div className="spotlight-mobile-wrap relative mt-6 overflow-hidden rounded-3xl p-4 lg:hidden">
          <ParticleField />
          <Reveal className="relative grid gap-4 reveal-stagger" spotlight>
            {speciesPageTips.map((tip, index) => (
              <div
                key={tip.title}
                data-active-card
                className="scroll-spotlight rounded-2xl bg-white p-5"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sprout text-xs font-bold text-emerald">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="heading-accent mt-4 font-semibold">{tip.title}</h3>
                <p className="mt-2 text-sm leading-6 text-moss">{tip.body}</p>
              </div>
            ))}
          </Reveal>
        </div>

        <Link
          href="/explore"
          className="mt-6 inline-flex text-sm font-semibold text-emerald hover:underline"
        >
          Browse published species →
        </Link>
      </section>
    </div>
  );
}
