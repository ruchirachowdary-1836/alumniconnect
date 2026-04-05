import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { GraduationCap, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              shape?: string;
              text?: string;
              width?: string | number;
            }
          ) => void;
        };
      };
    };
  }
}

type AppRole = "student" | "alumni" | "admin";

const roles: { value: AppRole; label: string; icon: React.ElementType; desc: string }[] = [
  { value: "student", label: "Student", icon: GraduationCap, desc: "Search mentors & apply for referrals" },
  { value: "alumni", label: "Alumni", icon: User, desc: "Mentor students & post job referrals" },
];

export default function Login() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<AppRole>("student");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [otpChallenge, setOtpChallenge] = useState<{
    challengeId: string;
    phoneNumberMasked?: string;
    devOtp?: string;
    mode: "login" | "register";
  } | null>(null);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const { login, loginWithGoogle, register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const navigateByRole = (targetRole: AppRole) => {
    const path = targetRole === "student" ? "/student" : targetRole === "alumni" ? "/alumni" : "/admin";
    navigate(path);
  };

  useEffect(() => {
    if (!isLogin || !googleClientId || !googleButtonRef.current) return;

    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          if (!credential) {
            toast.error("Google sign-in did not return a token");
            return;
          }

          setSubmitting(true);
          try {
            const { error, role: loggedRole, requiresOtp, challengeId, phoneNumberMasked, devOtp, message } = await loginWithGoogle(credential);
            if (error) {
              toast.error(error);
              return;
            }
            if (requiresOtp && challengeId) {
              setOtp("");
              setOtpChallenge({ challengeId, phoneNumberMasked, devOtp, mode: "login" });
              toast.success(message || "Enter the OTP sent to your phone");
              return;
            }
            toast.success("Welcome back!");
            if (message) toast.info(message);
            navigateByRole(loggedRole ?? "student");
          } finally {
            setSubmitting(false);
          }
        },
      });

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "signin_with",
        width: "384",
      });
    };

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      if (window.google?.accounts?.id) renderGoogleButton();
      else existingScript.addEventListener("load", renderGoogleButton, { once: true });
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", renderGoogleButton, { once: true });
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [googleClientId, isLogin, loginWithGoogle, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && (!name || !phoneNumber))) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        const { error, role: loggedRole, requiresOtp, challengeId, phoneNumberMasked, devOtp, message } = await login(email, password);
        if (error) {
          toast.error(error);
          return;
        }
        if (requiresOtp && challengeId) {
          setOtp("");
          setOtpChallenge({ challengeId, phoneNumberMasked, devOtp, mode: "login" });
          toast.success(message || "Enter the OTP sent to your phone");
          return;
        }
        toast.success("Welcome back!");
        if (message) toast.info(message);
        navigateByRole(loggedRole ?? "student");
      } else {
        const { error, challengeId, phoneNumberMasked, devOtp, message } = await register(name, email, password, phoneNumber, role);
        if (error) {
          if (error.includes("already registered")) {
            toast.error("This email is already registered. Please sign in.");
          } else {
            toast.error(error);
          }
          return;
        }
        if (challengeId) {
          setOtp("");
          setOtpChallenge({ challengeId, phoneNumberMasked, devOtp, mode: "register" });
          toast.success(message || "Enter the OTP sent to your phone to finish signup.");
          return;
        }
        toast.success("Account created!");
        navigateByRole(role);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpChallenge?.challengeId || otp.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }

    setSubmitting(true);
    try {
      const { error, role: loggedRole } = await verifyOtp(otpChallenge.challengeId, otp);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(otpChallenge.mode === "register" ? "Account created and phone verified!" : "Phone verified. Welcome back!");
      setOtpChallenge(null);
      navigateByRole(loggedRole ?? role);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl border border-border shadow-xl p-8 space-y-6">
            <div className="text-center">
              <GraduationCap className="h-10 w-10 mx-auto text-secondary mb-3" />
              <h1 className="font-display text-2xl font-bold">{isLogin ? "Welcome Back" : "Create Account"}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isLogin ? "Sign in to your account" : "Join Alumni Connect today"}
              </p>
            </div>

            {/* Role selector (only for signup) */}
            {!isLogin && (
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      role === r.value
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <r.icon className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-xs font-medium">{r.label}</span>
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className="mt-1" />
                </div>
              )}
              {!isLogin && (
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Enter your mobile number" className="mt-1" />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@bvrit.ac.in" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full gradient-accent text-secondary-foreground font-semibold" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            {otpChallenge && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground">Verify Phone Number</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter the OTP sent to {otpChallenge.phoneNumberMasked || "your phone"}.
                  </p>
                  {otpChallenge.devOtp && (
                    <p className="text-xs text-secondary mt-1">Dev OTP: {otpChallenge.devOtp}</p>
                  )}
                </div>
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <Button type="button" className="w-full gradient-accent text-secondary-foreground font-semibold" onClick={handleVerifyOtp} disabled={submitting || otp.length !== 6}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Verify OTP
                </Button>
              </div>
            )}

            {isLogin && googleClientId && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <div ref={googleButtonRef} className="flex justify-center" />
              </>
            )}

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-secondary font-semibold hover:underline">
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
