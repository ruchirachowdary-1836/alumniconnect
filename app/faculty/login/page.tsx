import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

import { isClerkConfigured, missingAuthMessage } from "@/lib/auth-config";

export default function FacultyLoginPage() {
  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">Faculty Login</h1>
          <p className="page-lead">Sign in to manage access, moderate the portal, and publish campus events.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell auth-wrap">
          <div className="auth-panel">
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div className="brand-mark" style={{ margin: "0 auto 12px" }}>A</div>
              <h3 style={{ marginBottom: 6 }}>Faculty Admin</h3>
              <p className="muted">Use the approved faculty account to continue.</p>
            </div>

            {isClerkConfigured ? (
              <SignIn forceRedirectUrl="/admin" />
            ) : (
              <div className="empty-state">
                <strong>Google sign-in is not configured yet.</strong>
                <p className="muted">{missingAuthMessage}</p>
              </div>
            )}

            <div className="split-actions" style={{ marginTop: 18 }}>
              <Link href="/student/login" className="button button-ghost">
                Student Login
              </Link>
              <Link href="/alumni/login" className="button button-ghost">
                Alumni Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
