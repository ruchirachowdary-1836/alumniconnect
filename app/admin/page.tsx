import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

import { isClerkConfigured, missingAuthMessage } from "@/lib/auth-config";
import { prisma } from "@/lib/db";
import { demoMentorshipRequests } from "@/lib/demo-content";
import { readPortalMentorshipRequests, readPortalOpportunities, readPortalReferralRequests } from "@/lib/portal-store";
import { alumniSeed, studentSeed } from "@/lib/seed-data";
import { getAdminAccess } from "@/lib/admin-auth";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const adminAccess = await getAdminAccess();

  if (!adminAccess.isSignedIn) {
    return (
      <>
        <section className="page-band">
          <div className="shell page-band-inner">
            <h1 className="page-title">Faculty Admin</h1>
            <p className="page-lead">Faculty and placement coordinators can manage portal insights from here.</p>
          </div>
        </section>

        <section className="page-section">
          <div className="shell">
            <div className="auth-wrap">
              <div className="auth-panel">
                <div style={{ textAlign: "center", marginBottom: 18 }}>
                  <div className="brand-mark" style={{ margin: "0 auto 12px" }}>A</div>
                  <h3 style={{ marginBottom: 6 }}>Faculty Login</h3>
                  <p className="muted">
                    Sign in with the faculty account that has been approved for admin access.
                  </p>
                </div>

                {isClerkConfigured ? (
                  <SignIn forceRedirectUrl="/admin" />
                ) : (
                  <div className="empty-state">
                    <strong>Google sign-in is not configured yet.</strong>
                    <p className="muted">{missingAuthMessage}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  if (!adminAccess.isAdmin) {
    return (
      <>
        <section className="page-band">
          <div className="shell page-band-inner">
            <h1 className="page-title">Faculty Admin</h1>
            <p className="page-lead">This area is reserved for approved faculty and placement-office accounts.</p>
          </div>
        </section>

        <section className="page-section">
          <div className="shell">
            <div className="empty-state">
              <strong>Admin access not enabled for this account.</strong>
              <p className="muted">
                Signed in as {adminAccess.email ?? "your account"}.
                {adminAccess.hasAllowlist
                  ? " Ask the portal owner to add this email to the faculty admin allowlist."
                  : " Add faculty emails to FACULTY_ADMIN_EMAILS in Vercel to enable live admin access."}
              </p>
            </div>
          </div>
        </section>
      </>
    );
  }

  const params = (await searchParams) ?? {};
  const batchParam = Array.isArray(params.batch) ? params.batch[0] : params.batch;

  let allProfiles: Array<{
    id: string;
    role: string;
    fullName: string;
    rollNumber: string;
    batchYear: number | null;
    company: string | null;
    packageLpa: number | null;
    isMentorActive: boolean;
  }> = [];
  let requests: Array<{
    id: string;
    subject: string;
    status: string;
    createdAt: Date;
    student: { fullName: string };
    alumni: { fullName: string };
  }> = [];

  try {
    [allProfiles, requests] = await Promise.all([
      prisma.userProfile.findMany({
        orderBy: [{ packageLpa: "desc" }, { fullName: "asc" }],
      }),
      prisma.mentorshipRequest.findMany({
        include: { student: true, alumni: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);
  } catch {
    allProfiles = [
      ...alumniSeed.map((profile, index) => ({
        id: `alumni-${index}`,
        role: "ALUMNI",
        fullName: profile.name,
        rollNumber: profile.rollNumber,
        batchYear: profile.graduationYear ?? null,
        company: profile.company ?? null,
        packageLpa: profile.packageLpa ?? null,
        isMentorActive: false,
      })),
      ...studentSeed.map((profile, index) => ({
        id: `student-${index}`,
        role: "STUDENT",
        fullName: profile.name,
        rollNumber: profile.rollNumber,
        batchYear: 2026,
        company: null,
        packageLpa: null,
        isMentorActive: false,
      })),
    ];
    requests = [];
  }

  const portalRequests = (await readPortalMentorshipRequests()).map((request) => ({
    id: request.id,
    subject: request.subject,
    status: request.status,
    createdAt: new Date(request.createdAt),
    student: { fullName: request.studentName },
    alumni: { fullName: request.alumniName },
  }));
  const demoRequests = demoMentorshipRequests.map((request) => ({
    id: request.id,
    subject: request.subject,
    status: request.status,
    createdAt: new Date(request.createdAt),
    student: { fullName: request.studentName },
    alumni: { fullName: request.alumniName },
  }));

  const dbRequestIds = new Set(requests.map((request) => request.id));
  const portalRequestIds = new Set(portalRequests.map((request) => request.id));
  const visibleRequests = [
    ...requests,
    ...portalRequests.filter((request) => !dbRequestIds.has(request.id)),
    ...demoRequests.filter(
      (request) => !dbRequestIds.has(request.id) && !portalRequestIds.has(request.id),
    ),
  ];
  const portalOpportunities = await readPortalOpportunities();
  const portalReferralRequests = await readPortalReferralRequests();

  const batchOptions = [
    "All batches",
    ...new Set(allProfiles.map((profile) => profile.batchYear).filter((value): value is number => Boolean(value))),
  ];

  const visibleProfiles =
    !batchParam || batchParam === "All batches"
      ? allProfiles
      : allProfiles.filter((profile) => profile.batchYear?.toString() === batchParam);

  const alumni = visibleProfiles.filter((profile) => profile.role === "ALUMNI");
  const students = visibleProfiles.filter((profile) => profile.role === "STUDENT");
  const highestPackage = alumni.reduce((max, profile) => Math.max(max, profile.packageLpa ?? 0), 0);
  const totalPackage = alumni.reduce((sum, profile) => sum + (profile.packageLpa ?? 0), 0);
  const averagePackage = alumni.length > 0 ? totalPackage / alumni.length : 0;
  const companies = new Set(alumni.map((profile) => profile.company).filter(Boolean));
  const activeMentors = alumni.filter((profile) => profile.isMentorActive).length;

  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-lead">Live portal metrics, imported alumni insights, and community activity.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell">
          <div className="summary-grid" style={{ marginBottom: 18 }}>
            <article className="surface-card" style={{ background: "#0e76a7", color: "white" }}>
              <h3 style={{ color: "white" }}>{visibleProfiles.length}</h3>
              <p>Total Users</p>
            </article>
            <article className="surface-card" style={{ background: "#3cbeb5", color: "white" }}>
              <h3 style={{ color: "white" }}>{students.length}</h3>
              <p>Students</p>
            </article>
            <article className="surface-card" style={{ background: "#f7a11b", color: "white" }}>
              <h3 style={{ color: "white" }}>{alumni.length}</h3>
              <p>Alumni</p>
            </article>
            <article className="surface-card" style={{ background: "#245c73", color: "white" }}>
              <h3 style={{ color: "white" }}>{portalOpportunities.length}</h3>
              <p>Opportunities</p>
            </article>
          </div>

          <div className="dashboard-panel" style={{ marginBottom: 22 }}>
            <div className="section-header">
              <div>
                <h3>Students Requesting Mentorship</h3>
                <p className="card-copy">Track every student mentorship request and which alumni mentor received it.</p>
              </div>
              <span className="tab-pill">{activeMentors} active mentors</span>
            </div>
            {visibleRequests.length === 0 ? (
              <p className="muted">No mentorship requests have been created yet.</p>
            ) : (
              <div className="request-grid">
                {visibleRequests.map((request) => (
                  <article key={request.id} className="request-card">
                    <div className="section-header">
                      <div>
                        <h3>{request.student.fullName}</h3>
                        <p className="card-copy">{request.subject}</p>
                      </div>
                      <span className="tab-pill active">{request.status}</span>
                    </div>
                    <p className="small muted" style={{ marginBottom: 8 }}>
                      Student requested mentorship from <strong>{request.alumni.fullName}</strong>
                    </p>
                    <p className="small muted">Requested on {request.createdAt.toLocaleDateString("en-IN")}</p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-panel" style={{ marginBottom: 22 }}>
            <div className="section-header">
              <div>
                <h3>Faculty Controls</h3>
                <p className="card-copy">Enable all students and alumni, review mentorship flow, and open the sample chat pair directly.</p>
              </div>
              <span className="tab-pill active">Faculty actions</span>
            </div>

            <div className="split-actions">
              <form action="/api/admin/profile-access" method="post">
                <input type="hidden" name="action" value="activate_all_blocks" />
                <button className="button button-primary" type="submit">
                  Enable All Students And Alumni
                </button>
              </form>
              <Link href="/chat?with=23WH1A6627" className="button button-secondary">
                Open Sample Chat
              </Link>
            </div>
          </div>

          <div className="section-header">
            <div>
              <h2>Alumni Directory</h2>
              <p className="section-subtitle">Faculty can review imported alumni records and enable visibility from here.</p>
            </div>
            <form method="get">
              <select name="batch" defaultValue={batchParam ?? "All batches"}>
                {batchOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <button className="button button-subtle" type="submit" style={{ marginTop: 10 }}>
                Apply batch filter
              </button>
            </form>
          </div>

          <div className="dashboard-panel" style={{ marginTop: 22 }}>
            <div className="section-header">
              <div>
                <h3>Alumni Directory Access</h3>
                <p className="card-copy">Manage alumni directory visibility and enable all student and alumni records from here.</p>
              </div>
              <span className="tab-pill active">Faculty managed</span>
            </div>

            <div className="split-actions" style={{ marginBottom: 18 }}>
              <form action="/api/admin/profile-access" method="post">
                <input type="hidden" name="action" value="activate_all_blocks" />
                <button className="button button-primary" type="submit">
                  Enable All Students And Alumni
                </button>
              </form>
              <form action="/api/admin/profile-access" method="post">
                <input type="hidden" name="action" value="enable_all_alumni" />
                <button className="button button-secondary" type="submit">
                  Enable All Alumni
                </button>
              </form>
              <form action="/api/admin/profile-access" method="post">
                <input type="hidden" name="action" value="disable_all_alumni" />
                <button className="button button-ghost" type="submit">
                  Disable All Alumni
                </button>
              </form>
            </div>

            <div className="request-grid">
              {alumni.slice(0, 8).map((profile) => (
                <article key={profile.id} className="request-card">
                  <div className="section-header">
                    <div>
                      <h3>{profile.fullName}</h3>
                      <p className="card-copy">
                        {profile.company || "Imported alumni"} {profile.packageLpa ? `- ${profile.packageLpa} LPA` : ""}
                      </p>
                    </div>
                    <span className={`tab-pill ${profile.isMentorActive ? "active" : ""}`}>
                      {profile.isMentorActive ? "Access enabled" : "Access disabled"}
                    </span>
                  </div>

                  <p className="small muted" style={{ marginBottom: 12 }}>
                    Roll No: {profile.rollNumber}
                  </p>

                  <form action="/api/admin/profile-access" method="post" className="split-actions">
                    <input type="hidden" name="rollNumber" value={profile.rollNumber} />
                    <input type="hidden" name="action" value={profile.isMentorActive ? "disable" : "enable"} />
                    <button className="button button-secondary" type="submit">
                      {profile.isMentorActive ? "Disable profile access" : "Enable profile access"}
                    </button>
                  </form>
                </article>
              ))}
            </div>
          </div>

          <div className="dashboard-panel" style={{ marginTop: 22 }}>
            <div className="section-header">
              <div>
                <h3>Career Contributions</h3>
                <p className="card-copy">Track alumni-posted opportunities and referral activity from one place.</p>
              </div>
              <span className="tab-pill active">{portalReferralRequests.length} referral requests</span>
            </div>

            {portalOpportunities.length === 0 ? (
              <p className="muted">No opportunities have been posted yet.</p>
            ) : (
              <div className="request-grid">
                {portalOpportunities.slice(0, 6).map((opportunity) => (
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
                    <p className="small muted">
                      Posted by {opportunity.postedByName}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
