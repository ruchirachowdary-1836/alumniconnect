import Link from "next/link";

import { prisma } from "@/lib/db";
import { ensureSeedData } from "@/lib/seed";

export default async function DirectoryPage() {
  await ensureSeedData();

  const mentors = await prisma.userProfile.findMany({
    where: {
      role: "ALUMNI",
      isMentorActive: true,
      email: { not: null },
    },
    orderBy: [{ packageLpa: "desc" }, { fullName: "asc" }],
  });

  return (
    <section className="page-section">
      <div className="shell">
        <h1 className="page-title">Active mentor directory</h1>
        <p className="page-lead">
          Students can browse verified alumni mentors here. Alumni appear in this list only after
          signing in, claiming their imported profile, and enabling mentorship availability.
        </p>

        {mentors.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 28 }}>
            No alumni mentors have claimed their profile yet. Alumni should sign in and finish
            onboarding to start receiving mentorship requests.
          </div>
        ) : (
          <div className="directory-grid">
            {mentors.map((mentor) => (
              <article key={mentor.id} className="mentor-card">
                <div className="section-header">
                  <div>
                    <h3>{mentor.fullName}</h3>
                    <p className="muted">
                      {mentor.company} {mentor.packageLpa ? `• ${mentor.packageLpa} LPA` : ""}
                    </p>
                  </div>
                  <Link className="button-inline button-secondary" href={`/mentors/${mentor.rollNumber}`}>
                    View profile
                  </Link>
                </div>

                <div className="meta-row">
                  {mentor.branch ? <span className="meta-chip">{mentor.branch}</span> : null}
                  {mentor.batchYear ? <span className="meta-chip">Batch {mentor.batchYear}</span> : null}
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
                    "Available for interview preparation, resume review, placement strategy, and early-career guidance."}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
