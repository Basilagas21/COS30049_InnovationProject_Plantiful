export default function MapPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-pine sm:text-4xl">
        Species map
      </h1>
      <p className="mt-2 text-moss">
        Field observations plotted by GPS coordinate
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-pine/10 bg-sprout/50">
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(pine_1px,transparent_1px),linear-gradient(90deg,pine_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="absolute left-6 top-6 rounded-2xl bg-white/90 px-4 py-3 shadow-md backdrop-blur">
            <p className="text-xs text-moss">Trail segments</p>
            <p className="text-sm font-semibold text-pine">
              Subis · Madu · Great Cave
            </p>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-pine/10 bg-white p-5">
            <h2 className="font-semibold text-pine">Observation summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-moss">Total records</dt>
                <dd className="font-semibold text-pine">1,286</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-moss">Species</dt>
                <dd className="font-semibold text-pine">214</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-moss">Trails active</dt>
                <dd className="font-semibold text-pine">6</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl bg-emerald p-5 text-cream">
            <h2 className="font-semibold">Map integration</h2>
            <p className="mt-2 text-sm leading-6 text-cream/80">
              A live interactive map will render here once geographic data is
              synchronised from the field app.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}