import { fetchRecords } from "@/lib/records";
import { HomeContent } from "@/components/home/home-content";

export default async function Home() {
  const recordsResult = await fetchRecords();
  const records = recordsResult.usingSampleData
    ? []
    : recordsResult.records.filter(
        (r) => r.approvalStatus === "approved" && r.status === "submitted",
      );
  return <HomeContent records={records} />;
}
