import Link from "next/link";

import { getSafeAuth } from "@/lib/auth";
import { isClerkConfigured, missingAuthMessage } from "@/lib/auth-config";
import { homeStats } from "@/lib/seed-data";

export default async function HomePage() {
  const { userId } = await getSafeAuth();

  return (
    <>
      <section className="hero">
        <div className="hero-band">
          <div className="shell hero-content">
            <div className="hero-copy">
              <span className="eyebrow">BVRIT Hyderabad - CSE(AIML)</span>
              <h1 className="hero-title">
                Connect. Learn. <span className="accent">Grow.</span>
              </h1>
              <p className="hero-lead">
                A student-alumni mentorship and referral portal bridging the gap between campus and
                corporate life.
              </p>

              <div className="hero-actions">
                <Link href="/directory" className="button button-primary">
                  Get Started
                </Link>
                <Link href="/about" className="button button-ghost">
                  Learn More
                </Link>
              </div>

              {!isClerkConfigured ? (
                <div className="empty-state" style={{ marginTop: 18, textAlign: "left" }}>
                  <strong>Authentication setup pending.</strong>
                  <p className="muted">{missingAuthMessage}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="shell hero-stats">
          <div className="stats-grid">
            <article className="hero-stat">
              <div className="stat-icon">#</div>
              <div className="stat-hero-value">{homeStats.studentCount + homeStats.alumniCount}+</div>
              <div className="stat-caption">Students Placed</div>
            </article>
            <article className="hero-stat">
              <div className="stat-icon">#</div>
              <div className="stat-hero-value">52 LPA</div>
              <div className="stat-caption">Highest Package</div>
            </article>
            <article className="hero-stat">
              <div className="stat-icon">#</div>
              <div className="stat-hero-value">7+</div>
              <div className="stat-caption">Top Recruiters</div>
            </article>
            <article className="hero-stat">
              <div className="stat-icon">#</div>
              <div className="stat-hero-value">10.2 LPA</div>
              <div className="stat-caption">Avg Package</div>
            </article>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="shell">
          <div className="section-header">
            <div>
              <h2>Built for placements, referrals, and guidance</h2>
              <p className="section-subtitle">
                The portal now matches the Alumni Connect style you shared while keeping the real
                mentorship request flow underneath.
              </p>
            </div>
            <div className="tab-row">
              <span className="tab-pill active">Mentorship</span>
              <span className="tab-pill">Referrals</span>
              <span className="tab-pill">Community</span>
            </div>
          </div>

          <div className="feature-grid">
            <article className="surface-card">
              <h3>Mentor Directory</h3>
              <p className="card-copy">
                Explore alumni by company, batch, and expertise, then send focused mentorship
                requests.
              </p>
              <div className="pill-row">
                <span className="pill">Company Filters</span>
                <span className="pill">Mentor Profiles</span>
                <span className="pill">Request Tracking</span>
              </div>
            </article>

            <article className="surface-card">
              <h3>Referral Workflow</h3>
              <p className="card-copy">
                Alumni receive requests by email and students get notified when requests are
                accepted or rejected.
              </p>
              <div className="pill-row">
                <span className="pill">Email Updates</span>
                <span className="pill">Status Timeline</span>
                <span className="pill">Mentor Notes</span>
              </div>
            </article>

            <article className="surface-card">
              <h3>Community Experience</h3>
              <p className="card-copy">
                Forum, events, chat, and analytics-style dashboards make the portal feel like a
                complete student-alumni product.
              </p>
              <div className="pill-row">
                <span className="pill">Discussion Forum</span>
                <span className="pill">Events</span>
                <span className="pill">Chat UI</span>
              </div>
            </article>
          </div>
        </div>
      </section>

    </>
  );
}
