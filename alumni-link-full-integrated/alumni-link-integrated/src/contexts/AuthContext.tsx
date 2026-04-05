import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, AuthResponse } from "@/integrations/api/client";

type AppRole = "student" | "alumni" | "admin";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  phoneNumber?: string;
  phoneVerified?: boolean;
}

interface AuthActionResult {
  error: string | null;
  role?: AppRole;
  requiresOtp?: boolean;
  challengeId?: string;
  phoneNumberMasked?: string;
  devOtp?: string;
  phoneVerificationRequired?: boolean;
  message?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  userRole: AppRole | null;
  userName: string;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  loginWithGoogle: (idToken: string) => Promise<AuthActionResult>;
  register: (name: string, email: string, password: string, phoneNumber: string, role: AppRole) => Promise<AuthActionResult>;
  verifyOtp: (challengeId: string, otp: string) => Promise<AuthActionResult>;
  requestPhoneVerification: (phoneNumber: string) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function storeAuth(res: AuthResponse) {
  const u: AuthUser = {
    id: res.userId,
    email: res.email,
    name: res.name,
    role: res.role as AppRole,
    phoneNumber: res.phoneNumber,
    phoneVerified: res.phoneVerified,
  };
  localStorage.setItem("auth_token", res.token);
  localStorage.setItem("auth_user", JSON.stringify(u));
  return u;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const t = localStorage.getItem("auth_token");
      const u = localStorage.getItem("auth_user");
      if (t && u) setUser(JSON.parse(u));
    } catch {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await authApi.login({ email, password });
      if (res.token) setUser(storeAuth(res));
      return {
        error: null,
        role: res.role as AppRole,
        requiresOtp: res.requiresOtp,
        challengeId: res.challengeId,
        phoneNumberMasked: res.phoneNumberMasked,
        devOtp: res.devOtp,
        phoneVerificationRequired: res.phoneVerificationRequired,
        message: res.message,
      };
    } catch (e: any) {
      return { error: e.message || "Login failed" };
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    try {
      const res = await authApi.googleLogin({ idToken });
      if (res.token) setUser(storeAuth(res));
      return {
        error: null,
        role: res.role as AppRole,
        requiresOtp: res.requiresOtp,
        challengeId: res.challengeId,
        phoneNumberMasked: res.phoneNumberMasked,
        devOtp: res.devOtp,
        phoneVerificationRequired: res.phoneVerificationRequired,
        message: res.message,
      };
    } catch (e: any) {
      return { error: e.message || "Google sign-in failed" };
    }
  };

  const register = async (name: string, email: string, password: string, phoneNumber: string, role: AppRole) => {
    try {
      const res = await authApi.register({ name, email, password, phoneNumber, role });
      return {
        error: null,
        role: res.role as AppRole,
        requiresOtp: res.requiresOtp,
        challengeId: res.challengeId,
        phoneNumberMasked: res.phoneNumberMasked,
        devOtp: res.devOtp,
        message: res.message,
      };
    } catch (e: any) {
      return { error: e.message || "Registration failed" };
    }
  };

  const verifyOtp = async (challengeId: string, otp: string) => {
    try {
      const res = await authApi.verifyOtp({ challengeId, otp });
      setUser(storeAuth(res));
      return { error: null, role: res.role as AppRole, message: res.message };
    } catch (e: any) {
      return { error: e.message || "OTP verification failed" };
    }
  };

  const requestPhoneVerification = async (phoneNumber: string) => {
    try {
      const res = await authApi.requestPhoneVerification({ phoneNumber });
      return {
        error: null,
        requiresOtp: res.requiresOtp,
        challengeId: res.challengeId,
        phoneNumberMasked: res.phoneNumberMasked,
        devOtp: res.devOtp,
        message: res.message,
      };
    } catch (e: any) {
      return { error: e.message || "Failed to send OTP" };
    }
  };

  const logout = async () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, userRole: user?.role ?? null, userName: user?.name ?? "",
      login, loginWithGoogle, register, verifyOtp, requestPhoneVerification, logout, isAuthenticated: !!user, loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
