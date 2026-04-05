import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi, type ChatMessage, type ChatThread } from "@/integrations/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";
import { toast } from "sonner";

function fmtTime(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const threadsQ = useQuery({
    queryKey: ["chat-threads"],
    queryFn: () => chatApi.myThreads(),
  });

  const activeThreadId = threadId || (threadsQ.data?.[0]?.id ?? "");
  const activeThread: ChatThread | undefined = useMemo(
    () => (threadsQ.data ?? []).find((t) => t.id === activeThreadId) ?? (threadsQ.data?.[0] ?? undefined),
    [threadsQ.data, activeThreadId],
  );

  const messagesQ = useQuery({
    queryKey: ["chat-messages", activeThread?.id],
    queryFn: () => chatApi.messages(activeThread!.id),
    enabled: !!activeThread?.id,
    refetchInterval: 2000,
  });

  const send = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => chatApi.send(id, content),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["chat-messages", activeThread?.id] });
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to send message"),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQ.data?.length]);

  useEffect(() => {
    if (!threadId && activeThread?.id) navigate(`/chat/${activeThread.id}`, { replace: true });
  }, [threadId, activeThread?.id, navigate]);

  const myId = user?.id;

  const otherName = activeThread
    ? (activeThread.studentId === myId ? activeThread.alumniName : activeThread.studentName)
    : "";

  const handleSend = async () => {
    if (!activeThread?.id) return;
    const msg = draft.trim();
    if (!msg) return;
    await send.mutateAsync({ id: activeThread.id, content: msg });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/20">
        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Thread list */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Chats</h2>
                <Badge variant="outline">{(threadsQ.data ?? []).length}</Badge>
              </div>

              {threadsQ.isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
                </div>
              ) : (threadsQ.data ?? []).length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">
                  No chats yet. A chat appears once a mentorship request is approved.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {(threadsQ.data ?? []).map((t) => {
                    const isActive = t.id === activeThread?.id;
                    const title = t.studentId === myId ? t.alumniName : t.studentName;
                    return (
                      <button
                        key={t.id}
                        className={`w-full text-left p-4 hover:bg-muted/30 transition-colors ${isActive ? "bg-muted/40" : ""}`}
                        onClick={() => navigate(`/chat/${t.id}`)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {t.lastMessage ? t.lastMessage : "No messages yet"}
                            </div>
                          </div>
                          <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {t.lastMessageAt ? fmtTime(t.lastMessageAt) : ""}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chat window */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden flex flex-col min-h-[520px]">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold">{activeThread ? otherName : "Chat"}</h2>
                  {activeThread?.contextTitle && (
                    <div className="text-xs text-muted-foreground mt-0.5">{activeThread.contextTitle}</div>
                  )}
                  <p className="text-xs text-muted-foreground">Messages are stored and synced via the backend.</p>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                {messagesQ.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                  </div>
                ) : (messagesQ.data ?? []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {activeThread ? "Start the conversation." : "Select a chat from the left."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(messagesQ.data ?? []).map((m: ChatMessage) => {
                      const mine = m.senderId === myId;
                      return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                            <div className={`text-[11px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {fmtTime(m.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                >
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={activeThread ? "Type a message..." : "Select a chat first"}
                    disabled={!activeThread?.id || send.isPending}
                  />
                  <Button type="submit" className="gradient-accent text-secondary-foreground" disabled={!activeThread?.id || send.isPending}>
                    <Send className="h-4 w-4" /> Send
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
