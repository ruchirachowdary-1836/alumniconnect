import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { getSignedInIdentity } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { appendPortalReferralRequest, readPortalOpportunities } from "@/lib/portal-store";
import { studentSeed } from "@/lib/seed-data";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const { email, fullName } = await getSignedInIdentity();

  if (!userId) {
    return NextResponse.redirect(new URL("/student/login", request.url));
  }

  const formData = await request.formData();
  const opportunityId = formData.get("opportunityId")?.toString().trim();

  if (!opportunityId) {
    return NextResponse.redirect(new URL("/opportunities", request.url));
  }

  let student = null;

  try {
    student = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
    });

    if (!student && email) {
      student = await prisma.userProfile.findUnique({
        where: { email },
      });
    }
  } catch {
    student = null;
  }

  const fallbackStudent = studentSeed.find((item) => item.name === fullName || item.rollNumber === student?.rollNumber);
  const studentName = student?.fullName || fullName || fallbackStudent?.name || "Student";
  const studentRollNumber =
    student?.rollNumber ||
    fallbackStudent?.rollNumber ||
    `STUDENT-${userId.slice(0, 8).toUpperCase()}`;
  const studentEmail = student?.email || email || "";

  if (!studentEmail) {
    return NextResponse.redirect(new URL("/opportunities?signin=1", request.url));
  }

  const opportunities = await readPortalOpportunities();
  const opportunity = opportunities.find((item) => item.id === opportunityId);

  if (!opportunity) {
    return NextResponse.redirect(new URL("/opportunities", request.url));
  }

  await appendPortalReferralRequest({
    id: `ref-${crypto.randomUUID()}`,
    opportunityId: opportunity.id,
    opportunityTitle: opportunity.title,
    company: opportunity.company,
    studentName,
    studentRollNumber,
    studentEmail,
    alumniName: opportunity.postedByName,
    alumniRollNumber: opportunity.postedByRollNumber,
    alumniEmail: opportunity.postedByEmail,
    message: `Hi, I am interested in the ${opportunity.title} opportunity at ${opportunity.company}. I would appreciate a referral or further guidance.`,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  });

  return NextResponse.redirect(new URL("/opportunities?referred=1", request.url));
}
