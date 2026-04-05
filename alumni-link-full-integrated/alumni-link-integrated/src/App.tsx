import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import AlumniDashboard from "./pages/AlumniDashboard";
import AlumniProfile from "./pages/AlumniProfile";
import MentorDetail from "./pages/MentorDetail";
import AdminDashboard from "./pages/AdminDashboard";
import Chat from "./pages/Chat";
import CareerGuidance from "./pages/CareerGuidance";
import AlumniDirectory from "./pages/AlumniDirectory";
import SuccessStories from "./pages/SuccessStories";
import Events from "./pages/Events";
import Discussions from "./pages/Discussions";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { isAuthenticated, userRole, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (userRole && !allowedRoles.includes(userRole)) return <Navigate to="/" />;
  return <>{children}</>;
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, userRole, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (isAuthenticated && userRole) {
    const path = userRole === "student" ? "/student" : userRole === "alumni" ? "/alumni" : "/admin";
    return <Navigate to={path} />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
            <Route path="/student" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute allowedRoles={["student"]}><StudentProfile /></ProtectedRoute>} />
            <Route path="/mentor/:id" element={<ProtectedRoute allowedRoles={["student"]}><MentorDetail /></ProtectedRoute>} />
            <Route path="/alumni" element={<ProtectedRoute allowedRoles={["alumni"]}><AlumniDashboard /></ProtectedRoute>} />
            <Route path="/alumni/profile" element={<ProtectedRoute allowedRoles={["alumni"]}><AlumniProfile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute allowedRoles={["student", "alumni"]}><Chat /></ProtectedRoute>} />
            <Route path="/chat/:threadId" element={<ProtectedRoute allowedRoles={["student", "alumni"]}><Chat /></ProtectedRoute>} />
            <Route path="/career-guidance" element={<CareerGuidance />} />
            <Route path="/alumni-directory" element={<AlumniDirectory />} />
            <Route path="/success-stories" element={<SuccessStories />} />
            <Route path="/events" element={<Events />} />
            <Route path="/discussions" element={<Discussions />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
