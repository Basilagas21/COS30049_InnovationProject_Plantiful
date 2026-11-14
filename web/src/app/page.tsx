import { fetchSpecies } from "@/lib/species";
import { fetchRecords } from "@/lib/records";
import { HomeContent } from "@/components/home/home-content";

export default async function Home() {
  const [species, recordsResult] = await Promise.all([
    fetchSpecies({ publishedOnly: true }),
    fetchRecords(),
  ]);
  const records = recordsResult.usingSampleData
    ? []
    : recordsResult.records.filter(
        (r) => r.approvalStatus === "approved" && r.status === "submitted",
      );
  return <HomeContent records={records} speciesCount={species.length} />;
}
