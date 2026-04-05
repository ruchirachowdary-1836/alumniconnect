import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "@/integrations/api/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ExternalLink, Clock, Video, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const eventTypeIcons: Record<string, typeof Video> = {
  webinar: Video, workshop: Users, networking: Users, seminar: Calendar,
};

const sampleEvents = [
  { id: "s1", title: "Resume Building Workshop", description: "Learn to craft ATS-friendly resumes with tips from industry professionals.", eventType: "workshop", eventDate: new Date(Date.now() + 7 * 86400000).toISOString(), location: "Online - Zoom", link: "" },
  { id: "s2", title: "Mock Interview Session", description: "Practice technical and HR interviews with alumni from top companies.", eventType: "webinar", eventDate: new Date(Date.now() + 14 * 86400000).toISOString(), location: "Campus Auditorium", link: "" },
  { id: "s3", title: "Tech Talk: AI in Industry", description: "An alumni-led discussion on practical AI/ML applications in enterprise.", eventType: "seminar", eventDate: new Date(Date.now() + 21 * 86400000).toISOString(), location: "Online - Google Meet", link: "" },
  { id: "s4", title: "Alumni Networking Meetup", description: "Connect with fellow alumni and current students over an informal evening session.", eventType: "networking", eventDate: new Date(Date.now() + 30 * 86400000).toISOString(), location: "Campus Cafeteria", link: "" },
];

export default function Events() {
  const { userRole } = useAuth();
  const qc = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => eventsApi.getAll(),
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("webinar");
  const [eventDateLocal, setEventDateLocal] = useState("");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");

  const createEvent = useMutation({
    mutationFn: (payload: { title: string; description?: string; eventType: string; eventDate: string; location?: string; link?: string }) =>
      eventsApi.create(payload),
    onSuccess: () => {
      toast.success("Event created");
      setTitle("");
      setDescription("");
      setEventType("webinar");
      setEventDateLocal("");
      setLocation("");
      setLink("");
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to create event"),
  });

  const deleteEvent = useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: () => {
      toast.success("Event deleted");
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to delete event"),
  });

  // normalise date field (backend returns eventDate)
  const normalised = events.map(e => ({
    ...e,
    eventDate: e.eventDate || e.event_date || "",
    eventType: e.eventType || e.event_type || "webinar",
  }));

  const displayEvents = normalised.length > 0 ? normalised : (userRole === "admin" ? [] : sampleEvents);
  const upcoming = displayEvents.filter(e => new Date(e.eventDate) >= new Date());
  const past = displayEvents.filter(e => new Date(e.eventDate) < new Date());

  const isAdmin = userRole === "admin";
  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    if (!eventType.trim()) return false;
    if (!eventDateLocal.trim()) return false;
    return true;
  }, [title, eventType, eventDateLocal]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(175_45%_40%_/_0.15),_transparent_60%)]" />
          <motion.div className="relative container py-16 text-center" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.h1 variants={fadeUp} custom={0} className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
              Events & Webinars
            </motion.h1>
            <motion.p variants={fadeUp} custom={1} className="text-primary-foreground/70 max-w-xl mx-auto">
              Stay updated with alumni-hosted workshops, networking sessions, and career events.
            </motion.p>
          </motion.div>
        </section>

        <div className="container py-16">
          {isAdmin && (
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <div className="bg-card rounded-2xl border-2 border-border p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-secondary" /> Add Event / Webinar
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create a new event that will be visible to all users.
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-fit">Admin</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Title</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Eg: Alumni Webinar on Product Management" className="mt-2" />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="mt-2 h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="webinar">Webinar</option>
                      <option value="workshop">Workshop</option>
                      <option value="seminar">Seminar</option>
                      <option value="networking">Networking</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Date & time</label>
                    <Input
                      type="datetime-local"
                      value={eventDateLocal}
                      onChange={(e) => setEventDateLocal(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Stored in your local timezone.</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Location</label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Eg: Online (Zoom) / Campus Auditorium" className="mt-2" />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Link</label>
                    <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Eg: https://meet.google.com/..." className="mt-2" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add agenda / speakers / who should attend..." className="mt-2" />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTitle("");
                      setDescription("");
                      setEventType("webinar");
                      setEventDateLocal("");
                      setLocation("");
                      setLink("");
                    }}
                    disabled={createEvent.isPending}
                  >
                    Reset
                  </Button>
                  <Button
                    className="gradient-accent text-secondary-foreground"
                    disabled={!canSubmit || createEvent.isPending}
                    onClick={() => {
                      if (!canSubmit) {
                        toast.error("Please fill title, type, and date/time");
                        return;
                      }

                      const dt = new Date(eventDateLocal);
                      if (Number.isNaN(dt.getTime())) {
                        toast.error("Invalid date/time");
                        return;
                      }

                      createEvent.mutate({
                        title: title.trim(),
                        description: description.trim() || undefined,
                        eventType,
                        eventDate: dt.toISOString(),
                        location: location.trim() || undefined,
                        link: link.trim() || undefined,
                      });
                    }}
                  >
                    {createEvent.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div className="mb-12" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.h2 variants={fadeUp} custom={0} className="text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-secondary" /> Upcoming Events
            </motion.h2>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
              </div>
            ) : upcoming.length > 0 ? (
              <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-5" variants={staggerContainer}>
                {upcoming.map((event, i) => {
                  const Icon = eventTypeIcons[event.eventType] || Calendar;
                  return (
                    <motion.div key={event.id} variants={fadeUp} custom={i} whileHover={{ y: -4 }}>
                      <div className="bg-card rounded-xl border-2 border-border p-6 h-full hover:border-foreground/20 transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
                              <Icon className="h-6 w-6 text-secondary-foreground" />
                            </div>
                            <div>
                              <h3 className="font-display font-bold text-foreground">{event.title}</h3>
                              <Badge variant="secondary" className="text-xs capitalize mt-1">{event.eventType}</Badge>
                            </div>
                          </div>
                          {isAdmin && normalised.length > 0 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="outline" className="h-9 w-9" disabled={deleteEvent.isPending} aria-label="Delete event">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently remove the event/webinar for all users.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteEvent.mutate(event.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> {format(new Date(event.eventDate), "PPP 'at' p")}</p>
                          {event.location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {event.location}</p>}
                        </div>
                        {event.link && (
                          <a href={event.link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
                            <Button size="sm" variant="outline"><ExternalLink className="h-4 w-4 mr-1" /> Join</Button>
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <p className="text-muted-foreground py-8 text-center">No upcoming events yet. Stay tuned!</p>
            )}
          </motion.div>

          {past.length > 0 && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <motion.h2 variants={fadeUp} custom={0} className="text-2xl font-display font-bold text-foreground mb-6 text-muted-foreground/80">
                Past Events
              </motion.h2>
              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70" variants={staggerContainer}>
                {past.map((event, i) => (
                  <motion.div key={event.id} variants={fadeUp} custom={i}>
                    <div className="bg-muted/30 rounded-xl border border-border p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display font-semibold text-foreground mb-1">{event.title}</h3>
                          <p className="text-xs text-muted-foreground">{format(new Date(event.eventDate), "PPP")}</p>
                        </div>
                        {isAdmin && normalised.length > 0 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="outline" className="h-9 w-9" disabled={deleteEvent.isPending} aria-label="Delete event">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently remove the event/webinar for all users.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteEvent.mutate(event.id)}
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
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
