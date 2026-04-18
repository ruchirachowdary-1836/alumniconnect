import Link from "next/link";

import { getSafeAuth } from "@/lib/auth";
import { isClerkConfigured, missingAuthMessage } from "@/lib/auth-config";
import { homeStats } from "@/lib/seed-data";

export default async function HomePage() {
  const { userId } = await getSafeAuth();

  return (
    <section className="hero">
      <div className="shell hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">Google sign-in, live mentorship workflow, email updates</span>
          <h1>Build stronger placement outcomes through alumni who can actually respond.</h1>
          <p>
            This portal connects BVRITH students with verified alumni mentors, tracks mentorship
            requests, and sends updates to the right inbox when a mentor accepts or rejects a
            request.
          </p>

          {!isClerkConfigured ? (
            <div className="empty-state" style={{ marginTop: 20 }}>
              <strong>Production setup pending.</strong>
              <p className="muted">{missingAuthMessage}</p>
            </div>
          ) : null}

          <div className="hero-actions">
            <Link href="/directory" className="button button-primary">
              Explore mentors
            </Link>
            {userId ? (
              <Link href="/dashboard" className="button button-secondary">
                Open dashboard
              </Link>
            ) : isClerkConfigured ? (
              <Link href="/sign-in" className="button button-secondary">
                Sign in with Google
              </Link>
            ) : (
              <span className="button button-secondary" style={{ cursor: "default", opacity: 0.8 }}>
                Google sign-in coming next
              </span>
            )}
          </div>

          <div className="stats-grid">
            <article className="stat-card hero-panel">
              <div className="stat-value">{homeStats.alumniCount}</div>
              <p>seeded alumni profiles from the placement sheet</p>
            </article>
            <article className="stat-card hero-panel">
              <div className="stat-value">{homeStats.studentCount}</div>
              <p>students ready to claim profiles and request guidance</p>
            </article>
            <article className="stat-card hero-panel">
              <div className="stat-value">{homeStats.topPackageLpa} LPA</div>
              <p>highest package captured in your placement workbook</p>
            </article>
          </div>
        </div>

        <aside className="hero-panel hero-highlight">
          <div>
            <p className="eyebrow">What this site already supports</p>
            <div className="card-grid">
              <article className="card">
                <h3>Claimed mentor profiles</h3>
                <p>Alumni sign in, match themselves to the imported record, and publish mentor availability.</p>
              </article>
              <article className="card">
                <h3>Student requests</h3>
                <p>Students select a mentor, add goals and availability, and create a tracked request.</p>
              </article>
              <article className="card">
                <h3>Email notifications</h3>
                <p>Requests notify alumni by email, and acceptance or rejection notifies the student.</p>
              </article>
            </div>
          </div>

          <div>
            <h3 className="display">Mentorship lanes</h3>
            <div className="pill-row">
              {homeStats.mentorTopics.map((topic) => (
                <span key={topic} className="pill">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
