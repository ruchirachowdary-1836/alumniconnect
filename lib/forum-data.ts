import { prisma } from "@/lib/db";
import { forumPosts as fallbackForumPosts } from "@/lib/demo-content";
import { readForumLivePosts } from "@/lib/forum-live-store";
import { readPortalForumPosts } from "@/lib/portal-store";

export const forumCategories = [
  "All",
  "General",
  "Placements",
  "Interview Tips",
  "Career Advice",
  "Campus Life",
] as const;

export type ForumCategory = (typeof forumCategories)[number];

export type ForumBoardPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  author: { fullName: string; role: string };
  replies: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: { fullName: string; role?: string };
  }>;
};

export async function getForumPosts(category: string = "All"): Promise<ForumBoardPost[]> {
  let posts: ForumBoardPost[] = [];

  try {
    const dbPosts = await prisma.forumPost.findMany({
      where: category === "All" ? undefined : { category },
      include: {
        author: true,
        replies: {
          include: { author: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    posts = dbPosts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      createdAt: post.createdAt.toISOString(),
      author: { fullName: post.author.fullName, role: post.author.role },
      replies: post.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt.toISOString(),
        author: { fullName: reply.author.fullName, role: reply.author.role },
      })),
    }));
  } catch {
    posts = fallbackForumPosts
      .filter((post) => category === "All" || post.category === category)
      .map((post, index) => ({
        id: `fallback-post-${index}`,
        title: post.title,
        content: post.summary,
        category: post.category,
        createdAt: new Date(post.date).toISOString(),
        author: { fullName: post.author, role: post.author === "Admin" ? "ADMIN" : "ALUMNI" },
        replies: post.replies.map((reply, replyIndex) => ({
          id: `fallback-post-${index}-reply-${replyIndex}`,
          content: reply,
          createdAt: new Date(post.date).toISOString(),
          author: { fullName: "Community Reply" },
        })),
      }));
  }

  const portalPosts = (await readPortalForumPosts())
    .filter((post) => category === "All" || post.category === category)
    .map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      createdAt: post.createdAt,
      author: { fullName: post.author.fullName, role: post.author.role },
      replies: post.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        author: { fullName: reply.author.fullName, role: reply.author.role },
      })),
    }));

  const livePosts = (await readForumLivePosts())
    .filter((post) => category === "All" || post.category === category)
    .map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      createdAt: post.createdAt,
      author: { fullName: post.author.fullName, role: post.author.role },
      replies: post.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        author: { fullName: reply.author.fullName, role: reply.author.role },
      })),
    }));

  const postIds = new Set(posts.map((post) => post.id));
  const merged = [
    ...posts,
    ...portalPosts.filter((post) => !postIds.has(post.id)),
    ...livePosts.filter((post) => !postIds.has(post.id) && !portalPosts.some((item) => item.id === post.id)),
  ];

  return merged.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}
