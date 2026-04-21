import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-column">
          <div className="brand footer-brand">
            <span className="brand-mark">A</span>
            <span>
              <strong>Alumni Connect</strong>
              <small>Bridging students and alumni for mentorship, guidance, and growth.</small>
            </span>
          </div>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h4>Quick Links</h4>
            <p><Link href="/about">About</Link></p>
            <p><Link href="/directory">Directory</Link></p>
            <p><Link href="/events">Events</Link></p>
          </div>

          <div className="footer-column">
            <h4>Community</h4>
            <p><Link href="/forum">Forum</Link></p>
            <p><Link href="/chat">Chat</Link></p>
            <p><Link href="/dashboard">Dashboard</Link></p>
          </div>

          <div className="footer-column">
            <h4>Contact</h4>
            <p>BVRIT Hyderabad</p>
            <p>Department of CSE(AIML)</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
