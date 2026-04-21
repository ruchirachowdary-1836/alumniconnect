import Link from "next/link";

export default function LoginChooserPage() {
  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">Choose Login</h1>
          <p className="page-lead">Select the portal entry that matches your role.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell">
          <div className="feature-grid">
            <article className="surface-card">
              <h3>Student Login</h3>
              <p className="card-copy">Open the student dashboard, request mentorship, and chat after acceptance.</p>
              <Link href="/student/login" className="button button-secondary request-action">
                Student Login
              </Link>
            </article>

            <article className="surface-card">
              <h3>Alumni Login</h3>
              <p className="card-copy">Open the alumni dashboard, review student requests, and accept or reject them.</p>
              <Link href="/alumni/login" className="button button-secondary request-action">
                Alumni Login
              </Link>
            </article>

            <article className="surface-card">
              <h3>Faculty Login</h3>
              <p className="card-copy">Open faculty admin, activate blocks, and manage events and directory access.</p>
              <Link href="/faculty/login" className="button button-secondary request-action">
                Faculty Login
              </Link>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
