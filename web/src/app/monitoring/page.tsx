import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/auth";
import { MonitoringDashboard } from "@/components/monitoring-dashboard";

export default async function MonitoringPage() {
  const role = await getCurrentRole();
  if (!role) redirect("/signin");
  if (role !== "conservation_officer" && role !== "admin") redirect("/records");
  return <MonitoringDashboard />;
}
