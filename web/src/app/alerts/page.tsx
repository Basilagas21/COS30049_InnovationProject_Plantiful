import { redirect } from "next/navigation";
import { isOfficer } from "@/lib/auth";
import { MonitoringDashboard } from "@/components/monitoring-dashboard";

export default async function AlertsPage() {
  if (!(await isOfficer())) redirect("/records");
  return <MonitoringDashboard />;
}
