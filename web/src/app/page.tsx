import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="forest-hero">
        <div className="hero-leaves" aria-hidden="true" />
        <div className="relative z-1 max-w-3xl">
          <p className="eyebrow text-sprout">Niah National Park · Sarawak</p>
          <h1 className="hero-title">Every plant.<br />A story worth<br /><span>preserving.</span></h1>
          <p className="mt-6 max-w-md text-base leading-7 text-cream/80">From a discovery on the forest floor to a shared understanding of our biodiversity. Explore the living world with Plantiful.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/explore" className="rounded-full bg-chartreuse px-7 py-4 font-semibold text-pine transition hover:bg-sprout">Explore the plant guide ↗</Link>
            <Link href="/map" className="rounded-full border border-cream/35 px-7 py-4 font-medium text-cream transition hover:bg-white/10">Open the species map</Link>
          </div>
        </div>
        <div className="hero-caption"><span className="h-2 w-2 rounded-full bg-chartreuse" /> Rooted in discovery. Growing through knowledge.</div>
      </section>
      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div><p className="eyebrow text-emerald">A connected conservation journey</p><h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">For the forest.<br />For the future.</h2></div>
          <p className="max-w-sm text-sm leading-7 text-moss">Field observations, carefully reviewed knowledge, and environmental insights — all in one place.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { number: "01", title: "Discover", description: "Get to know the plants of Niah through the published species catalogue.", href: "/explore", label: "Browse the guide", image: "rafflesia.jpg", position: "50% 25%" },
            { number: "02", title: "Connect", description: "See where approved plant observations connect across the landscape.", href: "/map", label: "Explore the map", image: "hornbill.jpeg", position: "70% 15%" },
            { number: "03", title: "Conserve", description: "Sign in to review field records and contribute to a growing body of knowledge.", href: "/signin", label: "Join the workspace", image: "orangutan.jpeg", position: "50% 20%" },
          ].map((item) => {
            return (
              <Link key={item.number} href={item.href} className="nature-card group">
                <Image src={`/images/home/${item.image}`} alt="" fill sizes="(min-width: 1152px) 352px, (min-width: 768px) 33vw, 100vw" className="nature-card-photo" style={{ objectPosition: item.position }} />
                <div aria-hidden="true" className="nature-card-shade" />
                <span className="nature-card-number">{item.number} / Plantiful</span>
                <div className="nature-card-glass">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="nature-card-action">{item.label}<span aria-hidden="true">↗</span></div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
