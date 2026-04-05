import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { profilesApi } from "@/integrations/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateMentorRequest } from "@/hooks/useMentorRequests";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building2, Briefcase, GraduationCap, Send, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function MentorDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const createRequest = useCreateMentorRequest();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["mentor-profile", id],
    queryFn: () => profilesApi.getById(id!),
    enabled: !!id,
  });

  const handleRequest = async () => {
    if (!user || !profile) return;
    const alumniUserId = profile.userId || profile.user_id;
    if (!alumniUserId) {
      toast.error("Cannot determine alumni ID");
      return;
    }
    try {
      await createRequest.mutateAsync({ alumniId: alumniUserId, message: "Mentorship request from student" });
      toast.success(`Request sent to ${profile.name}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send request");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-12"><Skeleton className="h-96 rounded-xl" /></main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-12 text-center">
          <p className="text-muted-foreground">Mentor not found.</p>
          <Link to="/student"><Button variant="outline" className="mt-4">Go Back</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const jobRole = profile.jobRole || profile.job_role;
  const company = profile.company;
  const dept = profile.department;
  const batch = profile.batch;
  const pkgVal = profile.packageAmount ?? profile.package;
  const bio = profile.bio;
  const expertise = profile.expertise ?? [];
  const available = profile.available ?? true;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/20">
        <div className="gradient-hero py-10">
          <div className="container">
            <Link to="/student" className="inline-flex items-center gap-1 text-primary-foreground/70 hover:text-primary-foreground text-sm mb-3 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground font-bold text-3xl flex-shrink-0 overflow-hidden">
                {profile.avatarUrl || profile.avatar_url ? (
                  <img src={profile.avatarUrl || profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile.name[0]
                )}
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-primary-foreground">{profile.name}</h1>
                <p className="text-primary-foreground/80 text-lg">{jobRole}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8 max-w-3xl">
          <div className="bg-card rounded-xl border border-border p-8 space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant={available ? "default" : "secondary"} className={available ? "bg-success text-success-foreground text-sm px-3 py-1" : "text-sm px-3 py-1"}>
                {available ? "Available for Mentorship" : "Currently Unavailable"}
              </Badge>
              {pkgVal && <span className="text-sm font-semibold text-secondary">{pkgVal} LPA</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium text-foreground">{company}</span>
                </div>
              )}
              {jobRole && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium text-foreground">{jobRole}</span>
                </div>
              )}
              {dept && (
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium text-foreground">{dept}</span>
                </div>
              )}
              {batch && (
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Batch:</span>
                  <span className="font-medium text-foreground">{batch}</span>
                </div>
              )}
            </div>

            {bio && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">About</h3>
                <p className="text-muted-foreground leading-relaxed">{bio}</p>
              </div>
            )}

            {expertise.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" /> Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  {expertise.map((e) => (
                    <span key={e} className="text-sm px-3 py-1 rounded-full bg-muted text-muted-foreground">{e}</span>
                  ))}
                </div>
              </div>
            )}

            {user && (
              <Button size="lg" className="w-full gradient-accent text-secondary-foreground font-semibold" disabled={!available || createRequest.isPending} onClick={handleRequest}>
                <Send className="h-4 w-4 mr-2" />
                {available ? "Request Mentorship" : "Not Available"}
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
