import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full bg-sprout px-3 py-1 text-sm font-semibold text-emerald">
              Niah National Park, Sarawak
            </span>
            <h1 className="mt-6 text-5xl font-bold tracking-tight text-pine sm:text-6xl">
              Bring the forest into focus
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-moss">
              Plantiful is the knowledge system for the Sarawak Forestry
              Corporation. Botanists capture plant sightings in the field, and
              conservation officers review, approve, and publish them for the
              public to explore.
            </p>
            <div className="mt-9 flex flex-col gap-4 text-base font-medium sm:flex-row">
              <Link
                href="/explore"
                className="flex h-12 items-center justify-center rounded-full bg-emerald px-8 text-cream transition-colors hover:bg-pine"
              >
                Explore the plant guide
              </Link>
              <Link
                href="/map"
                className="flex h-12 items-center justify-center rounded-full border border-pine/20 px-8 transition-colors hover:bg-sprout"
              >
                View the species map
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { value: "5s", label: "Offline record lookup" },
                { value: "100%", label: "Approved before publish" },
                { value: "IoT", label: "Threat alert dashboard" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white px-4 py-4 shadow-sm">
                  <p className="text-xl font-bold text-emerald">{stat.value}</p>
                  <p className="mt-1 text-xs text-moss">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-sprout to-cream p-4 shadow-md">
              <Image
                src="/plantiful_logo.jpg"
                alt="Plantiful logo"
                width={858}
                height={620}
                className="aspect-[858/620] w-full rounded-2xl object-cover"
              />
            </div>
            <div className="absolute left-4 top-10 rounded-2xl bg-white/90 p-3 shadow-md backdrop-blur">
              <p className="text-xs text-moss">Identity</p>
              <p className="text-sm font-semibold text-pine">Confirmed</p>
            </div>
            <div className="absolute bottom-10 right-4 rounded-2xl bg-white/90 p-3 shadow-md backdrop-blur">
              <p className="text-xs text-moss">GPS fix</p>
              <p className="text-sm font-semibold text-pine">±4 m</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sand py-12">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: "1,500+", label: "Species catalogued" },
              { value: "12,000+", label: "Field records synced" },
              { value: "4.9/5", label: "Officer workflow rating" },
              { value: "24/7", label: "Sensor monitoring" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-emerald">{stat.value}</p>
                <p className="mt-1 text-sm text-moss">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}