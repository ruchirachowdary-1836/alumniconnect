// Central API client — central REST API client

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

function token() {
  return localStorage.getItem("auth_token");
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const t = token();
  if (t) headers["Authorization"] = `Bearer ${t}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  get:    <T>(p: string)              => req<T>("GET", p),
  post:   <T>(p: string, b: unknown)  => req<T>("POST", p, b),
  patch:  <T>(p: string, b: unknown)  => req<T>("PATCH", p, b),
  delete: <T>(p: string)              => req<T>("DELETE", p),
};

/* ── Auth ── */
export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  approved?: boolean;
  phoneNumber?: string;
  phoneVerified?: boolean;
  challengeId?: string;
  phoneNumberMasked?: string;
  requiresOtp?: boolean;
  phoneVerificationRequired?: boolean;
  devOtp?: string;
  message?: string;
}
export const authApi = {
  register: (d: { name: string; email: string; password: string; phoneNumber: string; role: string }) =>
    api.post<AuthResponse>("/auth/register", d),
  login: (d: { email: string; password: string }) =>
    api.post<AuthResponse>("/auth/login", d),
  googleLogin: (d: { idToken: string }) =>
    api.post<AuthResponse>("/auth/google", d),
  verifyOtp: (d: { challengeId: string; otp: string }) =>
    api.post<AuthResponse>("/auth/verify-otp", d),
  requestPhoneVerification: (d: { phoneNumber: string }) =>
    api.post<AuthResponse>("/auth/phone/request-verification", d),
};

/* ── Profiles ── */
export interface Profile {
  id: string; userId: string; name: string; rollNo?: string; department?: string;
  company?: string; packageAmount?: number; batch?: string; jobRole?: string;
  expertise?: string[]; bio?: string; avatarUrl?: string; available?: boolean;
  email?: string; phoneNumber?: string; phoneVerified?: boolean;
  role?: string;
  // legacy camelCase aliases used by some pages
  job_role?: string; roll_no?: string; avatar_url?: string; user_id?: string;
  package?: number;
}
export const profilesApi = {
  getAll:    () => api.get<Profile[]>("/profiles"),
  getAlumni: () => api.get<Profile[]>("/profiles/alumni"),
  getMe:     () => api.get<Profile>("/profiles/me"),
  getById:   (id: string) => api.get<Profile>(`/profiles/${id}`),
  updateMe:  (d: Partial<Profile>) => api.patch<Profile>("/profiles/me", d),
};

/* ── Admin Users ── */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  approved: boolean;
  createdAt?: string | null;
}

export const adminUsersApi = {
  getPending: () => api.get<AdminUser[]>("/admin/users/pending"),
  approve: (id: string) => api.patch<AdminUser>(`/admin/users/${id}/approve`, {}),
  reject: (id: string) => api.delete<void>(`/admin/users/${id}`),
};

/* ── Chat ── */
export interface ChatThread {
  id: string;
  kind?: string;
  mentorshipRequestId: string;
  referralRequestId?: string;
  studentId: string;
  alumniId: string;
  studentName: string;
  alumniName: string;
  contextTitle?: string;
  createdAt: string;
  lastMessageAt?: string | null;
  lastMessage?: string | null;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export const chatApi = {
  myThreads: () => api.get<ChatThread[]>("/chats"),
  fromMentorship: (mentorshipId: string) => api.post<ChatThread>(`/chats/from-mentorship/${mentorshipId}`, {}),
  fromReferral: (referralRequestId: string) => api.post<ChatThread>(`/chats/from-referral/${referralRequestId}`, {}),
  messages: (threadId: string) => api.get<ChatMessage[]>(`/chats/${threadId}/messages`),
  send: (threadId: string, content: string) => api.post<ChatMessage>(`/chats/${threadId}/messages`, { content }),
};

/* ── Jobs ── */
export interface Job {
  id: string; title: string; company: string; location: string; type: string;
  description?: string; requirements?: string[]; status: string; postedBy: string;
  createdAt: string; updatedAt: string;
  // legacy snake_case used by some pages
  created_at?: string; posted_by?: string;
}
export const jobsApi = {
  getAll:       () => api.get<Job[]>("/jobs"),
  getById:      (id: string) => api.get<Job>(`/jobs/${id}`),
  create:       (d: unknown) => api.post<Job>("/jobs", d),
  updateStatus: (id: string, status: string) => api.patch<Job>(`/jobs/${id}/status`, { status }),
  delete:       (id: string) => api.delete<void>(`/jobs/${id}`),
};

async function reqForm<T>(method: string, path: string, form: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  const t = token();
  if (t) headers["Authorization"] = `Bearer ${t}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: form });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data as T;
}

