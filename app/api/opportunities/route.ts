import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { getSignedInIdentity } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { appendPortalOpportunity } from "@/lib/portal-store";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/alumni/login", request.url));
  }

  const formData = await request.formData();
  const title = formData.get("title")?.toString().trim();
  const company = formData.get("company")?.toString().trim();
  const type = formData.get("type")?.toString().trim() || "Job";
  const location = formData.get("location")?.toString().trim() || "Remote";
  const description = formData.get("description")?.toString().trim();
  const applyLink = formData.get("applyLink")?.toString().trim() || "";

  if (!title || !company || !description) {
    return NextResponse.redirect(new URL("/opportunities", request.url));
  }

  const { email, fullName } = await getSignedInIdentity();
  let alumni = null;

  try {
    alumni = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
    });

    if (!alumni && email) {
      alumni = await prisma.userProfile.findUnique({
        where: { email },
      });
    }
  } catch {
    alumni = null;
  }

  const postedByName = alumni?.fullName || fullName || "Alumni Mentor";
  const postedByEmail = alumni?.email || email || "";
  const postedByRollNumber = alumni?.rollNumber || `ALUMNI-${userId.slice(0, 8).toUpperCase()}`;

  await appendPortalOpportunity({
    id: `opp-${crypto.randomUUID()}`,
    title,
    company,
    type,
    location,
    description,
    applyLink,
    postedByName,
    postedByEmail,
    postedByRollNumber,
    createdAt: new Date().toISOString(),
    status: "OPEN",
  });

  return NextResponse.redirect(new URL("/opportunities?posted=1", request.url));
}
