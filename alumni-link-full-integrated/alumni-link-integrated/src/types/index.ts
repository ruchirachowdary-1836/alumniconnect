export interface Alumni {
  id: string;
  name: string;
  rollNo: string;
  department: string;
  company: string;
  package: number;
  batch: string;
  role: string;
  expertise: string[];
  bio: string;
  avatar: string;
  available: boolean;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Internship" | "Full-time" | "Part-time";
  postedBy: string;
  postedDate: string;
  description: string;
  requirements: string[];
  status: "open" | "closed";
}

export interface MentorRequest {
  id: string;
  studentName: string;
  studentRoll: string;
  alumniId: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  date: string;
}

export type UserRole = "student" | "alumni" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}
