import { SignUp } from "@clerk/nextjs";

import { isClerkConfigured, missingAuthMessage } from "@/lib/auth-config";

export default function SignUpPage() {
  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">Sign Up</h1>
          <p className="page-lead">Create your Alumni Connect account and continue to profile claim.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell auth-wrap">
          <div className="auth-panel">
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div className="brand-mark" style={{ margin: "0 auto 12px" }}>A</div>
              <h3 style={{ marginBottom: 6 }}>Join Alumni Connect</h3>
              <p className="muted">Create your account and continue to onboarding</p>
            </div>

            {isClerkConfigured ? (
              <SignUp forceRedirectUrl="/onboarding" />
            ) : (
              <div className="empty-state">
                <strong>Google sign-up is not configured yet.</strong>
                <p className="muted">{missingAuthMessage}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
