import { NextRequest, NextResponse } from "next/server";

import { getAdminAccess } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { getForumPosts } from "@/lib/forum-data";
import { deletePortalForumPost, readPortalForumPosts } from "@/lib/portal-store";

function wantsJson(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";

  return accept.includes("application/json") || contentType.includes("application/json");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminAccess = await getAdminAccess();

  if (!adminAccess.isAdmin) {
    return wantsJson(request)
      ? NextResponse.json({ error: "Only faculty can delete discussions." }, { status: 403 })
      : NextResponse.redirect(new URL("/forum", request.url));
  }

  const { id } = await params;
  const portalPost = (await readPortalForumPosts()).find((item) => item.id === id);

  try {
    await prisma.forumPost.delete({
      where: { id },
    });
  } catch {
    // Ignore DB delete failures and still remove the metadata-backed post.
  }

  await deletePortalForumPost(id);

  const category = portalPost?.category ?? "General";
  if (wantsJson(request)) {
    const posts = await getForumPosts(category);
    return NextResponse.json({ posts });
  }

  return NextResponse.redirect(new URL(`/forum?category=${encodeURIComponent(category)}`, request.url));
}
