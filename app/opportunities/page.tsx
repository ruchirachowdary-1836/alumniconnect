import { getAdminAccess } from "@/lib/admin-auth";
import { getCurrentProfile } from "@/lib/auth";
import { resolveChatProfile } from "@/lib/chat-service";
import { OpportunitiesBoard } from "@/components/opportunities-board";
import { getOpportunities } from "@/lib/opportunities-data";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  let profile = null;

  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null;
  }
  if (!profile) {
    profile = await resolveChatProfile();
  }

  const adminAccess = await getAdminAccess();
  const params = (await searchParams) ?? {};
  const referred = (Array.isArray(params.referred) ? params.referred[0] : params.referred) === "1";
  const signInHint = (Array.isArray(params.signin) ? params.signin[0] : params.signin) === "1";

  const opportunities = await getOpportunities();
  const canPost = profile?.role === "ALUMNI" || adminAccess.isAdmin;
  const canRequestReferral = profile?.role === "STUDENT";

  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">Opportunities</h1>
          <p className="page-lead">Jobs, internships, and referral paths shared through the alumni network.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell">
          {referred ? (
            <div className="comment-box" style={{ marginBottom: 18 }}>
              <strong>Referral request sent.</strong>
              <p className="small muted" style={{ marginTop: 8 }}>
                The alumni poster can now review this referral request from the alumni dashboard.
              </p>
            </div>
          ) : null}

          {signInHint ? (
            <div className="comment-box" style={{ marginBottom: 18 }}>
              <strong>Student email is required.</strong>
              <p className="small muted" style={{ marginTop: 8 }}>
                Sign in with your student account before requesting a referral.
              </p>
            </div>
          ) : null}

          <OpportunitiesBoard
            initialOpportunities={opportunities}
            canPost={canPost}
            canRequestReferral={canRequestReferral}
          />
        </div>
      </section>
    </>
  );
}
