import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const formData = await request.formData();
  const title = formData.get("title")?.toString().trim();
  const content = formData.get("content")?.toString().trim();
  const category = formData.get("category")?.toString().trim() || "General";

  if (!title || !content) {
    return NextResponse.redirect(new URL("/forum", request.url));
  }

  try {
    const author = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
    });

    if (author) {
      await prisma.forumPost.create({
        data: {
          title,
          content,
          category,
          authorId: author.id,
        },
      });
    }
  } catch {
    // Ignore write failures on the production SQLite fallback.
  }

  return NextResponse.redirect(new URL(`/forum?category=${encodeURIComponent(category)}`, request.url));
}
