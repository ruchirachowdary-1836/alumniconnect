"use client";
import { useEffect, useState, useTransition } from "react";
import { useEffectEvent } from "react";
import { useRouter } from "next/navigation";

import type { ForumBoardPost } from "@/lib/forum-data";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type ViewerProfile = {
  fullName: string;
  role: string;
};

export function ForumBoard({
  initialPosts,
  categories,
  activeCategory,
  profile,
  isAdmin,
}: {
  initialPosts: ForumBoardPost[];
  categories: readonly string[];
  activeCategory: string;
  profile: ViewerProfile | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState(activeCategory === "All" ? "General" : activeCategory);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [errorText, setErrorText] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadPosts = useEffectEvent(async () => {
    try {
      const query =
        activeCategory === "All" ? "" : `?category=${encodeURIComponent(activeCategory)}`;
      const response = await fetch(`/api/forum${query}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { posts: ForumBoardPost[] };
      setPosts(data.posts);
    } catch {
      // Keep the current forum visible if polling fails briefly.
    }
  });

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadPosts();
    }, 3000);

    return () => window.clearInterval(timer);
  }, [loadPosts]);

  const handleCategoryChange = (category: string) => {
    router.replace(category === "All" ? "/forum" : `/forum?category=${encodeURIComponent(category)}`);
  };

  const handlePublishPost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      return;
    }

    setErrorText("");

    try {
      const formData = new FormData();
      formData.append("title", newTitle.trim());
      formData.append("content", newContent.trim());
      formData.append("category", newCategory);

      const response = await fetch("/api/forum", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrorText(error?.error || "Unable to publish the post right now.");
        return;
      }

      const data = (await response.json()) as { posts: ForumBoardPost[] };
      setPosts(data.posts);
      setNewTitle("");
      setNewContent("");
      startTransition(() => {
        handleCategoryChange(newCategory);
      });
    } catch {
      setErrorText("Unable to publish the post right now.");
    }
  };

  const handleReply = async (postId: string) => {
    const content = replyDrafts[postId]?.trim();
    if (!content) {
      return;
    }

    setErrorText("");

    try {
      const formData = new FormData();
      formData.append("content", content);

      const response = await fetch(`/api/forum/${postId}/reply`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrorText(error?.error || "Unable to send the reply right now.");
        return;
      }

      const data = (await response.json()) as { posts: ForumBoardPost[] };
      setPosts(data.posts);
      setReplyDrafts((current) => ({ ...current, [postId]: "" }));
    } catch {
      setErrorText("Unable to send the reply right now.");
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const response = await fetch(`/api/forum/${postId}/delete`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrorText(error?.error || "Unable to delete the discussion right now.");
        return;
      }

      const data = (await response.json()) as { posts: ForumBoardPost[] };
      setPosts(data.posts);
    } catch {
      setErrorText("Unable to delete the discussion right now.");
    }
  };

  return (
    <>
      <div className="section-header">
        <div className="tab-row">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryChange(category)}
              className={`tab-pill ${activeCategory === category ? "active" : ""}`}
              style={{ border: "none", cursor: "pointer" }}
            >
              {category}
            </button>
          ))}
        </div>
        {profile ? <span className="tab-pill active">Posting as {profile.fullName}</span> : null}
      </div>

      {profile ? (
        <form onSubmit={handlePublishPost} className="dashboard-panel form-grid" style={{ marginBottom: 18 }}>
          <div className="section-header" style={{ marginBottom: 0 }}>
            <div>
              <h3>Start a new discussion</h3>
              <p className="card-copy">Share a question, placement tip, or a request for advice.</p>
            </div>
          </div>
          <label>
            Title
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              required
              placeholder="Example: Best way to prepare for service-based interviews?"
            />
          </label>
          <label>
            Category
            <select value={newCategory} onChange={(event) => setNewCategory(event.target.value)}>
              {categories
                .filter((category) => category !== "All")
                .map((category) => (
                  <option key={category}>{category}</option>
                ))}
            </select>
          </label>
          <label>
            Content
            <textarea
              value={newContent}
              onChange={(event) => setNewContent(event.target.value)}
              required
              placeholder="Describe your question clearly so alumni and students can respond with useful detail."
            />
          </label>
          <button className="button button-secondary" type="submit" disabled={isPending}>
            {isPending ? "Publishing..." : "Publish post"}
          </button>
        </form>
      ) : null}

      {errorText ? (
        <p className="small" style={{ marginBottom: 14, color: "#b42318" }}>
          {errorText}
        </p>
      ) : null}

      {posts.length === 0 ? (
        <div className="empty-state">No discussions match this category yet.</div>
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
              <div className="tab-row">
                <span className="tab-pill active">{post.category}</span>
                {isAdmin ? (
                  <button className="button button-ghost" type="button" onClick={() => handleDelete(post.id)}>
                    Delete
                  </button>
                ) : null}
              </div>
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
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleReply(post.id);
                }}
                className="form-grid"
                style={{ marginTop: 14 }}
              >
                <label>
                  Add reply
                  <textarea
                    value={replyDrafts[post.id] ?? ""}
                    onChange={(event) =>
                      setReplyDrafts((current) => ({ ...current, [post.id]: event.target.value }))
                    }
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
    </>
  );
}
