import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { getSignedInIdentity } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readPortalReferralRequests, updatePortalReferralRequest } from "@/lib/portal-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  const { email } = await getSignedInIdentity();

  if (!userId) {
    return NextResponse.redirect(new URL("/alumni/login", request.url));
  }

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

  const formData = await request.formData();
  const status = formData.get("status")?.toString() === "ACCEPTED" ? "ACCEPTED" : "REJECTED";
  const responseMessage = formData.get("responseMessage")?.toString().trim() || null;
  const { id } = await params;

  const referralRequest = (await readPortalReferralRequests()).find((item) => item.id === id);

  if (!referralRequest) {
    return NextResponse.redirect(new URL("/alumni/dashboard", request.url));
  }

  const alumniMatches =
    (alumni && referralRequest.alumniRollNumber === alumni.rollNumber) ||
    (email && referralRequest.alumniEmail?.toLowerCase() === email.toLowerCase());

  if (!alumniMatches) {
    return NextResponse.redirect(new URL("/alumni/dashboard", request.url));
  }

  await updatePortalReferralRequest(id, {
    status,
    alumniResponseMessage: responseMessage,
  });

  return NextResponse.redirect(new URL("/alumni/dashboard", request.url));
}
