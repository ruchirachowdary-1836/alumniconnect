import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { profilesApi } from "@/integrations/api/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, Building2, Briefcase, BookOpen, Upload, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function AlumniProfile() {
  const { user, requestPhoneVerification, verifyOtp } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "", company: "", job_role: "", department: "", batch: "",
    roll_no: "", packageAmount: 0, bio: "", expertise: [] as string[], available: true,
    avatarUrl: "", phoneNumber: "", phoneVerified: false,
  });
  const [expertiseInput, setExpertiseInput] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneChallengeId, setPhoneChallengeId] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | undefined>();

  useEffect(() => {
    if (!user) return;
    profilesApi.getMe().then((data) => {
      if (data) {
        setProfile({
          name: data.name || "",
          company: data.company || "",
          job_role: data.jobRole || data.job_role || "",
          department: data.department || "",
          batch: data.batch || "",
          roll_no: data.rollNo || data.roll_no || "",
          packageAmount: Number(data.packageAmount ?? data.package) || 0,
          bio: data.bio || "",
          expertise: data.expertise || [],
          available: data.available ?? true,
          avatarUrl: data.avatarUrl || data.avatar_url || "",
          phoneNumber: data.phoneNumber || "",
          phoneVerified: data.phoneVerified ?? false,
        });
        setExpertiseInput((data.expertise || []).join(", "));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (!profile.name.trim()) { toast.error("Name is required"); return; }
    if (profile.name.length > 100) { toast.error("Name must be under 100 characters"); return; }
    if (profile.bio.length > 500) { toast.error("Bio must be under 500 characters"); return; }

    setSaving(true);
    const expertise = expertiseInput.split(",").map(e => e.trim()).filter(Boolean).slice(0, 10);

    try {
      await profilesApi.updateMe({
        name: profile.name.trim(),
        company: profile.company.trim(),
        jobRole: profile.job_role.trim(),
        department: profile.department.trim(),
        batch: profile.batch.trim(),
        rollNo: profile.roll_no.trim(),
        packageAmount: profile.packageAmount,
        bio: profile.bio.trim(),
        expertise,
        avatarUrl: profile.avatarUrl,
        available: profile.available,
      });
      toast.success("Profile updated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfile((curr) => ({ ...curr, avatarUrl: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const handleSendPhoneOtp = async () => {
    const { error, challengeId, devOtp: otp } = await requestPhoneVerification(profile.phoneNumber);
    if (error || !challengeId) {
      toast.error(error || "Failed to send OTP");
      return;
    }
    setPhoneChallengeId(challengeId);
    setDevOtp(otp);
    setPhoneOtp("");
    toast.success("OTP sent to your phone number");
  };

  const handleVerifyPhone = async () => {
    if (!phoneChallengeId) {
      toast.error("Request an OTP first");
      return;
    }
    const { error } = await verifyOtp(phoneChallengeId, phoneOtp);
    if (error) {
      toast.error(error);
      return;
    }
    setProfile((curr) => ({ ...curr, phoneVerified: true }));
    setPhoneChallengeId(null);
    setDevOtp(undefined);
    setPhoneOtp("");
    toast.success("Phone number verified");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-12"><Skeleton className="h-[600px] rounded-xl" /></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/20">
        <div className="gradient-hero py-10">
          <div className="container">
            <Link to="/alumni" className="inline-flex items-center gap-1 text-primary-foreground/70 hover:text-primary-foreground text-sm mb-3 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="font-display text-3xl font-bold text-primary-foreground">Edit Profile</h1>
            <p className="text-primary-foreground/70 mt-1">Update your alumni profile information</p>
          </div>
        </div>

        <div className="container py-8 max-w-2xl">
          <div className="bg-card rounded-xl border border-border p-8 space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-3xl flex-shrink-0">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  profile.name[0] || "?"
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your full name" className="mt-1" maxLength={100} />
                <Label htmlFor="avatar" className="inline-flex items-center gap-2 mt-3 cursor-pointer text-sm text-secondary">
                  <Upload className="h-4 w-4" /> Upload Profile Picture
                </Label>
                <Input id="avatar" type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e.target.files?.[0] ?? null)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Company</Label>
                <Input value={profile.company} onChange={e => setProfile({ ...profile, company: e.target.value })}
                  placeholder="Microsoft" className="mt-1" maxLength={100} />
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Job Role</Label>
                <Input value={profile.job_role} onChange={e => setProfile({ ...profile, job_role: e.target.value })}
                  placeholder="Software Engineer" className="mt-1" maxLength={100} />
              </div>
              <div>
                <Label>Department</Label>
                <Input value={profile.department} onChange={e => setProfile({ ...profile, department: e.target.value })}
                  placeholder="CSE(AIML)" className="mt-1" maxLength={50} />
              </div>
              <div>
                <Label>Batch</Label>
                <Input value={profile.batch} onChange={e => setProfile({ ...profile, batch: e.target.value })}
                  placeholder="2020-2024" className="mt-1" maxLength={20} />
              </div>
              <div>
                <Label>Roll No</Label>
                <Input value={profile.roll_no} onChange={e => setProfile({ ...profile, roll_no: e.target.value })}
                  placeholder="20WH1A6601" className="mt-1" maxLength={20} />
              </div>
              <div>
                <Label>Package (LPA)</Label>
                <Input type="number" value={profile.packageAmount}
                  onChange={e => setProfile({ ...profile, packageAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0" className="mt-1" min={0} max={999} step={0.01} />
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Expertise (comma-separated, max 10)</Label>
              <Input value={expertiseInput} onChange={e => setExpertiseInput(e.target.value)}
                placeholder="Cloud Computing, AI/ML, System Design" className="mt-1" maxLength={300} />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {expertiseInput.split(",").map(e => e.trim()).filter(Boolean).slice(0, 10).map(e => (
                  <span key={e} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{e}</span>
                ))}
              </div>
            </div>

            <div>
              <Label>Bio ({profile.bio.length}/500)</Label>
              <Textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell students about yourself and your experience..." className="mt-1" rows={4} maxLength={500} />
            </div>

            <div className="rounded-xl border border-border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Phone Verification
                  </h3>
                  <p className="text-sm text-muted-foreground">Verified phone numbers can be used for direct mentorship contact.</p>
                </div>
                <Badge variant={profile.phoneVerified ? "default" : "secondary"} className={profile.phoneVerified ? "bg-success text-success-foreground" : ""}>
                  {profile.phoneVerified ? "Verified" : "Not verified"}
                </Badge>
              </div>
              <div className="flex gap-3">
                <Input value={profile.phoneNumber} onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value, phoneVerified: false })} placeholder="Mobile number" />
                <Button type="button" variant="outline" onClick={handleSendPhoneOtp}>Send OTP</Button>
              </div>
              {phoneChallengeId && (
                <div className="space-y-3">
                  {devOtp && <p className="text-xs text-secondary">Dev OTP: {devOtp}</p>}
                  <InputOTP maxLength={6} value={phoneOtp} onChange={setPhoneOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <Button type="button" className="gradient-accent text-secondary-foreground" onClick={handleVerifyPhone} disabled={phoneOtp.length !== 6}>
                    Verify Phone
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
              <div>
                <p className="font-medium text-sm">Available for Mentorship</p>
                <p className="text-xs text-muted-foreground">Students will see you as available for requests</p>
              </div>
              <Switch checked={profile.available} onCheckedChange={v => setProfile({ ...profile, available: v })} />
            </div>

            <Button onClick={handleSave} className="w-full gradient-accent text-secondary-foreground font-semibold" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Profile
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
