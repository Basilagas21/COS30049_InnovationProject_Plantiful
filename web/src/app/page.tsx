import { fetchRecords } from "@/lib/records";
import { HomeContent } from "@/components/home/home-content";

export default function Home() {
  const recordsPromise = fetchRecords().then((result) =>
    result.usingSampleData
      ? []
      : result.records.filter(
          (r) => r.approvalStatus === "approved" && r.status === "submitted",
        ),
  );
  return <HomeContent recordsPromise={recordsPromise} />;
}