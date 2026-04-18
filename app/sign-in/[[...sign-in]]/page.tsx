import { SignIn } from "@clerk/nextjs";

import { isClerkConfigured, missingAuthMessage } from "@/lib/auth-config";

export default function SignInPage() {
  return (
    <section className="page-section">
      <div className="shell">
        {isClerkConfigured ? (
          <SignIn forceRedirectUrl="/dashboard" />
        ) : (
          <div className="empty-state">
            <strong>Google sign-in is not configured yet.</strong>
            <p className="muted">{missingAuthMessage}</p>
          </div>
        )}
      </div>
    </section>
  );
}
