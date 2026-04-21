import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { DashboardOverview } from "@/components/dashboard-overview";
import { getCurrentProfile, getSafeAuth, getSafeCurrentUser, getSignedInIdentity } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { demoMentorshipRequests } from "@/lib/demo-content";
import { extractInstitutionRollNumber, inferNameFromEmail } from "@/lib/identity";
import { readPortalMentorshipRequests, readPortalReferralRequests } from "@/lib/portal-store";

export default async function AlumniDashboardPage() {
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
    const { email, fullName } = await getSignedInIdentity();
    const inferredRollNumber = extractInstitutionRollNumber(email);

    if (inferredRollNumber) {
      profile = {
        id: `inferred-alumni-${userId}`,
        clerkUserId: userId,
        email: email || null,
        role: "ALUMNI",
        fullName: fullName || inferNameFromEmail(email) || inferredRollNumber,
        rollNumber: inferredRollNumber,
        batchYear: null,
        branch: "CSE (AI & ML)",
        company: "Alumni Mentor",
        packageLpa: null,
        drivesAttended: null,
        backlogs: null,
        internship: null,
        mentorAreas: null,
        bio: null,
        acceptedGuidelines: true,
        isMentorActive: true,
      };
    }
  }

  if (!profile) {
    return <DashboardOverview />;
  }

  if (profile.role !== "ALUMNI") {
    redirect("/student/dashboard");
  }

  let requests = [];

  try {
    requests = await prisma.mentorshipRequest.findMany({
      where: {
        alumni: {
          rollNumber: profile.rollNumber,
        },
      },
      include: { student: true },
      orderBy: { id: "desc" },
    });
  } catch {
    requests = [];
  }

  const clerkUser = await getSafeCurrentUser();
  const metadataInbox = Array.isArray((clerkUser?.privateMetadata as Record<string, unknown> | undefined)?.alumniInbox)
    ? (((clerkUser?.privateMetadata as Record<string, unknown>).alumniInbox as Array<Record<string, unknown>>)
        .filter((item) => item.alumniRollNumber === profile.rollNumber)
        .map((item) => ({
          id: String(item.id ?? `meta-${Math.random()}`),
          subject: String(item.subject ?? "Mentorship Request"),
          goals: String(item.goals ?? ""),
          message: String(item.message ?? ""),
          preferredMode: String(item.preferredMode ?? "Google Meet"),
          availability: item.availability ? String(item.availability) : "",
          status: String(item.status ?? "PENDING"),
          alumniResponseMessage: item.alumniResponseMessage ? String(item.alumniResponseMessage) : null,
          student: {
            fullName: String(item.studentName ?? "Student"),
            rollNumber: String(item.studentRollNumber ?? ""),
            id: String(item.studentRollNumber ?? item.id ?? "student"),
          },
          source: "metadata",
        })))
    : [];

  const portalStoreRequests = (await readPortalMentorshipRequests())
    .filter((item) => item.alumniRollNumber === profile.rollNumber)
    .map((item) => ({
      id: item.id,
      subject: item.subject,
      goals: item.goals,
      message: item.message,
      preferredMode: item.preferredMode,
      availability: item.availability,
      status: item.status,
      alumniResponseMessage: item.alumniResponseMessage ?? null,
      student: {
        fullName: item.studentName,
        rollNumber: item.studentRollNumber,
        id: item.studentRollNumber,
      },
      source: "portal-store",
    }));

  const dbRequestIds = new Set(requests.map((request) => String(request.id)));
  const metadataIds = new Set(metadataInbox.map((request) => String(request.id)));
  const visibleRequests = [
    ...requests,
    ...metadataInbox.filter((request) => !dbRequestIds.has(String(request.id))),
    ...portalStoreRequests.filter(
      (request) => !dbRequestIds.has(String(request.id)) && !metadataIds.has(String(request.id)),
    ),
    ...demoMentorshipRequests
      .filter(
        (request) =>
          request.alumniRollNumber === profile.rollNumber ||
          (profile.email ? request.alumniEmail?.toLowerCase() === profile.email.toLowerCase() : false),
      )
      .filter(
        (request) =>
          !dbRequestIds.has(String(request.id)) &&
          !metadataIds.has(String(request.id)) &&
          !portalStoreRequests.some((item) => String(item.id) === String(request.id)),
      )
      .map((request) => ({
        id: request.id,
        subject: request.subject,
        goals: request.goals,
        message: request.message,
        preferredMode: request.preferredMode,
        availability: request.availability,
        status: request.status,
        alumniResponseMessage: request.alumniResponseMessage ?? null,
        student: {
          fullName: request.studentName,
          rollNumber: request.studentRollNumber,
          id: request.studentRollNumber,
        },
        source: "demo",
      })),
  ];
  const referralRequests = (await readPortalReferralRequests()).filter(
    (request) =>
      request.alumniRollNumber === profile.rollNumber ||
      (profile.email ? request.alumniEmail?.toLowerCase() === profile.email.toLowerCase() : false),
  );

  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">Requests</h1>
          <p className="page-lead">Review student requests here and accept or reject them immediately from the alumni dashboard.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell">
          {(profile.rollNumber === "23WH1A6627" ||
            profile.email?.toLowerCase() === "23wh1a6627@bvrithyderabad.edu.in") ? (
            <div className="tab-row" style={{ marginBottom: 18 }}>
              <a href="/chat?with=23WH1A6639" className="tab-pill active">
                Open Sample Chat
              </a>
            </div>
          ) : null}

          <section className="dashboard-panel" style={{ marginBottom: 26 }}>
            <div className="section-header">
              <div>
                <h2>Requests</h2>
                <p className="section-subtitle">Student mentorship requests are shown in this separate requests section for alumni review.</p>
              </div>
              <span className="tab-pill active">Requests ({visibleRequests.length})</span>
            </div>

            {visibleRequests.length === 0 ? (
              <div className="empty-state">
                No mentorship requests yet. Once students reach out, they will appear here.
              </div>
            ) : (
              <div className="request-grid">
                {visibleRequests.map((request) => (
                  <article key={request.id} className="request-card">
                    <div className="section-header">
                      <div>
                        <h3>{request.student.fullName}</h3>
                        <p className="card-copy">
                          {request.subject} ({request.student.rollNumber})
                        </p>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>

                    <p><strong>Goals:</strong> {request.goals}</p>
                    <p><strong>Message:</strong> {request.message}</p>
                    <p className="muted">
                      Preferred mode: {request.preferredMode}
                      {request.availability ? ` - ${request.availability}` : ""}
                    </p>

                    {request.status === "PENDING" ? (
                      <div className="split-actions">
                        <form action={`/api/mentorship/${request.id}/status`} method="post" className="form-grid" style={{ width: "100%" }}>
                          <input type="hidden" name="status" value="ACCEPTED" />
                          <label>
                            Response for student
                            <textarea
                              name="responseMessage"
                              placeholder="Share next steps, interview tips, or an availability window."
                            />
                          </label>
                          <div className="split-actions">
                            <button className="button button-secondary" type="submit">
                              Accept Mentorship
                            </button>
                          </div>
                        </form>

                        <form action={`/api/mentorship/${request.id}/status`} method="post" className="form-grid" style={{ width: "100%" }}>
                          <input type="hidden" name="status" value="REJECTED" />
                          <label>
                            Optional note
                            <textarea
                              name="responseMessage"
                              placeholder="Suggest another mentor or a better timeline."
                            />
                          </label>
                          <div className="split-actions">
                            <button className="button button-ghost" type="submit">
                              Reject
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <>
                        {request.alumniResponseMessage ? (
                          <div className="comment-box">
                            <strong>Your response:</strong> {request.alumniResponseMessage}
                          </div>
                        ) : null}
                      </>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-panel">
            <div className="section-header">
              <div>
                <h2>Referral Requests</h2>
                <p className="section-subtitle">Students asking for referrals against your posted opportunities appear here.</p>
              </div>
              <span className="tab-pill active">Referrals ({referralRequests.length})</span>
            </div>

            {referralRequests.length === 0 ? (
              <div className="empty-state">
                No referral requests yet. Post roles on the opportunities page to start receiving them.
              </div>
            ) : (
              <div className="request-grid">
                {referralRequests.map((request) => (
                  <article key={request.id} className="request-card">
                    <div className="section-header">
                      <div>
                        <h3>{request.studentName}</h3>
                        <p className="card-copy">
                          {request.opportunityTitle} ({request.company})
                        </p>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>

                    <p>{request.message}</p>
                    <p className="small muted" style={{ marginTop: 10 }}>
                      Student roll number: {request.studentRollNumber}
                    </p>

                    {request.status === "PENDING" ? (
                      <div className="split-actions">
                        <form action={`/api/referrals/${request.id}/status`} method="post" className="form-grid" style={{ width: "100%" }}>
                          <input type="hidden" name="status" value="ACCEPTED" />
                          <label>
                            Response for student
                            <textarea
                              name="responseMessage"
                              placeholder="Share next steps, referral process, or required documents."
                            />
                          </label>
                          <button className="button button-secondary" type="submit">
                            Accept Referral
                          </button>
                        </form>

                        <form action={`/api/referrals/${request.id}/status`} method="post" className="form-grid" style={{ width: "100%" }}>
                          <input type="hidden" name="status" value="REJECTED" />
                          <label>
                            Optional note
                            <textarea
                              name="responseMessage"
                              placeholder="Explain why this referral cannot be processed right now."
                            />
                          </label>
                          <button className="button button-ghost" type="submit">
                            Reject
                          </button>
                        </form>
                      </div>
                    ) : request.alumniResponseMessage ? (
                      <div className="comment-box">
                        <strong>Your response:</strong> {request.alumniResponseMessage}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </>
  );
}
