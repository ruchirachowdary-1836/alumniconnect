import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useJobs, useCreateJob } from "@/hooks/useJobs";
import { useMentorRequests, useUpdateMentorRequest } from "@/hooks/useMentorRequests";
import { chatApi, referralRequestsApi } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Briefcase, Check, X, Plus, UserCog, Download } from "lucide-react";
import { toast } from "sonner";

export default function AlumniDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: requests = [], isLoading: reqLoading } = useMentorRequests();
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();
  const qc = useQueryClient();

  const referralQ = useQuery({
    queryKey: ["referral-requests-alumni"],
    queryFn: () => referralRequestsApi.mineAsAlumni(),
    enabled: !!user,
  });

  const updateReferralStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "rejected" }) =>
      referralRequestsApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success("Updated referral request");
      qc.invalidateQueries({ queryKey: ["referral-requests-alumni"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to update request"),
  });
  const updateRequest = useUpdateMentorRequest();
  const createJob = useCreateJob();
  const [tab, setTab] = useState<"requests" | "referrals" | "jobs">("requests");
  const [showPostJob, setShowPostJob] = useState(false);
  const [newJob, setNewJob] = useState({ title: "", company: "", location: "", description: "", requirements: "" });

  const handleApprove = async (id: string) => {
    try {
      await updateRequest.mutateAsync({ id, status: "approved" });
      toast.success("Request approved!");
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateRequest.mutateAsync({ id, status: "rejected" });
      toast.info("Request rejected.");
    } catch {
      toast.error("Failed to reject");
    }
  };

  const handleChat = async (mentorshipId: string) => {
    try {
      const t = await chatApi.fromMentorship(mentorshipId);
      navigate(`/chat/${t.id}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to open chat");
    }
  };

  const handleReferralChat = async (referralRequestId: string) => {
    try {
      const t = await chatApi.fromReferral(referralRequestId);
      navigate(`/chat/${t.id}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to open chat");
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.company || !user) {
      toast.error("Title and company are required");
      return;
    }
    try {
      await createJob.mutateAsync({
        title: newJob.title,
        company: newJob.company,
        location: newJob.location || "Remote",
        type: "Full-time",
        description: newJob.description,
        requirements: newJob.requirements.split(",").map((r) => r.trim()).filter(Boolean),
      });
      setNewJob({ title: "", company: "", location: "", description: "", requirements: "" });
      setShowPostJob(false);
      toast.success("Job posted successfully!");
    } catch {
      toast.error("Failed to post job");
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/20">
        <div className="gradient-hero py-10">
          <div className="container">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold text-primary-foreground">Alumni Dashboard</h1>
                <p className="text-primary-foreground/70 mt-1">Manage mentorship requests and post job referrals</p>
              </div>
              <Link to="/alumni/profile">
                <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  <UserCog className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="flex gap-2 mb-6">
            <Button variant={tab === "requests" ? "default" : "outline"} onClick={() => setTab("requests")} className={tab === "requests" ? "gradient-accent text-secondary-foreground" : ""}>
              <Users className="h-4 w-4 mr-2" /> Requests ({pendingCount})
            </Button>
            <Button variant={tab === "referrals" ? "default" : "outline"} onClick={() => setTab("referrals")} className={tab === "referrals" ? "gradient-accent text-secondary-foreground" : ""}>
              Referrals ({(referralQ.data ?? []).filter((r) => r.status === "pending").length})
            </Button>
            <Button variant={tab === "jobs" ? "default" : "outline"} onClick={() => setTab("jobs")} className={tab === "jobs" ? "gradient-accent text-secondary-foreground" : ""}>
              <Briefcase className="h-4 w-4 mr-2" /> Posted Jobs
            </Button>
          </div>

          {tab === "requests" && (
            reqLoading ? (
              <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req.id} className="bg-card rounded-xl border border-border p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold shrink-0 overflow-hidden">
                          {req.studentAvatarUrl ? (
                            <img src={req.studentAvatarUrl} alt={req.studentName || "Student"} className="w-full h-full object-cover" />
                          ) : (
                            (req.studentName || "S").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate">{req.studentName || "Student"}</h3>
                            {req.studentRollNo && <span className="text-xs text-muted-foreground">({req.studentRollNo})</span>}
                            <Badge variant={req.status === "approved" ? "default" : req.status === "rejected" ? "destructive" : "secondary"} className={req.status === "approved" ? "bg-success text-success-foreground" : ""}>
                              {req.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            {req.studentDepartment && <span>Dept: <span className="text-foreground/90">{req.studentDepartment}</span></span>}
                            {req.studentBatch && <span>Batch: <span className="text-foreground/90">{req.studentBatch}</span></span>}
                            {req.studentEmail && <span className="truncate">Email: <span className="text-foreground/90">{req.studentEmail}</span></span>}
                            {req.studentPhoneNumber && (
                              <span>
                                Phone: <span className="text-foreground/90">{req.studentPhoneNumber}</span>
                                {req.studentPhoneVerified ? " (verified)" : " (unverified)"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {req.message && <p className="text-sm text-muted-foreground mt-3">{req.message}</p>}
                      <p className="text-xs text-muted-foreground mt-2">{new Date(req.createdAt || req.created_at).toLocaleDateString()}</p>
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => handleApprove(req.id)}>
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(req.id)}>
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                    {req.status === "approved" && (
                      <div className="flex gap-2">
                        <Button size="sm" className="gradient-accent text-secondary-foreground" onClick={() => handleChat(req.id)}>
                          Chat
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {requests.length === 0 && <p className="text-center text-muted-foreground py-12">No requests yet.</p>}
              </div>
            )
          )}

          {tab === "jobs" && (
            <>
              <Button className="mb-6 gradient-warm text-accent-foreground" onClick={() => setShowPostJob(!showPostJob)}>
                <Plus className="h-4 w-4 mr-2" /> Post New Job
              </Button>

              {showPostJob && (
                <form onSubmit={handlePostJob} className="bg-card rounded-xl border border-border p-6 mb-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Job Title *</Label><Input value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} placeholder="Software Engineer" className="mt-1" /></div>
                    <div><Label>Company *</Label><Input value={newJob.company} onChange={(e) => setNewJob({ ...newJob, company: e.target.value })} placeholder="Microsoft" className="mt-1" /></div>
                    <div><Label>Location</Label><Input value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} placeholder="Hyderabad" className="mt-1" /></div>
                    <div><Label>Requirements (comma-separated)</Label><Input value={newJob.requirements} onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })} placeholder="React, Node.js" className="mt-1" /></div>
                  </div>
                  <div><Label>Description</Label><Textarea value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} placeholder="Job description..." className="mt-1" /></div>
                  <div className="flex gap-2">
                    <Button type="submit" className="gradient-accent text-secondary-foreground" disabled={createJob.isPending}>Post Job</Button>
                    <Button type="button" variant="outline" onClick={() => setShowPostJob(false)}>Cancel</Button>
                  </div>
                </form>
              )}

              {jobsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{[1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {jobs.map((job) => (
                    <div key={job.id} className="bg-card rounded-xl border border-border p-6">
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                      <p className="text-sm text-muted-foreground mt-2">{job.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(job.requirements ?? []).map((r) => (
                          <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{r}</span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">Posted: {new Date(job.createdAt || job.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "referrals" && (
            referralQ.isLoading ? (
              <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : (
              <div className="space-y-4">
                {(referralQ.data ?? []).map((r) => (
                  <div key={r.id} className="bg-card rounded-xl border border-border p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{r.studentName || "Student"}</h3>
                        {r.studentRollNo && <span className="text-xs text-muted-foreground">({r.studentRollNo})</span>}
                        <Badge
                          variant={r.status === "accepted" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}
                          className={r.status === "accepted" ? "bg-success text-success-foreground" : ""}
                        >
                          {r.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Job: <span className="text-foreground font-medium">{r.jobTitle}</span> {r.jobCompany ? `(${r.jobCompany})` : ""}
                      </p>
                      {r.message && <p className="text-sm text-muted-foreground mt-1">{r.message}</p>}
                      <p className="text-xs text-muted-foreground mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const { blob, fileName } = await referralRequestsApi.downloadResume(r.id);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = fileName;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                          } catch (e: any) {
                            toast.error(e?.message || "Failed to download resume");
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" /> Resume
                      </Button>

                      {r.status === "pending" && (
                        <>
                          <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => updateReferralStatus.mutate({ id: r.id, status: "accepted" })}>
                            <Check className="h-4 w-4 mr-1" /> Accept
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateReferralStatus.mutate({ id: r.id, status: "rejected" })}>
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}

                      {r.status === "accepted" && (
                        <Button size="sm" className="gradient-accent text-secondary-foreground" onClick={() => handleReferralChat(r.id)}>
                          Chat
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {(referralQ.data ?? []).length === 0 && <p className="text-center text-muted-foreground py-12">No referral requests yet.</p>}
              </div>
            )
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
