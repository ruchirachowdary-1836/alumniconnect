import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { profilesApi } from "@/integrations/api/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Save, ShieldCheck, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";

export default function StudentProfile() {
  const { user, requestPhoneVerification, verifyOtp } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    department: "",
    batch: "",
    rollNo: "",
    bio: "",
    avatarUrl: "",
    phoneNumber: "",
    phoneVerified: false,
  });
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneChallengeId, setPhoneChallengeId] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | undefined>();

  useEffect(() => {
    if (!user) return;
    profilesApi.getMe()
      .then((data) => {
        setProfile({
          name: data.name || "",
          department: data.department || "",
          batch: data.batch || "",
          rollNo: data.rollNo || data.roll_no || "",
          bio: data.bio || "",
          avatarUrl: data.avatarUrl || data.avatar_url || "",
          phoneNumber: data.phoneNumber || "",
          phoneVerified: data.phoneVerified ?? false,
        });
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (!profile.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      await profilesApi.updateMe({
        name: profile.name.trim(),
        department: profile.department.trim(),
        batch: profile.batch.trim(),
        rollNo: profile.rollNo.trim(),
        bio: profile.bio.trim(),
        avatarUrl: profile.avatarUrl,
      });
      toast.success("Profile updated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (file?: File | null) => {
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
        <main className="flex-1 container py-12"><Skeleton className="h-[520px] rounded-xl" /></main>
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
            <Link to="/student" className="inline-flex items-center gap-1 text-primary-foreground/70 hover:text-primary-foreground text-sm mb-3 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="font-display text-3xl font-bold text-primary-foreground">Edit Profile</h1>
            <p className="text-primary-foreground/70 mt-1">Manage your student details, phone verification, and profile photo</p>
          </div>
        </div>

        <div className="container py-8 max-w-2xl">
          <div className="bg-card rounded-xl border border-border p-8 space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-3xl flex-shrink-0 overflow-hidden">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile.name[0] || <UserRound className="h-8 w-8" />
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="mt-1" />
                <Label htmlFor="avatar" className="inline-flex items-center gap-2 mt-3 cursor-pointer text-sm text-secondary">
                  <Upload className="h-4 w-4" /> Upload Profile Picture
                </Label>
                <Input id="avatar" type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e.target.files?.[0] ?? null)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Department</Label>
                <Input value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Batch</Label>
                <Input value={profile.batch} onChange={(e) => setProfile({ ...profile, batch: e.target.value })} className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Roll Number</Label>
                <Input value={profile.rollNo} onChange={(e) => setProfile({ ...profile, rollNo: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div>
              <Label>Bio</Label>
              <Textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="mt-1" rows={4} />
            </div>

            <div className="rounded-xl border border-border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Phone Verification
                  </h3>
                  <p className="text-sm text-muted-foreground">You must verify your phone number before sending mentorship requests.</p>
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
