import { get, put } from "@vercel/blob";

import type { StoredForumPost, StoredForumReply } from "@/lib/portal-store";

const FORUM_BLOB_PATH = "forum/posts.json";

async function readForumBlobPostsRaw(): Promise<StoredForumPost[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return [];
  }

  try {
    const result = await get(FORUM_BLOB_PATH, { access: "public" });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return [];
    }

    const payload = await new Response(result.stream).text();
    const parsed = JSON.parse(payload) as StoredForumPost[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeForumBlobPosts(posts: StoredForumPost[]) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return false;
  }

  try {
    await put(FORUM_BLOB_PATH, JSON.stringify(posts), {
      access: "public",
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json",
    });

    return true;
  } catch {
    return false;
  }
}

export async function readForumLivePosts() {
  return readForumBlobPostsRaw();
}

export async function appendForumLivePost(post: StoredForumPost) {
  const existing = await readForumBlobPostsRaw();
  const next = [post, ...existing.filter((item) => item.id !== post.id)];
  return writeForumBlobPosts(next);
}

export async function appendForumLiveReply(postId: string, reply: StoredForumReply) {
  const existing = await readForumBlobPostsRaw();
  const next = existing.map((post) =>
    post.id !== postId
      ? post
      : {
          ...post,
          replies: [...post.replies.filter((item) => item.id !== reply.id), reply],
        },
  );

  return writeForumBlobPosts(next);
}
