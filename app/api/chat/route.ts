import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const sender = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
  });

  if (!sender) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  const formData = await request.formData();
  const receiverId = formData.get("receiverId")?.toString().trim();
  const content = formData.get("content")?.toString().trim();

  if (!receiverId || !content) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  const receiver = await prisma.userProfile.findUnique({
    where: { id: receiverId },
  });

  if (!receiver || receiver.id === sender.id) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  const acceptedRequest = await prisma.mentorshipRequest.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        {
          studentId: sender.id,
          alumniId: receiver.id,
        },
        {
          studentId: receiver.id,
          alumniId: sender.id,
        },
      ],
    },
  });

  if (!acceptedRequest) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  await prisma.chatMessage.create({
    data: {
      senderId: sender.id,
      receiverId: receiver.id,
      content,
    },
  });

  return NextResponse.redirect(new URL(`/chat?with=${receiver.id}`, request.url));
}
