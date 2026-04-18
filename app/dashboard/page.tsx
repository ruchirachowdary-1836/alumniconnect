import Link from "next/link";
import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { getCurrentProfile, getSafeAuth } from "@/lib/auth";
import { isClerkConfigured, missingAuthMessage } from "@/lib/auth-config";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const { userId } = await getSafeAuth();

  if (!isClerkConfigured) {
    return (
      <section className="page-section">
        <div className="shell">
          <div className="empty-state">
            <strong>Authentication is not live yet.</strong>
            <p className="muted">{missingAuthMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!userId) {
    redirect("/sign-in");
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/onboarding");
  }

  if (profile.role === "ALUMNI") {
    const requests = await prisma.mentorshipRequest.findMany({
      where: { alumniId: profile.id },
      include: { student: true },
      orderBy: { id: "desc" },
    });

    return (
      <section className="page-section">
        <div className="shell">
          <div className="section-header">
            <div>
              <h1 className="page-title">Alumni dashboard</h1>
              <p className="page-lead">
                Review incoming mentorship requests and respond from one place. Students are emailed
                as soon as you accept or reject.
              </p>
            </div>
            <Link href="/directory" className="button button-secondary">
              View live directory
            </Link>
          </div>

          <div className="dashboard-panel" style={{ marginBottom: 24 }}>
            <h3>{profile.fullName}</h3>
            <p className="muted">
              Mentor visibility: {profile.isMentorActive ? "Active in directory" : "Hidden until enabled"}
            </p>
          </div>

          {requests.length === 0 ? (
            <div className="empty-state">No mentorship requests yet. Once students send requests, they will appear here.</div>
          ) : (
            <div className="request-grid">
              {requests.map((request) => (
                <article key={request.id} className="request-card">
                  <div className="section-header">
                    <div>
                      <h3>{request.subject}</h3>
                      <p className="muted">
                        {request.student.fullName} • {request.student.rollNumber}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>

                  <p><strong>Goals:</strong> {request.goals}</p>
                  <p><strong>Message:</strong> {request.message}</p>
                  <p className="muted">
                    Preferred mode: {request.preferredMode}
                    {request.availability ? ` • ${request.availability}` : ""}
                  </p>

                  {request.status === "PENDING" ? (
                    <div className="split-actions">
                      <form action={`/api/mentorship/${request.id}/status`} method="post" className="form-grid" style={{ width: "100%" }}>
                        <input type="hidden" name="status" value="ACCEPTED" />
                        <label>
                          Optional response for student
                          <textarea
                            name="responseMessage"
                            placeholder="Share next steps, preferred time slots, or meeting link instructions."
                          />
                        </label>
                        <button className="button button-primary" type="submit">
                          Accept request
                        </button>
                      </form>

                      <form action={`/api/mentorship/${request.id}/status`} method="post" className="form-grid" style={{ width: "100%" }}>
                        <input type="hidden" name="status" value="REJECTED" />
                        <label>
                          Optional response for student
                          <textarea
                            name="responseMessage"
                            placeholder="You can suggest another timeline or encourage them to contact another mentor."
                          />
                        </label>
                        <button className="button button-ghost" type="submit">
                          Reject request
                        </button>
                      </form>
                    </div>
                  ) : request.alumniResponseMessage ? (
                    <p className="muted">
                      <strong>Your response:</strong> {request.alumniResponseMessage}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  const requests = await prisma.mentorshipRequest.findMany({
    where: { studentId: profile.id },
    include: { alumni: true },
    orderBy: { id: "desc" },
  });

  return (
    <section className="page-section">
      <div className="shell">
        <div className="section-header">
          <div>
            <h1 className="page-title">Student dashboard</h1>
            <p className="page-lead">
              Browse active alumni mentors, send a request, and track every status change here.
            </p>
          </div>
          <Link href="/directory" className="button button-primary">
            Browse mentors
          </Link>
        </div>

        <div className="dashboard-panel" style={{ marginBottom: 24 }}>
          <h3>{profile.fullName}</h3>
          <p className="muted">
            {profile.rollNumber}
            {profile.drivesAttended ? ` • ${profile.drivesAttended} drives attended` : ""}
            {profile.backlogs ? ` • Backlogs: ${profile.backlogs}` : ""}
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="empty-state">
            No mentorship requests yet. Open the mentor directory and start with a clear, specific ask.
          </div>
        ) : (
          <div className="request-grid">
            {requests.map((request) => (
              <article key={request.id} className="request-card">
                <div className="section-header">
                  <div>
                    <h3>{request.subject}</h3>
                    <p className="muted">{request.alumni.fullName}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <p><strong>Goals:</strong> {request.goals}</p>
                <p className="muted">
                  Requested via {request.preferredMode}
                  {request.availability ? ` • ${request.availability}` : ""}
                </p>

                {request.alumniResponseMessage ? (
                  <p className="muted">
                    <strong>Mentor response:</strong> {request.alumniResponseMessage}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
