import { NextRequest, NextResponse } from "next/server";

import { auth, clerkClient } from "@clerk/nextjs/server";

import { getSignedInIdentity } from "@/lib/auth";
import { sendMentorshipStatusEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { readPortalMentorshipRequests, updatePortalMentorshipRequest } from "@/lib/portal-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  const { email } = await getSignedInIdentity();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  let alumni = null;

  try {
    alumni = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
    });
  } catch {
    alumni = null;
  }

  if (!alumni && email) {
    try {
      alumni = await prisma.userProfile.findUnique({
        where: { email },
      });
    } catch {
      alumni = null;
    }

    if (alumni && !alumni.clerkUserId) {
      try {
        alumni = await prisma.userProfile.update({
          where: { id: alumni.id },
          data: { clerkUserId: userId },
        });
      } catch {
        // Keep the matched alumni profile even if Clerk ID sync cannot be persisted.
      }
    }
  }

  if (!alumni || alumni.role !== "ALUMNI") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const formData = await request.formData();
  const status = formData.get("status")?.toString() === "ACCEPTED" ? "ACCEPTED" : "REJECTED";
  const responseMessage = formData.get("responseMessage")?.toString().trim();
  const { id } = await params;

  let mentorshipRequest = null;

  try {
    mentorshipRequest = await prisma.mentorshipRequest.findUnique({
      where: { id },
      include: { student: true, alumni: true },
    });
  } catch {
    mentorshipRequest = null;
  }

  const portalRequest = (await readPortalMentorshipRequests()).find((item) => item.id === id);

  if (!mentorshipRequest || mentorshipRequest.alumniId !== alumni.id) {
    if (portalRequest && portalRequest.alumniRollNumber === alumni.rollNumber) {
      const updatedPortalRequest = await updatePortalMentorshipRequest(id, {
        status,
        alumniResponseMessage: responseMessage || null,
      });

      if (updatedPortalRequest?.studentEmail) {
        try {
          await sendMentorshipStatusEmail({
            studentEmail: updatedPortalRequest.studentEmail,
            studentName: updatedPortalRequest.studentName,
            alumniName: updatedPortalRequest.alumniName,
            subject: updatedPortalRequest.subject,
            status,
            responseMessage,
          });
        } catch {
          // Keep the fallback status update successful even if email delivery fails.
        }
      }

      return NextResponse.redirect(new URL("/alumni/dashboard", request.url));
    }

    if (alumni.clerkUserId) {
      try {
        const client = await clerkClient();
        const alumniUser = await client.users.getUser(alumni.clerkUserId);
        const privateMetadata = (alumniUser.privateMetadata ?? {}) as Record<string, unknown>;
        const inbox = Array.isArray(privateMetadata.alumniInbox)
          ? (privateMetadata.alumniInbox as Array<Record<string, unknown>>)
          : [];
        const nextInbox = inbox.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                alumniResponseMessage: responseMessage || null,
              }
            : item,
        );

        await client.users.updateUserMetadata(alumni.clerkUserId, {
          privateMetadata: {
            ...privateMetadata,
            alumniInbox: nextInbox,
          },
        });

        return NextResponse.redirect(new URL("/alumni/dashboard", request.url));
      } catch {
        return NextResponse.redirect(new URL("/alumni/dashboard", request.url));
      }
    }

    return NextResponse.redirect(new URL("/alumni/dashboard", request.url));
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
    try {
      await sendMentorshipStatusEmail({
        studentEmail: updatedRequest.student.email,
        studentName: updatedRequest.student.fullName,
        alumniName: updatedRequest.alumni.fullName,
        subject: updatedRequest.subject,
        status,
        responseMessage,
      });
    } catch {
      // Keep the accept/reject update successful even if email delivery fails.
    }
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
