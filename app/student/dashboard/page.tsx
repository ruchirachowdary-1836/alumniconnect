import Link from "next/link";
import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { DashboardOverview } from "@/components/dashboard-overview";
import { getCurrentProfile, getSafeAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { demoMentorshipRequests } from "@/lib/demo-content";
import { readPortalMentorshipRequests, readPortalReferralRequests } from "@/lib/portal-store";
import { alumniSeed } from "@/lib/seed-data";

export default async function StudentDashboardPage() {
  const { userId } = await getSafeAuth();

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

  let requests = [];
  let visibleMentors = [];

  try {
    [requests, visibleMentors] = await Promise.all([
      prisma.mentorshipRequest.findMany({
        where: { studentId: profile.id },
        include: { alumni: true },
        orderBy: { id: "desc" },
      }),
      prisma.userProfile.findMany({
        where: { role: "ALUMNI" },
        orderBy: [{ packageLpa: "desc" }, { fullName: "asc" }],
        take: 6,
      }),
    ]);
  } catch {
    requests = [];
    visibleMentors = alumniSeed
      .slice()
      .sort((left, right) => (right.packageLpa ?? 0) - (left.packageLpa ?? 0))
      .slice(0, 6)
      .map((mentor, index) => ({
        id: `fallback-mentor-${index}`,
        fullName: mentor.name,
        rollNumber: mentor.rollNumber,
        company: mentor.company ?? null,
        packageLpa: mentor.packageLpa ?? null,
      }));
  }

  const portalRequests = (await readPortalMentorshipRequests())
    .filter(
      (request) =>
        request.studentRollNumber === profile.rollNumber ||
        (profile.email ? request.studentEmail.toLowerCase() === profile.email.toLowerCase() : false),
    )
    .map((request) => ({
      id: request.id,
      status: request.status,
      subject: request.subject,
      goals: request.goals,
      preferredMode: request.preferredMode,
      availability: request.availability,
      alumniResponseMessage: request.alumniResponseMessage ?? null,
      alumni: {
        id: request.alumniRollNumber,
        fullName: request.alumniName,
      },
    }));

  const dbRequestIds = new Set(requests.map((request) => String(request.id)));
  const visibleRequests = [
    ...requests,
    ...portalRequests.filter((request) => !dbRequestIds.has(String(request.id))),
    ...demoMentorshipRequests
      .filter(
        (request) =>
          request.studentRollNumber === profile.rollNumber ||
          (profile.email ? request.studentEmail.toLowerCase() === profile.email.toLowerCase() : false),
      )
      .filter((request) => !dbRequestIds.has(String(request.id)))
      .map((request) => ({
        id: request.id,
        status: request.status,
        subject: request.subject,
        goals: request.goals,
        preferredMode: request.preferredMode,
        availability: request.availability,
        alumniResponseMessage: request.alumniResponseMessage ?? null,
        alumni: {
          id: request.alumniRollNumber,
          fullName: request.alumniName,
        },
      })),
  ];
  const referralRequests = (await readPortalReferralRequests()).filter(
    (request) =>
      request.studentRollNumber === profile.rollNumber ||
      (profile.email ? request.studentEmail.toLowerCase() === profile.email.toLowerCase() : false),
  );

  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">Student Dashboard</h1>
          <p className="page-lead">Find mentors, send requests, and track acceptance and chat access.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell">
          <div className="tab-row" style={{ marginBottom: 18 }}>
            <span className="tab-pill active">Find Mentors</span>
            <span className="tab-pill">Your Requests</span>
            <Link href="/opportunities" className="tab-pill">
              Opportunities
            </Link>
            {(profile.rollNumber === "23WH1A6639" ||
              profile.email?.toLowerCase() === "23wh1a6639@bvrithyderabad.edu.in") ? (
              <Link href="/chat?with=23WH1A6627" className="tab-pill active">
                Open Sample Chat
              </Link>
            ) : null}
          </div>

          <div className="directory-grid" style={{ marginBottom: 26 }}>
            {visibleMentors.map((mentor) => (
              <article key={mentor.id} className="mentor-card">
                <div className="mentor-card-top">
                  <div className="mentor-card-head">
                    <div className="avatar">{mentor.fullName.charAt(0)}</div>
                    <div>
                      <h3>{mentor.fullName}</h3>
                      <p className="muted">
                        {mentor.company || "Alumni"} {mentor.packageLpa ? `- ${mentor.packageLpa} LPA` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="availability-badge">Available</span>
                </div>

                <Link href={`/mentors/${mentor.rollNumber}`} className="button button-secondary request-action">
                  Request Mentorship
                </Link>
              </article>
            ))}
          </div>

          <div className="section-header">
            <div>
              <h2>Your Requests</h2>
              <p className="section-subtitle">Track acceptance, rejection, and mentor notes here.</p>
            </div>
          </div>

          {visibleRequests.length === 0 ? (
            <div className="empty-state">
              No mentorship requests yet. Open an alumni profile and start with a specific goal.
            </div>
          ) : (
            <div className="request-grid">
              {visibleRequests.map((request) => (
                <article key={request.id} className="request-card">
                  <div className="section-header">
                    <div>
                      <h3>{request.alumni.fullName}</h3>
                      <p className="card-copy">{request.subject}</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>

                  <p><strong>Goals:</strong> {request.goals}</p>
                  <p className="muted">
                    Requested via {request.preferredMode}
                    {request.availability ? ` - ${request.availability}` : ""}
                  </p>

                  {request.alumniResponseMessage ? (
                    <div className="comment-box">
                      <strong>Mentor response:</strong> {request.alumniResponseMessage}
                    </div>
                  ) : null}

                  {request.status === "ACCEPTED" ? (
                    <div className="split-actions">
                      <Link href={`/chat?with=${request.alumni.id}`} className="button button-secondary">
                        Open Chat
                      </Link>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}

          <div className="section-header" style={{ marginTop: 28 }}>
            <div>
              <h2>Your Referral Requests</h2>
              <p className="section-subtitle">Track referrals requested against alumni-posted opportunities.</p>
            </div>
          </div>

          {referralRequests.length === 0 ? (
            <div className="empty-state">
              No referral requests yet. Browse the opportunities page to request one from alumni.
            </div>
          ) : (
            <div className="request-grid">
              {referralRequests.map((request) => (
                <article key={request.id} className="request-card">
                  <div className="section-header">
                    <div>
                      <h3>{request.opportunityTitle}</h3>
                      <p className="card-copy">
                        {request.company} • Alumni: {request.alumniName}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>

                  <p>{request.message}</p>

                  {request.alumniResponseMessage ? (
                    <div className="comment-box">
                      <strong>Alumni response:</strong> {request.alumniResponseMessage}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
