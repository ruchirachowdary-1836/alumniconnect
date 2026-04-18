import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { sendMentorshipRequestEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { ensureSeedData } from "@/lib/seed";

export async function POST(request: NextRequest) {
  await ensureSeedData();
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const student = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
  });

  if (!student || student.role !== "STUDENT") {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  const formData = await request.formData();
  const alumniId = formData.get("alumniId")?.toString();
  const subject = formData.get("subject")?.toString().trim();
  const goals = formData.get("goals")?.toString().trim();
  const message = formData.get("message")?.toString().trim();
  const preferredMode = formData.get("preferredMode")?.toString().trim() || "Google Meet";
  const availability = formData.get("availability")?.toString().trim();

  if (!alumniId || !subject || !goals || !message) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const alumni = await prisma.userProfile.findUnique({
    where: { id: alumniId },
  });

  if (!alumni || alumni.role !== "ALUMNI" || !alumni.isMentorActive || !alumni.email) {
    return NextResponse.redirect(new URL("/directory", request.url));
  }

  await prisma.mentorshipRequest.create({
    data: {
      alumniId: alumni.id,
      studentId: student.id,
      subject,
      goals,
      message,
      preferredMode,
      availability,
    },
  });

  await sendMentorshipRequestEmail({
    alumniEmail: alumni.email,
    alumniName: alumni.fullName,
    studentName: student.fullName,
    subject,
    goals,
    message,
  });

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
