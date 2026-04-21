import { redirect } from "next/navigation";

import { DashboardOverview } from "@/components/dashboard-overview";
import { getCurrentProfile, getSafeAuth } from "@/lib/auth";
import { isClerkConfigured, missingAuthMessage } from "@/lib/auth-config";

export default async function DashboardPage() {
  const { userId } = await getSafeAuth();

  if (!isClerkConfigured) {
    return (
      <>
        <section className="page-band">
          <div className="shell page-band-inner">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-lead">Authentication is required to personalize the alumni portal.</p>
          </div>
        </section>
        <section className="page-section">
          <div className="shell">
            <div className="empty-state">
              <strong>Authentication is not live yet.</strong>
              <p className="muted">{missingAuthMessage}</p>
            </div>
          </div>
        </section>
      </>
    );
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
