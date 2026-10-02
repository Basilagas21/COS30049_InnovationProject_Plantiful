import Link from "next/link";

type RecordCard = {
  id: string;
  species: string;
  scientific: string;
  location: string;
  date: string;
  approved: boolean;
  published: boolean;
  discount?: string;
};

const records: RecordCard[] = [
  {
    id: "R-0001",
    species: "Nepenthes lowii",
    scientific: "Low's pitcher plant",
    location: "Subis Trail",
    date: "2026-09-28",
    approved: true,
    published: true,
  },
  {
    id: "R-0002",
    species: "Rafflesia tuan-mudae",
    scientific: "Tuan Muda's rafflesia",
    location: "Bukit Kasut",
    date: "2026-09-25",
    approved: true,
    published: true,
    discount: "New",
  },
  {
    id: "R-0003",
    species: "Dipterocarpus grandiflorus",
    scientific: "Keruing",
    location: "Padi Trail",
    date: "2026-09-22",
    approved: false,
    published: false,
    discount: "Review",
  },
  {
    id: "R-0004",
    species: "Calanthe triplicata",
    scientific: "Christmas orchid",
    location: "Rumah Charles",
    date: "2026-09-18",
    approved: true,
    published: true,
  },
  {
    id: "R-0005",
    species: "Begonia sarawakensis",
    scientific: "Begonia",
    location: "Madu Cave",
    date: "2026-09-15",
    approved: true,
    published: false,
    discount: "Pending",
  },
  {
    id: "R-0006",
    species: "Eugenia palembanica",
    scientific: "Keruntun tree",
    location: "Great Cave",
    date: "2026-09-11",
    approved: false,
    published: false,
    discount: "Review",
  },
];

export default function RecordsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-pine sm:text-4xl">
            Plant records
          </h1>
          <p className="mt-2 text-moss">
            {records.length} field observations synced from the mobile app
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-sprout px-3 py-1 text-sm font-semibold text-emerald">
          Officer view
        </span>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search species…"
          className="h-10 w-full rounded-full border border-pine/15 bg-white px-4 text-sm outline-none transition-colors focus:border-emerald sm:w-64"
        />
        <select className="h-10 rounded-full border border-pine/15 bg-white px-4 text-sm outline-none focus:border-emerald">
          <option>All species</option>
          <option>Approved</option>
          <option>Pending</option>
          <option>Published</option>
        </select>
        <select className="h-10 rounded-full border border-pine/15 bg-white px-4 text-sm outline-none focus:border-emerald">
          <option>All trails</option>
          <option>Subis Trail</option>
          <option>Madu Cave</option>
          <option>Great Cave</option>
        </select>
        <select className="h-10 rounded-full border border-pine/15 bg-white px-4 text-sm outline-none focus:border-emerald">
          <option>Latest first</option>
          <option>Oldest first</option>
          <option>Name A-Z</option>
        </select>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {records.map((record) => (
          <Link
            key={record.id}
            href={`/records/${record.id}`}
            className="group overflow-hidden rounded-2xl border border-pine/10 bg-white transition-shadow hover:shadow-lg"
          >
            <div className="aspect-[4/3] w-full rounded-t-2xl bg-sprout/70 transition-colors group-hover:bg-sprout">
              {record.discount && (
                <span className="m-3 inline-block rounded-full bg-chartreuse px-3 py-1 text-xs font-bold text-pine">
                  {record.discount}
                </span>
              )}
            </div>
            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald">
                {record.scientific}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-pine">{record.species}</h3>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-moss">
                  {record.location} · {record.date}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    record.approved
                      ? record.published
                        ? "bg-sprout text-emerald"
                        : "bg-chartreuse/60 text-pine"
                      : "bg-sand text-moss"
                  }`}
                >
                  {record.published
                    ? "Published"
                    : record.approved
                      ? "Approved"
                      : "Pending"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}