"use client";

import { useEffect, useState, useTransition } from "react";
import { useEffectEvent } from "react";
import { useRouter } from "next/navigation";
import { useRef } from "react";

import type { ChatViewState } from "@/lib/chat-service";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ChatWorkspace({
  initialView,
  initialWith,
}: {
  initialView: ChatViewState;
  initialWith?: string;
}) {
  const router = useRouter();
  const [view, setView] = useState(initialView);
  const [activeWith, setActiveWith] = useState(initialWith ?? initialView.activeThread?.id ?? "");
  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorText, setErrorText] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadView = useEffectEvent(async (withValue?: string) => {
    const query = withValue ? `?with=${encodeURIComponent(withValue)}` : "";

    try {
      const response = await fetch(`/api/chat${query}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const nextView = (await response.json()) as ChatViewState;
      setView(nextView);

      if (nextView.activeThread?.id && nextView.activeThread.id !== activeWith) {
        setActiveWith(nextView.activeThread.id);
      }
    } catch {
      // Keep the current UI stable if polling fails temporarily.
    }
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadView(activeWith);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [activeWith, loadView]);

  const handleThreadOpen = (threadId: string) => {
    setActiveWith(threadId);
    router.replace(`/chat?with=${threadId}`, { scroll: false });
    startTransition(() => {
      void loadView(threadId);
    });
  };

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!view.activeThread?.id || (!messageText.trim() && !selectedFile)) {
      return;
    }

    setErrorText("");

    try {
      const formData = new FormData();
      formData.append("receiverId", view.activeThread.id);
      formData.append("content", messageText.trim());

      if (selectedFile) {
        if (selectedFile.size > 4_500_000) {
          setErrorText("Please upload files smaller than 4.5 MB.");
          return;
        }
        formData.append("attachment", selectedFile);
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrorText(error?.error || "Unable to send the message right now.");
        return;
      }

      const nextView = (await response.json()) as ChatViewState;
      setView(nextView);
      setMessageText("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      setErrorText("Unable to send the message right now.");
    }
  };

  return (
    <div className="chat-shell">
      <aside className="chat-sidebar">
        <div className="section-header" style={{ marginBottom: 12 }}>
          <div>
            <h3 className="panel-title">Chats</h3>
          </div>
          <span className="tab-pill">{view.threads.length}</span>
        </div>

        {view.threads.map((thread) => (
          <button
            key={thread.profile.id}
            type="button"
            onClick={() => handleThreadOpen(thread.profile.id)}
            className={`chat-list-item ${view.activeThread?.id === thread.profile.id ? "active" : ""}`}
            style={{ width: "100%", textAlign: "left", border: "none", cursor: "pointer" }}
          >
            <strong>{thread.profile.fullName}</strong>
            <p className="small muted" style={{ margin: "6px 0 0" }}>
              {thread.preview}
            </p>
          </button>
        ))}
      </aside>

      <section className="chat-main">
        {view.activeThread ? (
          <>
            <div className="chat-header">
              <strong>{view.activeThread.fullName}</strong>
              <p className="small muted" style={{ margin: "6px 0 0" }}>
                {view.activeThread.company || view.activeThread.branch || view.activeThread.role}
              </p>
            </div>

            <div className="chat-thread">
              {view.activeMessages.length === 0 ? (
                <div className="empty-state" style={{ padding: 0 }}>
                  No messages yet. This accepted mentorship chat is ready to start.
                </div>
              ) : (
                view.activeMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`bubble ${message.senderId === view.profile?.rollNumber ? "me" : "them"}`}
                  >
                    {message.content}
                    {message.attachments?.length ? (
                      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                        {message.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="tab-pill active"
                            style={{ width: "fit-content" }}
                          >
                            {attachment.source === "drive" ? "Drive" : "File"}: {attachment.name}
                          </a>
                        ))}
                      </div>
                    ) : null}
                    <div className="small" style={{ marginTop: 6, opacity: 0.8 }}>
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSend} className="chat-compose">
              <input
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                name="content"
                placeholder="Type a message..."
              />
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] ?? null);
                  setErrorText("");
                }}
              />
              <button
                type="button"
                className="button button-ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                Attach
              </button>
              <button className="button button-secondary" type="submit" disabled={isPending}>
                {isPending ? "Sending..." : "Send"}
              </button>
            </form>

            {selectedFile ? (
              <div className="comment-box" style={{ marginTop: 12 }}>
                <strong>Attached:</strong> {selectedFile.name}
                <div className="split-actions" style={{ marginTop: 10 }}>
                  <span className="small muted">{Math.max(1, Math.round(selectedFile.size / 1024))} KB</span>
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : null}

            {errorText ? (
              <p className="small" style={{ marginTop: 10, color: "#b42318" }}>
                {errorText}
              </p>
            ) : null}
          </>
        ) : (
          <div className="empty-state">
            Chat opens automatically after a mentorship request is accepted by the alumni mentor.
          </div>
        )}
      </section>
    </div>
  );
}
