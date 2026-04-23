import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { getCurrentProfile, getSignedInIdentity } from "@/lib/auth";
import { getAdminAccess } from "@/lib/admin-auth";
import { resolveChatProfile } from "@/lib/chat-service";
import { prisma } from "@/lib/db";
import { getForumPosts } from "@/lib/forum-data";
import { appendForumLivePost, appendForumLiveReply } from "@/lib/forum-live-store";
import { appendPortalForumPost, appendPortalForumReply, readPortalForumPosts } from "@/lib/portal-store";
import { extractInstitutionRollNumber, inferNameFromEmail } from "@/lib/identity";

function wantsJson(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";

  return accept.includes("application/json") || contentType.includes("application/json");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return wantsJson(request)
      ? NextResponse.json({ error: "Please sign in to reply in the forum." }, { status: 401 })
      : NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const formData = await request.formData();
  const content = formData.get("content")?.toString().trim();
  const { id } = await params;

  if (!content) {
    return wantsJson(request)
      ? NextResponse.json({ error: "Reply content is required." }, { status: 400 })
      : NextResponse.redirect(new URL("/forum", request.url));
  }

  let post = null;

  try {
    post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        author: true,
        replies: {
          include: { author: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch {
    post = null;
  }

  const portalPost = (await readPortalForumPosts()).find((item) => item.id === id);

  if (!post && !portalPost) {
    return wantsJson(request)
      ? NextResponse.json({ error: "Discussion not found." }, { status: 404 })
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

    if (!portalPost && post) {
      const mirroredPost = {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        createdAt: post.createdAt.toISOString(),
        author: {
          fullName: post.author.fullName,
          role: post.author.role,
          rollNumber: post.author.rollNumber,
          email: post.author.email ?? undefined,
        },
        replies: post.replies.map((reply) => ({
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt.toISOString(),
          author: {
            fullName: reply.author.fullName,
            role: reply.author.role,
            rollNumber: reply.author.rollNumber,
            email: reply.author.email ?? undefined,
          },
        })),
      };

      await appendForumLivePost(mirroredPost);
      await appendPortalForumPost(mirroredPost);
    }

    const replyId = `forum-reply-${crypto.randomUUID()}`;
    const forumReply = {
      id: replyId,
      content,
      createdAt: new Date().toISOString(),
      author: {
        fullName: effectiveAuthor.fullName,
        role: effectiveAuthor.role,
        rollNumber: effectiveAuthor.rollNumber,
        email: effectiveAuthor.email ?? undefined,
      },
    };

    const liveStored = await appendForumLiveReply(id, forumReply);
    const portalStored = await appendPortalForumReply(id, forumReply);
    storedSuccessfully = liveStored || portalStored;

    if (author && post) {
      try {
        await prisma.forumReply.create({
          data: {
            id: replyId,
            postId: post.id,
            authorId: author.id,
            content,
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
      ? NextResponse.json({ error: "Unable to send the reply right now." }, { status: 500 })
      : NextResponse.redirect(new URL("/forum", request.url));
  }

  const category = post?.category ?? portalPost?.category ?? "General";

  if (wantsJson(request)) {
    const posts = await getForumPosts(category);
    return NextResponse.json({ posts });
  }

  return NextResponse.redirect(new URL(`/forum?category=${encodeURIComponent(category)}`, request.url));
}
