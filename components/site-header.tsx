import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { getCurrentProfile, getSafeAuth } from "@/lib/auth";
import { isClerkConfigured } from "@/lib/auth-config";

export async function SiteHeader() {
  const { userId } = await getSafeAuth();
  let profile = null;

  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null;
  }

  const isAlumni = profile?.role === "ALUMNI";
  const isStudent = profile?.role === "STUDENT";

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">A</span>
          <span>
            <strong>Alumni Connect</strong>
            <small>BVRIT Hyderabad</small>
          </span>
        </Link>

        <nav className="nav">
          <Link href="/" className="nav-link active">Home</Link>
          <Link href="/about" className="nav-link">About</Link>
          {isAlumni ? (
            <>
              <Link href="/opportunities" className="nav-link">Opportunities</Link>
              <Link href="/alumni/dashboard" className="nav-link">Dashboard</Link>
            </>
          ) : isStudent ? (
            <>
              <Link href="/directory" className="nav-link">Directory</Link>
              <Link href="/opportunities" className="nav-link">Opportunities</Link>
              <Link href="/events" className="nav-link">Events</Link>
              <Link href="/forum" className="nav-link">Forum</Link>
              <Link href="/chat" className="nav-link">Chat</Link>
              <Link href="/student/dashboard" className="nav-link">Dashboard</Link>
            </>
          ) : (
            <>
              <Link href="/directory" className="nav-link">Directory</Link>
              <Link href="/opportunities" className="nav-link">Opportunities</Link>
              <Link href="/events" className="nav-link">Events</Link>
              <Link href="/forum" className="nav-link">Forum</Link>
              <Link href="/chat" className="nav-link">Chat</Link>
              <Link href="/dashboard" className="nav-link">Dashboard</Link>
            </>
          )}
          {isClerkConfigured && userId ? (
            <>
              <Link href={isAlumni ? "/alumni/dashboard" : isStudent ? "/student/dashboard" : "/dashboard"} className="nav-link nav-cta">
                Open Portal
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : isClerkConfigured ? (
            <>
              <Link href="/login" className="nav-link">
                Sign in
              </Link>
              <Link href="/login" className="nav-link nav-cta">
                Choose Portal
              </Link>
            </>
          ) : (
            <span className="nav-link nav-cta" style={{ cursor: "default", opacity: 0.8 }}>
              Login
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
