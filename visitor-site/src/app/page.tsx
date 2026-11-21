import Link from "next/link";
import { PLANTIFUL_APP_URL } from "@/lib/config";
import { Reveal } from "@/components/reveal";

const sfcFacts = [
  {
    title: "A statutory body of the Sarawak Government",
    body: "Sarawak Forestry Corporation (SFC) was established under the Sarawak Forestry Corporation Ordinance, 1995, to manage the state's Totally Protected Areas.",
  },
  {
    title: "Guardians of the state's wild places",
    body: "SFC manages Sarawak's national parks, wildlife sanctuaries and nature reserves, and protects totally protected and protected species under the National Parks and Nature Reserves Ordinance 1998 and the Wild Life Protection Ordinance 1998.",
  },
  {
    title: "Conservation, education and eco-tourism",
    body: "Beyond park management, SFC runs biodiversity conservation work, public conservation education, and promotes and regulates nature-based and community-based eco-tourism across the state.",
  },
];

const faqs = [
  {
    question: "Do I need an account to use this site?",
    answer:
      "No. This whole site is open to everyone, with no sign-in. Plantiful's field data system, where botanists submit records and officers review them, is a separate application that volunteers and staff use once they've joined the project.",
  },
  {
    question: "How do I become a field botanist?",
    answer:
      "Send us an inquiry with a bit about your background and availability, and SFC's team will follow up about next steps, including how field accounts get set up.",
  },
  {
    question: "Where does my data go if I volunteer?",
    answer:
      "Observations captured in the field are reviewed by a conservation officer before anything is published. Approved records appear in Plantiful's public species catalogue and map.",
  },
  {
    question: "Is this the same website as the Plantiful field system?",
    answer:
      "No, this is a separate, public-facing site with no login. It's the front door for visitors, volunteers and researchers; the field data system is a different app used by registered botanists and conservation officers.",
  },
];

export default function Home() {
  return (
    <div id="top" className="mx-auto w-full max-w-6xl flex-1 scroll-mt-24 px-6 py-12">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#0c342c] text-[#fffdee]">
        {/* Three photos take turns fading in with a slow zoom (see
            .hero-photo in globals.css) instead of one static image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/hornbill.jpeg" alt="" className="hero-photo" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/rafflesia.jpg" alt="" className="hero-photo" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/orangutan.jpeg" alt="" className="hero-photo" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0c342c] via-[#0c342c]/95 to-[#0c342c]/55" />

        <div className="relative max-w-3xl p-8 sm:p-12">
          <span className="inline-flex rounded-full bg-[#e3ef26] px-3 py-1 text-sm font-semibold text-[#0c342c]">
            Welcome, visitor
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            A little closer to Niah National Park.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#e2fbce]">
            Plantiful supports Sarawak Forestry Corporation&apos;s biodiversity
            documentation work at Niah National Park, a UNESCO World
            Heritage Site since 2024 and home to the Niah Caves. This site is
            for everyone: no account, no sign-in, just information and a way
            to get involved.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/inquiry"
              className="rounded-full bg-[#e3ef26] px-6 py-3 text-sm font-semibold text-[#0c342c] transition-colors hover:bg-[#e2fbce]"
            >
              Send an inquiry
            </Link>
            <Link
              href="/species"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-[#fffdee] transition-colors hover:bg-white/10"
            >
              Browse the species catalogue →
            </Link>
          </div>
        </div>
      </section>

      <Reveal>
        <section id="about-sfc" className="mt-12 scroll-mt-24">
          <p className="eyebrow text-emerald">Who manages this park</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-pine">
            Sarawak Forestry Corporation (SFC)
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-moss">
            SFC is the state body responsible for Niah National Park and
            Sarawak&apos;s other protected areas.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {sfcFacts.map((fact) => (
              <div key={fact.title} className="rounded-2xl border border-pine/10 bg-white p-5">
                <h3 className="font-semibold text-pine">{fact.title}</h3>
                <p className="mt-2 text-sm leading-6 text-moss">{fact.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="why-plantiful" className="mt-12 scroll-mt-24 rounded-3xl border border-pine/10 bg-sprout/60 p-6 sm:p-8">
          <p className="eyebrow text-emerald">About Plantiful</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-pine">
            Ground-truthing, made simple for the field
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-moss">
            Plantiful is SFC&apos;s digital system for documenting the plant life of
            Niah National Park. Botanists working with SFC scan QR-tagged plants
            and record what they find: species, condition, and photos, even
            where there&apos;s no signal, syncing once they&apos;re back in range.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-moss">
            Nothing goes public straight away. A conservation officer reviews
            every submission before it&apos;s published, checking the species
            identification and details are correct. An IoT sensor network also
            keeps watch over monitored field sites around the clock. The result
            is a public, verified record of Niah&apos;s plant life, built up
            survey by survey, that researchers, students and curious
            visitors can all browse for free.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/species"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-pine transition-colors hover:bg-cream"
            >
              Open the full catalogue →
            </Link>
            <a
              href={PLANTIFUL_APP_URL}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-pine transition-colors hover:bg-cream"
            >
              Open the map ↗
            </a>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-pine/10 bg-white p-6 sm:p-8">
            <p className="eyebrow text-emerald">See the data for yourself</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-pine">
              Explore verified plants
            </h2>
            <p className="mt-3 text-sm leading-6 text-moss">
              Browse published species, filter by conservation status, and see
              what SFC&apos;s botanists have verified so far on its own page,
              with a live, read-only view of the real catalogue.
            </p>
            <Link
              href="/species"
              className="mt-4 inline-flex rounded-full bg-emerald px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-pine"
            >
              Browse species →
            </Link>
          </div>
          <div className="rounded-3xl border border-pine/10 bg-white p-6 sm:p-8">
            <p className="eyebrow text-emerald">Get in touch</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-pine">
              Send us an inquiry
            </h2>
            <p className="mt-3 text-sm leading-6 text-moss">
              Questions about the park, volunteering as a field botanist, a
              student placement, or a partnership: tell us what&apos;s on your
              mind and the Plantiful team will get back to you.
            </p>
            <Link
              href="/inquiry"
              className="mt-4 inline-flex rounded-full bg-emerald px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-pine"
            >
              Send an inquiry →
            </Link>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="visiting" className="mt-12 scroll-mt-24 rounded-3xl border border-pine/10 bg-white p-6 sm:p-8">
          <p className="eyebrow text-emerald">Planning a visit</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-pine">
            Visiting Niah National Park
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-moss">
            Niah National Park is best known for the Niah Caves and the
            archaeological and biodiversity significance that earned it UNESCO
            World Heritage status. Opening hours, entry permits, guide
            requirements and transport can change, so for up-to-date visiting
            details, including how to get there and what to bring, check
            directly with Sarawak Forestry Corporation&apos;s official visitor
            information before you go, rather than relying on this page alone.
          </p>
        </section>
      </Reveal>

      <Reveal>
        <section id="faq" className="mt-12 scroll-mt-24">
          <p className="eyebrow text-emerald">A few common questions</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-pine">
            Visiting &amp; contributing
          </h2>

          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {faqs.map((item) => (
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
      </Reveal>
    </div>
  );
}
