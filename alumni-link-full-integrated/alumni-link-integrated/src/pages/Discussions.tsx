import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { discussionsApi } from "@/integrations/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MessageSquare, Plus, Clock, User, Send, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const categories = ["general", "placements", "interview-tips", "career-advice", "tech-talk", "campus-life"];

export default function Discussions() {
  const { user, isAuthenticated, userRole } = useAuth();
  const qc = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["discussion-posts"],
    queryFn: () => discussionsApi.getAll(),
  });

  const { data: postDetail } = useQuery({
    queryKey: ["discussion-post-detail", expandedPost],
    queryFn: () => discussionsApi.getById(expandedPost!),
    enabled: !!expandedPost,
  });

  const createPost = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Not authenticated");
      return discussionsApi.create({ title: newTitle, content: newContent, category: newCategory });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discussion-posts"] });
      setNewPostOpen(false);
      setNewTitle("");
      setNewContent("");
      toast.success("Post created!");
    },
    onError: () => toast.error("Failed to create post"),
  });

  const createReply = useMutation({
    mutationFn: () => {
      if (!user || !expandedPost) throw new Error("Not authenticated");
      return discussionsApi.createReply(expandedPost, { content: replyContent });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discussion-post-detail", expandedPost] });
      setReplyContent("");
      toast.success("Reply posted!");
    },
    onError: () => toast.error("Failed to post reply"),
  });

  const deletePost = useMutation({
    mutationFn: (id: string) => discussionsApi.delete(id),
    onSuccess: (_d, id) => {
      toast.success("Discussion deleted");
      qc.invalidateQueries({ queryKey: ["discussion-posts"] });
      if (expandedPost === id) setExpandedPost(null);
    },
    onError: (e: any) => toast.error(e?.message || "Failed to delete discussion"),
  });

  // Backend returns authorName directly
  const getAuthorName = (post: any) => post.authorName || "Anonymous";

  const filtered = selectedCategory === "all" ? posts : posts.filter(p => p.category === selectedCategory);
  const replies = postDetail?.replies ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(175_45%_40%_/_0.15),_transparent_60%)]" />
          <motion.div className="relative container py-16 text-center" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.h1 variants={fadeUp} custom={0} className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
              Discussion Forum
            </motion.h1>
            <motion.p variants={fadeUp} custom={1} className="text-primary-foreground/70 max-w-xl mx-auto">
              Ask questions, share insights, and connect with the community.
            </motion.p>
          </motion.div>
        </section>

        <div className="container py-10">
          <motion.div
            className="flex flex-col sm:flex-row gap-4 mb-8 items-start sm:items-center justify-between"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <div className="flex flex-wrap gap-2">
              <Badge variant={selectedCategory === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedCategory("all")}>All</Badge>
              {categories.map(c => (
                <Badge key={c} variant={selectedCategory === c ? "default" : "outline"} className="cursor-pointer capitalize"
                  onClick={() => setSelectedCategory(c)}>
                  {c.replace("-", " ")}
                </Badge>
              ))}
            </div>
            {isAuthenticated && (
              <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-hero text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> New Post</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create a Discussion</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <Input placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    <Textarea placeholder="What's on your mind?" value={newContent} onChange={e => setNewContent(e.target.value)} rows={4} />
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace("-", " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => createPost.mutate()} disabled={!newTitle.trim() || !newContent.trim() || createPost.isPending} className="w-full">
                      {createPost.isPending ? "Posting..." : "Post Discussion"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </motion.div>

          {isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No discussions yet. Be the first to start one!</p>
            </div>
          ) : (
            <motion.div className="space-y-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              {filtered.map((post, i) => (
                <motion.div key={post.id} variants={fadeUp} custom={i}>
                  <div
                    className={`bg-card rounded-xl border-2 p-6 transition-all cursor-pointer ${expandedPost === post.id ? "border-foreground/30" : "border-border hover:border-foreground/15"}`}
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-display font-bold text-foreground text-lg">{post.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {getAuthorName(post)}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {format(new Date(post.createdAt || post.created_at || Date.now()), "PP")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="capitalize text-xs">{post.category.replace("-", " ")}</Badge>
                        {userRole === "admin" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-9 w-9"
                                onClick={(e) => e.stopPropagation()}
                                disabled={deletePost.isPending}
                                aria-label="Delete discussion"
                                title="Delete discussion"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this discussion?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove the post. Replies may also be removed depending on server behavior.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletePost.mutate(post.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{post.content}</p>

                    {expandedPost === post.id && (
                      <div className="mt-6 pt-4 border-t border-border space-y-4" onClick={e => e.stopPropagation()}>
                        {replies.length > 0 ? (
                          replies.map(r => (
                            <div key={r.id} className="bg-muted/40 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <User className="h-3.5 w-3.5" /> {r.authorName || "Anonymous"}
                                <span>· {format(new Date(r.createdAt || r.created_at || Date.now()), "PP")}</span>
                              </div>
                              <p className="text-sm text-foreground">{r.content}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">No replies yet.</p>
                        )}

                        {isAuthenticated && (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Write a reply..."
                              value={replyContent}
                              onChange={e => setReplyContent(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && replyContent.trim() && createReply.mutate()}
                            />
                            <Button size="icon" onClick={() => replyContent.trim() && createReply.mutate()} disabled={createReply.isPending}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
