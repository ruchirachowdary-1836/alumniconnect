import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-bold mb-3">
              <GraduationCap className="h-6 w-6 text-accent" />
              Alumni Connect
            </div>
            <p className="text-sm text-primary-foreground/70 max-w-xs">
              Bridging the gap between students and alumni for mentorship, guidance, and career growth.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold mb-3 text-accent">Quick Links</h4>
            <div className="space-y-2 text-sm text-primary-foreground/70">
              <Link to="/" className="block hover:text-primary-foreground transition-colors">Home</Link>
              <Link to="/about" className="block hover:text-primary-foreground transition-colors">About</Link>
              <Link to="/login" className="block hover:text-primary-foreground transition-colors">Login</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold mb-3 text-accent">Contact</h4>
            <div className="space-y-2 text-sm text-primary-foreground/70">
              <p>BVRIT Hyderabad</p>
              <p>Department of CSE(AI&ML)</p>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-primary-foreground/10 text-center text-xs text-primary-foreground/50">
          © 2026 Alumni Connect. Built at BVRIT Hyderabad.
        </div>
      </div>
    </footer>
  );
}