/* ── Job Referral Requests ── */
export interface JobReferralRequest {
  id: string;
  jobId: string;
  studentId: string;
  alumniId: string;
  jobTitle?: string;
  jobCompany?: string;
  studentName?: string;
  studentRollNo?: string;
  message?: string;
  resumeFileName?: string;
  resumeContentType?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export const referralRequestsApi = {
  createForJob: (jobId: string, resume: File, message?: string) => {
    const fd = new FormData();
    fd.append("resume", resume);
    if (message) fd.append("message", message);
    return reqForm<JobReferralRequest>("POST", `/jobs/${jobId}/referral-requests`, fd);
  },
  mineAsStudent: () => api.get<JobReferralRequest[]>("/referral-requests/student"),
  mineAsAlumni: () => api.get<JobReferralRequest[]>("/referral-requests/alumni"),
  updateStatus: (id: string, status: "accepted" | "rejected") =>
    api.patch<JobReferralRequest>(`/referral-requests/${id}/status`, { status }),
  downloadResume: async (id: string) => {
    const headers: Record<string, string> = {};
    const t = token();
    if (t) headers["Authorization"] = `Bearer ${t}`;
    const res = await fetch(`${BASE}/referral-requests/${id}/resume`, { method: "GET", headers });
    if (!res.ok) {
      try {
        const data = await res.json();
        throw new Error(data?.message || `HTTP ${res.status}`);
      } catch {
        throw new Error(`HTTP ${res.status}`);
      }
    }
    const blob = await res.blob();
    const cd = res.headers.get("content-disposition") || "";
    const m = /filename=\"?([^\";]+)\"?/i.exec(cd);
    const fileName = m?.[1] || "resume";
    return { blob, fileName };
  },
};

/* ── Mentorship ── */
export interface MentorshipRequest {
  id: string; studentId: string; alumniId: string; message?: string;
  status: string; createdAt: string; updatedAt: string;
  studentName?: string;
  studentEmail?: string;
  studentPhoneNumber?: string;
  studentPhoneVerified?: boolean;
  studentRollNo?: string;
  studentDepartment?: string;
  studentBatch?: string;
  studentAvatarUrl?: string;
  alumniEmail?: string;
  alumniPhoneNumber?: string;
  alumniPhoneVerified?: boolean;
  // legacy snake_case
  student_id?: string; alumni_id?: string; created_at?: string;
}
export const mentorshipApi = {
  getMyRequests: () => api.get<MentorshipRequest[]>("/mentorship"),
  create:        (d: { alumniId: string; message?: string }) => api.post<MentorshipRequest>("/mentorship", d),
  updateStatus:  (id: string, status: string) => api.patch<MentorshipRequest>(`/mentorship/${id}/status`, { status }),
};

/* ── Events ── */
export interface Event {
  id: string; title: string; description?: string; eventType: string;
  eventDate: string; location?: string; link?: string; createdBy: string; createdAt: string;
  // legacy snake_case
  event_type?: string; event_date?: string; created_by?: string;
}
export const eventsApi = {
  getAll:  () => api.get<Event[]>("/events"),
  getById: (id: string) => api.get<Event>(`/events/${id}`),
  create:  (d: unknown) => api.post<Event>("/events", d),
  delete:  (id: string) => api.delete<void>(`/events/${id}`),
};

/* ── Discussions ── */
export interface DiscussionReply {
  id: string; postId: string; content: string; authorId: string;
  authorName: string; createdAt: string;
  author_id?: string; created_at?: string;
}
export interface DiscussionPost {
  id: string; title: string; content: string; category: string;
  authorId: string; authorName: string; createdAt: string; updatedAt: string;
  replies?: DiscussionReply[];
  author_id?: string; created_at?: string;
}
export const discussionsApi = {
  getAll:      () => api.get<DiscussionPost[]>("/discussions"),
  getById:     (id: string) => api.get<DiscussionPost>(`/discussions/${id}`),
  create:      (d: { title: string; content: string; category?: string }) =>
    api.post<DiscussionPost>("/discussions", d),
  createReply: (postId: string, d: { content: string }) =>
    api.post<DiscussionReply>(`/discussions/${postId}/replies`, d),
  delete:      (id: string) => api.delete<void>(`/discussions/${id}`),
};

/* ── Stories ── */
export interface SuccessStory {
  id: string; profileId: string; title: string; story: string;
  achievement?: string; isFeatured?: boolean; createdAt: string;
}
export const storiesApi = {
  getAll:      () => api.get<SuccessStory[]>("/stories"),
  getFeatured: () => api.get<SuccessStory[]>("/stories/featured"),
  create:      (d: { title: string; story: string; achievement?: string }) =>
    api.post<SuccessStory>("/stories", d),
  setFeatured: (id: string, featured: boolean) =>
    api.patch<SuccessStory>(`/stories/${id}/featured`, { featured }),
};
