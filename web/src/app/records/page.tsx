export default function RecordsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <main className="w-full max-w-3xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Plant records</h1>
        <p className="mt-4 text-lg leading-8 text-zinc-600">
          Coming soon. Records synced from the mobile field app will be listed
          and searchable here.
        </p>
        <a
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 px-6 font-medium transition-colors hover:bg-zinc-50"
          href="/"
        >
          Back to home
        </a>
      </main>
    </div>
  );
}