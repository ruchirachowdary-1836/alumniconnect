import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { sendMentorshipStatusEmail } from "@/lib/email";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const alumni = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
  });

  if (!alumni || alumni.role !== "ALUMNI") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const formData = await request.formData();
  const status = formData.get("status")?.toString() === "ACCEPTED" ? "ACCEPTED" : "REJECTED";
  const responseMessage = formData.get("responseMessage")?.toString().trim();
  const { id } = await params;

  const mentorshipRequest = await prisma.mentorshipRequest.findUnique({
    where: { id },
    include: { student: true, alumni: true },
  });

  if (!mentorshipRequest || mentorshipRequest.alumniId !== alumni.id) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const updatedRequest = await prisma.mentorshipRequest.update({
    where: { id: mentorshipRequest.id },
    data: {
      status,
      alumniResponseMessage: responseMessage || null,
    },
    include: { student: true, alumni: true },
  });

  if (updatedRequest.student.email) {
    await sendMentorshipStatusEmail({
      studentEmail: updatedRequest.student.email,
      studentName: updatedRequest.student.fullName,
      alumniName: updatedRequest.alumni.fullName,
      subject: updatedRequest.subject,
      status,
      responseMessage,
    });
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
