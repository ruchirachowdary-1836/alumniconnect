import { getAdminAccess } from "@/lib/admin-auth";
import { getCurrentProfile } from "@/lib/auth";
import { fallbackOpportunities } from "@/lib/demo-content";
import { readPortalOpportunities } from "@/lib/portal-store";

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

  const adminAccess = await getAdminAccess();
  const params = (await searchParams) ?? {};
  const posted = (Array.isArray(params.posted) ? params.posted[0] : params.posted) === "1";
  const referred = (Array.isArray(params.referred) ? params.referred[0] : params.referred) === "1";
  const signInHint = (Array.isArray(params.signin) ? params.signin[0] : params.signin) === "1";

  const liveOpportunities = await readPortalOpportunities();
  const opportunities = liveOpportunities.length > 0 ? liveOpportunities : fallbackOpportunities;
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
          {posted ? (
            <div className="comment-box" style={{ marginBottom: 18 }}>
              <strong>Opportunity posted.</strong>
              <p className="small muted" style={{ marginTop: 8 }}>
                The opportunity is now visible for students to explore and request referrals.
              </p>
            </div>
          ) : null}

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

          {canPost ? (
            <form action="/api/opportunities" method="post" className="dashboard-panel form-grid" style={{ marginBottom: 22 }}>
              <div className="section-header" style={{ marginBottom: 0 }}>
                <div>
                  <h3>Post a job or internship</h3>
                  <p className="card-copy">Alumni can share hiring openings, internships, and referral opportunities here.</p>
                </div>
              </div>
              <label>
                Title
                <input name="title" required placeholder="Example: Backend Engineer Intern" />
              </label>
              <label>
                Company
                <input name="company" required placeholder="Example: Microsoft" />
              </label>
              <label>
                Type
                <select name="type" defaultValue="Job">
                  <option>Job</option>
                  <option>Internship</option>
                </select>
              </label>
              <label>
                Location
                <input name="location" placeholder="Example: Hyderabad / Remote" />
              </label>
              <label>
                Apply link
                <input name="applyLink" placeholder="https://company.com/careers/..." />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  required
                  placeholder="Mention skills, eligibility, expected work, and how students should prepare."
                />
              </label>
              <button className="button button-primary" type="submit">
                Publish Opportunity
              </button>
            </form>
          ) : (
            <div className="dashboard-panel" style={{ marginBottom: 22 }}>
              <h3>Career board</h3>
              <p className="card-copy">
                Students can browse opportunities and request referrals. Alumni can post opportunities from their own portal.
              </p>
            </div>
          )}

          <div className="section-header">
            <div>
              <h2>Open Roles</h2>
              <p className="section-subtitle">Browse current alumni-shared job and internship opportunities.</p>
            </div>
            <span className="tab-pill active">{opportunities.length} listed</span>
          </div>

          <div className="request-grid" style={{ marginTop: 18 }}>
            {opportunities.map((opportunity) => (
              <article key={opportunity.id} className="request-card">
                <div className="section-header">
                  <div>
                    <h3>{opportunity.title}</h3>
                    <p className="card-copy">
                      {opportunity.company} • {opportunity.type} • {opportunity.location}
                    </p>
                  </div>
                  <span className="tab-pill active">{opportunity.status}</span>
                </div>

                <p>{opportunity.description}</p>
                <p className="small muted" style={{ marginTop: 10 }}>
                  Posted by {opportunity.postedByName}
                </p>

                <div className="split-actions" style={{ marginTop: 14 }}>
                  {opportunity.applyLink ? (
                    <a href={opportunity.applyLink} target="_blank" rel="noreferrer" className="button button-ghost">
                      Apply Link
                    </a>
                  ) : null}

                  {canRequestReferral ? (
                    <form action="/api/referrals" method="post">
                      <input type="hidden" name="opportunityId" value={opportunity.id} />
                      <button className="button button-secondary" type="submit">
                        Request Referral
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
