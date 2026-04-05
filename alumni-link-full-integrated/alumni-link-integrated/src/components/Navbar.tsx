import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { GraduationCap, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, logout, isAuthenticated, userRole, userName, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const dashboardPath = userRole === "student" ? "/student"
    : userRole === "alumni" ? "/alumni"
    : userRole === "admin" ? "/admin"
    : "/login";

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/alumni-directory", label: "Directory" },
    { to: "/events", label: "Events" },
    { to: "/discussions", label: "Forum" },
    ...(isAuthenticated && (userRole === "student" || userRole === "alumni") ? [{ to: "/chat", label: "Chat" }] : []),
    ...(isAuthenticated ? [{ to: dashboardPath, label: "Dashboard" }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/90 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-display text-xl font-bold text-primary">
          <GraduationCap className="h-7 w-7 text-secondary" />
          Alumni Connect
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <div className="flex items-center gap-3 ml-4">
              <NotificationBell />
              <span className="text-sm text-muted-foreground">
                Hi, <span className="font-semibold text-foreground">{userName || user?.email}</span>
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </div>
          ) : (
            <Link to="/login" className="ml-4">
              <Button className="gradient-accent text-accent-foreground font-semibold">Login</Button>
            </Link>
          )}
        </nav>

        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-2 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-2.5 rounded-md text-sm font-medium ${
                isActive(link.to) ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Button variant="outline" className="w-full mt-2" onClick={() => { handleLogout(); setMobileOpen(false); }}>
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <Button className="w-full gradient-accent text-accent-foreground font-semibold">Login</Button>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
