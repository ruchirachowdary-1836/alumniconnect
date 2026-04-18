import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentProfile, getSafeAuth } from "@/lib/auth";
import { isClerkConfigured } from "@/lib/auth-config";
import { prisma } from "@/lib/db";
import { ensureSeedData } from "@/lib/seed";

export default async function MentorProfilePage({
  params,
}: {
  params: Promise<{ rollNumber: string }>;
}) {
  await ensureSeedData();
  const { rollNumber } = await params;
  const mentor = await prisma.userProfile.findUnique({
    where: { rollNumber },
  });

  if (!mentor || mentor.role !== "ALUMNI" || !mentor.isMentorActive || !mentor.email) {
    redirect("/directory");
  }

  const { userId } = await getSafeAuth();
  const profile = await getCurrentProfile();
  const isStudent = Boolean(isClerkConfigured && userId && profile?.role === "STUDENT");

  return (
    <section className="page-section">
      <div className="shell two-column">
        <div className="dashboard-panel">
          <p className="eyebrow">Verified mentor</p>
          <h1 className="page-title" style={{ fontSize: "clamp(2.1rem, 5vw, 3.4rem)" }}>
            {mentor.fullName}
          </h1>
          <p className="page-lead">
            {mentor.company} {mentor.packageLpa ? `• ${mentor.packageLpa} LPA` : ""}{" "}
            {mentor.batchYear ? `• Batch ${mentor.batchYear}` : ""}
          </p>

          <div className="meta-row">
            {mentor.branch ? <span className="meta-chip">{mentor.branch}</span> : null}
            {mentor.mentorAreas
              ? mentor.mentorAreas.split(",").map((area) => (
                  <span key={area.trim()} className="meta-chip">
                    {area.trim()}
                  </span>
                ))
              : null}
          </div>

          <p className="muted">
            {mentor.bio ||
              "This mentor is open to placement preparation, company-specific interview guidance, resume reviews, and career planning conversations."}
          </p>
        </div>

        <div className="form-panel">
          <h3>Request mentorship</h3>
          {!isStudent ? (
            <div className="empty-state">
              <p className="muted">
                Students must sign in and claim a student profile before submitting a mentorship
                request.
              </p>
              <div className="split-actions">
                <Link href="/sign-in" className="button button-primary">
                  Sign in
                </Link>
                <Link href="/onboarding" className="button button-ghost">
                  Claim profile
                </Link>
              </div>
            </div>
          ) : (
            <form action="/api/mentorship" method="post" className="form-grid">
              <input type="hidden" name="alumniId" value={mentor.id} />
              <label>
                Subject
                <input name="subject" required placeholder="Example: Mock interview for Infosys" />
              </label>
              <label>
                Goals
                <textarea
                  name="goals"
                  required
                  placeholder="What exactly do you want help with in the next 2-3 weeks?"
                />
              </label>
              <label>
                Message
                <textarea
                  name="message"
                  required
                  placeholder="Introduce yourself and mention why you picked this mentor."
                />
              </label>
              <label>
                Preferred mode
                <select name="preferredMode" defaultValue="Google Meet">
                  <option>Google Meet</option>
                  <option>Phone call</option>
                  <option>Chat / Email</option>
                  <option>Any mode</option>
                </select>
              </label>
              <label>
                Availability
                <input name="availability" placeholder="Example: Weekdays after 6 PM" />
              </label>
              <button className="button button-primary" type="submit">
                Send request
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
