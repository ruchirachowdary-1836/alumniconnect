export default function AboutPage() {
  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">About Alumni Connect</h1>
          <p className="page-lead">
            A portal built to connect students with alumni for mentorship, referrals, and placement guidance.
          </p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell">
          <div className="feature-grid">
            <article className="surface-card">
              <h3>Why this portal exists</h3>
              <p className="card-copy">
                Students often need timely guidance from alumni who have already navigated the same
                placement process, interview rounds, and transition into industry.
              </p>
            </article>

            <article className="surface-card">
              <h3>What it supports</h3>
              <p className="card-copy">
                Mentor discovery, request tracking, response workflows, community discussion,
                events, and analytics-style visibility for the department.
              </p>
            </article>

            <article className="surface-card">
              <h3>Built for BVRIT Hyderabad</h3>
              <p className="card-copy">
                The portal uses imported placement data and keeps the product tailored to the
                BVRIT Hyderabad alumni and student ecosystem.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
