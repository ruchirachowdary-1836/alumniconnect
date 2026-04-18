import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { getSignedInIdentity } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureSeedData } from "@/lib/seed";

export async function POST(request: NextRequest) {
  await ensureSeedData();
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const formData = await request.formData();
  const requestedRole = formData.get("role")?.toString() === "ALUMNI" ? "ALUMNI" : "STUDENT";
  const rollNumber = formData.get("rollNumber")?.toString().trim().toUpperCase();
  const bio = formData.get("bio")?.toString().trim();
  const mentorAreas = formData
    .get("mentorAreas")
    ?.toString()
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const mentorActive = formData.get("mentorActive")?.toString() === "yes";

  if (!rollNumber) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  const { email, fullName } = await getSignedInIdentity();
  const profile = await prisma.userProfile.findUnique({
    where: { rollNumber },
  });

  if (!profile || profile.role !== requestedRole) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (profile.clerkUserId && profile.clerkUserId !== userId) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  await prisma.userProfile.update({
    where: { id: profile.id },
    data: {
      clerkUserId: userId,
      email,
      fullName: fullName || profile.fullName,
      bio: bio || profile.bio,
      mentorAreas:
        requestedRole === "ALUMNI"
          ? mentorAreas?.join(", ") || profile.mentorAreas
          : profile.mentorAreas,
      isMentorActive: requestedRole === "ALUMNI" ? mentorActive : false,
      acceptedGuidelines: true,
    },
  });

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
