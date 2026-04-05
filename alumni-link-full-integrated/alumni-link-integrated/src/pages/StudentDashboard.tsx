import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useAlumniProfiles } from "@/hooks/useProfiles";
import { useJobs } from "@/hooks/useJobs";
import { useCreateMentorRequest } from "@/hooks/useMentorRequests";
import { referralRequestsApi } from "@/integrations/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Briefcase, MapPin, Building2, Star, Send, Filter, UserCog } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function StudentDashboard() {
  const { user, userName } = useAuth();
  const { data: alumni = [], isLoading: alumniLoading } = useAlumniProfiles();
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();
  const createRequest = useCreateMentorRequest();
  const qc = useQueryClient();
  const sendReferral = useMutation({
    mutationFn: (d: { jobId: string; resume: File; message?: string }) =>
      referralRequestsApi.createForJob(d.jobId, d.resume, d.message),
    onSuccess: () => {
      toast.success("Referral request sent!");
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to send referral request"),
  });
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [tab, setTab] = useState<"mentors" | "jobs">("mentors");
  const [refDialog, setRefDialog] = useState<{ open: boolean; jobId?: string; jobTitle?: string }>({ open: false });
  const [refMessage, setRefMessage] = useState("");
  const [refFile, setRefFile] = useState<File | null>(null);

  const filteredAlumni = alumni.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      a.name.toLowerCase().includes(q) ||
      (a.company ?? "").toLowerCase().includes(q) ||
      (a.expertise ?? []).some((e) => e.toLowerCase().includes(q));
    const matchesCompany = !companyFilter || (a.company ?? "").toLowerCase().includes(companyFilter.toLowerCase());
    return matchesSearch && matchesCompany;
  });

  const companies = [...new Set(alumni.map((a) => a.company).filter(Boolean))];

  const handleRequestMentor = async (alumniUserId: string, alumniName: string) => {
    if (!user) return;
    try {
      await createRequest.mutateAsync({
        alumniId: alumniUserId,
        message: `Mentorship request from ${userName}`,
      });
      toast.success(`Mentorship request sent to ${alumniName}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send request");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/20">
        <div className="gradient-hero py-10">
          <div className="container">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold text-primary-foreground">
                  Welcome, {userName || "Student"}
                </h1>
                <p className="text-primary-foreground/70 mt-1">Find mentors and explore job referrals</p>
              </div>
              <Link to="/student/profile">
                <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  <UserCog className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="flex gap-2 mb-6">
            <Button variant={tab === "mentors" ? "default" : "outline"} onClick={() => setTab("mentors")} className={tab === "mentors" ? "gradient-accent text-secondary-foreground" : ""}>
              <Star className="h-4 w-4 mr-2" /> Find Mentors
            </Button>
            <Button variant={tab === "jobs" ? "default" : "outline"} onClick={() => setTab("jobs")} className={tab === "jobs" ? "gradient-accent text-secondary-foreground" : ""}>
              <Briefcase className="h-4 w-4 mr-2" /> Job Referrals
            </Button>
          </div>

          {tab === "mentors" && (
            <>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name, company, or expertise..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="pl-10 pr-4 h-10 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer min-w-[180px]">
                    <option value="">All Companies</option>
                    {companies.map((c) => <option key={c} value={c!}>{c}</option>)}
                  </select>
                </div>
              </div>

              {alumniLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredAlumni.map((a) => (
                    <Link to={`/mentor/${a.id}`} key={a.id} className="bg-card rounded-xl border border-border p-6 hover:shadow-lg hover:border-secondary/40 transition-all block">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0 overflow-hidden">
                          {a.avatarUrl || a.avatar_url ? (
                            <img src={a.avatarUrl || a.avatar_url} alt={a.name} className="w-full h-full object-cover" />
                          ) : (
                            a.name[0]
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{a.name}</h3>
                          <p className="text-sm text-secondary font-medium">{a.jobRole || a.job_role}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Building2 className="h-3 w-3" /> {a.company} • {a.packageAmount ?? a.package ?? 0} LPA
                          </div>
                        </div>
                        <Badge variant={a.available ? "default" : "secondary"} className={a.available ? "bg-success text-success-foreground" : ""}>
                          {a.available ? "Available" : "Busy"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">{a.bio}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(a.expertise ?? []).map((e) => (
                          <span key={e} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{e}</span>
                        ))}
                      </div>
                      <Button size="sm" className="w-full mt-4 gradient-accent text-secondary-foreground" disabled={!a.available} onClick={() => handleRequestMentor(a.userId || a.user_id || "", a.name)}>
                        <Send className="h-4 w-4 mr-1" /> Request Mentorship
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
              {!alumniLoading && filteredAlumni.length === 0 && (
                <p className="text-center text-muted-foreground py-12">No mentors found matching your criteria.</p>
              )}
            </>
          )}

          {tab === "jobs" && (
            jobsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {jobs.map((job) => (
                  <div key={job.id} className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">{job.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{job.company}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                        </div>
                      </div>
                      <Badge className={job.type === "Internship" ? "gradient-warm text-accent-foreground" : "gradient-accent text-secondary-foreground"}>
                        {job.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">{job.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(job.requirements ?? []).map((r) => (
                        <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{r}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">Posted {new Date(job.createdAt || job.created_at || "").toLocaleDateString()}</span>
                      <Button
                        size="sm"
                        className="gradient-accent text-secondary-foreground"
                        onClick={() => {
                          setRefDialog({ open: true, jobId: job.id, jobTitle: job.title });
                          setRefMessage("");
                          setRefFile(null);
                        }}
                      >
                        Request Referral
                      </Button>
                    </div>
                  </div>
                ))}
                {jobs.length === 0 && <p className="text-center text-muted-foreground py-12 col-span-2">No job referrals yet.</p>}
              </div>
            )
          )}
        </div>
      </main>
      <Footer />

      <Dialog open={refDialog.open} onOpenChange={(open) => setRefDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Referral</DialogTitle>
            <DialogDescription>
              Upload your resume and optionally add a short message. The alumni will review and accept/reject.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Job: <span className="text-foreground font-medium">{refDialog.jobTitle || ""}</span>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Resume (required)</div>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setRefFile(e.target.files?.[0] ?? null)}
              />
              <div className="text-xs text-muted-foreground">Accepted: PDF, DOC, DOCX</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Message (optional)</div>
              <Textarea value={refMessage} onChange={(e) => setRefMessage(e.target.value)} placeholder="A short note..." />
            </div>
          </div>

          <DialogFooter>
            <Button
              className="gradient-accent text-secondary-foreground"
              disabled={!refDialog.jobId || !refFile || sendReferral.isPending}
              onClick={async () => {
                if (!refDialog.jobId || !refFile) return;
                await sendReferral.mutateAsync({ jobId: refDialog.jobId, resume: refFile, message: refMessage.trim() || undefined });
                setRefDialog({ open: false });
              }}
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
