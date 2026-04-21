import Link from "next/link";

import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { forumPosts as fallbackForumPosts } from "@/lib/demo-content";

const allCategories = [
  "All",
  "General",
  "Placements",
  "Interview Tips",
  "Career Advice",
  "Campus Life",
];

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function ForumPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  let profile = null;

  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null;
  }
  const params = (await searchParams) ?? {};
  const categoryParam = Array.isArray(params.category) ? params.category[0] : params.category;
  const activeCategory =
    categoryParam && allCategories.includes(categoryParam) ? categoryParam : "All";

  let posts: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    createdAt: Date;
    author: { fullName: string; role: string };
    replies: Array<{ id: string; content: string; createdAt: Date; author: { fullName: string } }>;
  }> = [];

  try {
    posts = await prisma.forumPost.findMany({
      where: activeCategory === "All" ? undefined : { category: activeCategory },
      include: {
        author: true,
        replies: {
          include: { author: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    posts = fallbackForumPosts
      .filter((post) => activeCategory === "All" || post.category === activeCategory)
      .map((post, index) => ({
        id: `fallback-post-${index}`,
        title: post.title,
        content: post.summary,
        category: post.category,
        createdAt: new Date(post.date),
        author: { fullName: post.author, role: post.author === "Admin" ? "ADMIN" : "ALUMNI" },
        replies: post.replies.map((reply, replyIndex) => ({
          id: `fallback-post-${index}-reply-${replyIndex}`,
          content: reply,
          createdAt: new Date(post.date),
          author: { fullName: "Community Reply" },
        })),
      }));
  }

  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">Discussion Forum</h1>
          <p className="page-lead">Ask questions, share insights, and connect with the community.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell">
          <div className="section-header">
            <div className="tab-row">
              {allCategories.map((category) => (
                <Link
                  key={category}
                  href={category === "All" ? "/forum" : `/forum?category=${encodeURIComponent(category)}`}
                  className={`tab-pill ${activeCategory === category ? "active" : ""}`}
                >
                  {category}
                </Link>
              ))}
            </div>
            {profile ? (
              <span className="tab-pill active">Posting as {profile.fullName}</span>
            ) : (
              <Link href="/sign-in" className="button button-primary">
                Sign in to post
              </Link>
            )}
          </div>

          {profile ? (
            <form action="/api/forum" method="post" className="dashboard-panel form-grid" style={{ marginBottom: 18 }}>
              <div className="section-header" style={{ marginBottom: 0 }}>
                <div>
                  <h3>Start a new discussion</h3>
                  <p className="card-copy">Share a question, placement tip, or a request for advice.</p>
                </div>
              </div>
              <label>
                Title
                <input name="title" required placeholder="Example: Best way to prepare for service-based interviews?" />
              </label>
              <label>
                Category
                <select name="category" defaultValue={activeCategory === "All" ? "General" : activeCategory}>
                  {allCategories
                    .filter((category) => category !== "All")
                    .map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                </select>
              </label>
              <label>
                Content
                <textarea
                  name="content"
                  required
                  placeholder="Describe your question clearly so alumni and students can respond with useful detail."
                />
              </label>
              <button className="button button-secondary" type="submit">
                Publish post
              </button>
            </form>
          ) : null}

          {posts.length === 0 ? (
            <div className="empty-state">
              No discussions match this category yet.
            </div>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="forum-card">
                <div className="section-header">
                  <div>
                    <h3>{post.title}</h3>
                    <p className="card-copy">
                      {post.author.fullName} ({post.author.role}) - {formatDate(post.createdAt)}
                    </p>
                  </div>
                  <span className="tab-pill active">{post.category}</span>
                </div>

                <p>{post.content}</p>

                {post.replies.map((reply) => (
                  <div key={reply.id} className="comment-box">
                    <strong>{reply.author.fullName}</strong>
                    <p style={{ margin: "8px 0 0" }}>{reply.content}</p>
                    <p className="small muted" style={{ margin: "8px 0 0" }}>
                      {formatDate(reply.createdAt)}
                    </p>
                  </div>
                ))}

                {profile ? (
                  <form
                    action={`/api/forum/${post.id}/reply`}
                    method="post"
                    className="form-grid"
                    style={{ marginTop: 14 }}
                  >
                    <label>
                      Add reply
                      <textarea
                        name="content"
                        required
                        placeholder="Reply with an answer, resource, or encouragement."
                      />
                    </label>
                    <button className="button button-ghost" type="submit">
                      Reply
                    </button>
                  </form>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
}
