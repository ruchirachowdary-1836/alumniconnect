import { prisma } from "@/lib/db";
import { featuredEvents } from "@/lib/demo-content";
import { readPortalEvents } from "@/lib/portal-store";

export const eventTypes = ["All", "Online", "Hybrid", "Campus"] as const;

export type EventBoardItem = {
  id: string;
  title: string;
  description: string;
  eventType: string;
  location: string | null;
  link: string | null;
  eventDate: string;
  createdBy: { fullName: string };
};

export async function getEvents(type: string = "All"): Promise<EventBoardItem[]> {
  let events: EventBoardItem[] = [];

  try {
    const dbEvents = await prisma.event.findMany({
      where: type === "All" ? undefined : { eventType: type },
      include: { createdBy: true },
      orderBy: { eventDate: "asc" },
    });

    events = dbEvents.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      location: event.location ?? null,
      link: event.link ?? null,
      eventDate: event.eventDate.toISOString(),
      createdBy: { fullName: event.createdBy.fullName },
    }));
  } catch {
    events = featuredEvents
      .filter((event) => type === "All" || event.type === type)
      .map((event, index) => ({
        id: `fallback-event-${index}`,
        title: event.title,
        description: event.description,
        eventType: event.type,
        location: event.type === "Campus" ? "BVRITH Campus" : "Google Meet",
        link: event.type === "Campus" ? null : "https://meet.google.com/",
        eventDate: new Date(event.date).toISOString(),
        createdBy: { fullName: "Alumni Connect Team" },
      }));
  }

  const portalEvents = (await readPortalEvents())
    .filter((event) => type === "All" || event.eventType === type)
    .map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      location: event.location ?? null,
      link: event.link ?? null,
      eventDate: event.eventDate,
      createdBy: { fullName: event.createdByName },
    }));

  const eventIds = new Set(events.map((event) => event.id));
  return [...events, ...portalEvents.filter((event) => !eventIds.has(event.id))].sort(
    (left, right) => new Date(left.eventDate).getTime() - new Date(right.eventDate).getTime(),
  );
}
