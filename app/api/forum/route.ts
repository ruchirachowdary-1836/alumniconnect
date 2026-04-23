import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { getCurrentProfile, getSignedInIdentity } from "@/lib/auth";
import { getAdminAccess } from "@/lib/admin-auth";
import { resolveChatProfile } from "@/lib/chat-service";
import { prisma } from "@/lib/db";
import { getForumPosts } from "@/lib/forum-data";
import { appendForumLivePost } from "@/lib/forum-live-store";
import { appendPortalForumPost } from "@/lib/portal-store";
import { extractInstitutionRollNumber, inferNameFromEmail } from "@/lib/identity";

function wantsJson(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";

  return accept.includes("application/json") || contentType.includes("application/json");
}

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") || "All";
  const posts = await getForumPosts(category);

  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return wantsJson(request)
      ? NextResponse.json({ error: "Please sign in to post in the forum." }, { status: 401 })
      : NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const formData = await request.formData();
  const title = formData.get("title")?.toString().trim();
  const content = formData.get("content")?.toString().trim();
  const category = formData.get("category")?.toString().trim() || "General";

  if (!title || !content) {
    return wantsJson(request)
      ? NextResponse.json({ error: "Title and content are required." }, { status: 400 })
      : NextResponse.redirect(new URL("/forum", request.url));
  }

  let storedSuccessfully = false;

  try {
    const author = (await getCurrentProfile()) ?? (await resolveChatProfile());
    const adminAccess = await getAdminAccess();
    const { email, fullName } = await getSignedInIdentity();
    const inferredRollNumber = extractInstitutionRollNumber(email);
    const inferredRole =
      adminAccess.isAdmin ? "FACULTY" : inferredRollNumber?.startsWith("22") || inferredRollNumber?.startsWith("23") ? "STUDENT" : "COMMUNITY";
    const effectiveAuthor =
      author ??
      (email
        ? {
            id: `forum-user-${inferredRollNumber || "email"}`,
            fullName: fullName || inferNameFromEmail(email) || inferredRollNumber || "Community Member",
            role: inferredRole,
            rollNumber: inferredRollNumber || "COMMUNITY",
            email,
          }
        : adminAccess.isAdmin
          ? {
              id: "faculty-forum",
              fullName: fullName || email || "Faculty Admin",
              role: "FACULTY",
              rollNumber: "FACULTY",
              email,
            }
          : null);

    if (!effectiveAuthor) {
      return wantsJson(request)
        ? NextResponse.json({ error: "Unable to resolve your forum identity." }, { status: 400 })
        : NextResponse.redirect(new URL("/forum", request.url));
    }

    const postId = `forum-${crypto.randomUUID()}`;

    const forumPost = {
      id: postId,
      title,
      content,
      category,
      createdAt: new Date().toISOString(),
      author: {
        fullName: effectiveAuthor.fullName,
        role: effectiveAuthor.role,
        rollNumber: effectiveAuthor.rollNumber,
        email: effectiveAuthor.email ?? undefined,
      },
      replies: [],
    };

    const liveStored = await appendForumLivePost(forumPost);
    const portalStored = await appendPortalForumPost(forumPost);
    storedSuccessfully = liveStored || portalStored;

    if (author) {
      try {
        await prisma.forumPost.create({
          data: {
            id: postId,
            title,
            content,
            category,
            authorId: author.id,
          },
        });
        storedSuccessfully = true;
      } catch {
        // Keep metadata-backed success as sufficient for production.
      }
    }
  } catch {
    storedSuccessfully = false;
  }

  if (!storedSuccessfully) {
    return wantsJson(request)
      ? NextResponse.json({ error: "Unable to publish the post right now." }, { status: 500 })
      : NextResponse.redirect(new URL("/forum", request.url));
  }

  if (wantsJson(request)) {
    const posts = await getForumPosts(category);
    return NextResponse.json({ posts });
  }

  return NextResponse.redirect(new URL(`/forum?category=${encodeURIComponent(category)}`, request.url));
}
