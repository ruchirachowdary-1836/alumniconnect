import Link from "next/link";

export default function OnboardingPage() {
  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">Profile Access Managed By Faculty</h1>
          <p className="page-lead">Self-service claim profile has been removed from the portal.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell">
          <div className="empty-state">
            <strong>Faculty controls profile access now.</strong>
            <p className="muted">
              Students and alumni no longer claim profiles directly. A faculty admin must enable the imported profile access from the admin dashboard.
            </p>
            <div className="split-actions" style={{ marginTop: 14 }}>
              <Link href="/directory" className="button button-primary">
                Browse directory
              </Link>
              <Link href="/" className="button button-ghost">
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
