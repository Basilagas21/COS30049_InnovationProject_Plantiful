import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/auth";
import { AlertNotifications } from "@/components/alert-notifications";

export default async function AlertsPage() {
  const role = await getCurrentRole();
  if (!role) redirect("/signin");
  if (role !== "conservation_officer" && role !== "admin") redirect("/records");
  return <AlertNotifications />;
}
