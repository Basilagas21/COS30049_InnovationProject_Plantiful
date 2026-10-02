export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <main className="w-full max-w-3xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Hello Plantiful
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600">
          Web Knowledge System for the Plantiful rapid biodiversity
          assessment project. Field data captured on mobile devices can be
          shared, searched, and mapped here.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-900 px-6 text-zinc-50 transition-colors hover:bg-zinc-700 sm:w-auto"
            href="/records"
          >
            View records
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-zinc-300 px-6 transition-colors hover:bg-zinc-50 sm:w-auto"
            href="/map"
          >
            View map
          </a>
        </div>
      </main>
    </div>
  );
}