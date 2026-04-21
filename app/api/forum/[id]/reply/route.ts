import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const formData = await request.formData();
  const content = formData.get("content")?.toString().trim();
  const { id } = await params;

  if (!content) {
    return NextResponse.redirect(new URL("/forum", request.url));
  }

  const post = await prisma.forumPost.findUnique({
    where: { id },
  });

  if (!post) {
    return NextResponse.redirect(new URL("/forum", request.url));
  }

  try {
    const author = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
    });

    if (author) {
      await prisma.forumReply.create({
        data: {
          postId: post.id,
          authorId: author.id,
          content,
        },
      });
    }
  } catch {
    // Ignore write failures on the production SQLite fallback.
  }

  return NextResponse.redirect(
    new URL(`/forum?category=${encodeURIComponent(post.category)}`, request.url),
  );
}
