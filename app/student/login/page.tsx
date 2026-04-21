import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

import { isClerkConfigured, missingAuthMessage } from "@/lib/auth-config";

export default function StudentLoginPage() {
  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">Student Login</h1>
          <p className="page-lead">Sign in to request mentorship, track responses, and chat after acceptance.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell auth-wrap">
          <div className="auth-panel">
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div className="brand-mark" style={{ margin: "0 auto 12px" }}>A</div>
              <h3 style={{ marginBottom: 6 }}>Student Portal</h3>
              <p className="muted">Use your student account to continue.</p>
            </div>

            {isClerkConfigured ? (
              <SignIn forceRedirectUrl="/student/dashboard" />
            ) : (
              <div className="empty-state">
                <strong>Google sign-in is not configured yet.</strong>
                <p className="muted">{missingAuthMessage}</p>
              </div>
            )}

            <div className="split-actions" style={{ marginTop: 18 }}>
              <Link href="/alumni/login" className="button button-ghost">
                Alumni Login
              </Link>
              <Link href="/faculty/login" className="button button-ghost">
                Faculty Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
