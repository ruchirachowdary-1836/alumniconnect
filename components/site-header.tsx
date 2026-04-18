import Link from "next/link";

import { getSafeAuth } from "@/lib/auth";
import { isClerkConfigured } from "@/lib/auth-config";

export async function SiteHeader() {
  const { userId } = await getSafeAuth();

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">B</span>
          <span>
            <strong>BVRITH Alumni</strong>
            <small>Mentorship & placement support</small>
          </span>
        </Link>

        <nav className="nav">
          <Link href="/directory">Mentor Directory</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/onboarding">Claim Profile</Link>
          {userId ? (
            <Link href="/dashboard" className="button button-ghost">
              Account
            </Link>
          ) : isClerkConfigured ? (
            <Link href="/sign-in" className="button button-ghost">
              Sign in
            </Link>
          ) : (
            <span className="button button-ghost" style={{ cursor: "default", opacity: 0.7 }}>
              Auth setup pending
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
