import { SignUp } from "@clerk/nextjs";

import { isClerkConfigured, missingAuthMessage } from "@/lib/auth-config";

export default function SignUpPage() {
  return (
    <section className="page-section">
      <div className="shell">
        {isClerkConfigured ? (
          <SignUp forceRedirectUrl="/onboarding" />
        ) : (
          <div className="empty-state">
            <strong>Google sign-up is not configured yet.</strong>
            <p className="muted">{missingAuthMessage}</p>
          </div>
        )}
      </div>
    </section>
  );
}
