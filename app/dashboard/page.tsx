import { redirect } from "next/navigation";

import { DashboardOverview } from "@/components/dashboard-overview";
import { getCurrentProfile, getSafeAuth } from "@/lib/auth";
import { isClerkConfigured } from "@/lib/auth-config";

export default async function DashboardPage() {
  const { userId } = await getSafeAuth();

  if (!isClerkConfigured) {
    return <DashboardOverview />;
  }

  if (!userId) {
    return <DashboardOverview />;
  }

  let profile = null;

  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null;
  }

  if (!profile) {
    return <DashboardOverview />;
  }

  if (profile.role === "ALUMNI") {
    redirect("/alumni/dashboard");
  }

  redirect("/student/dashboard");
}
