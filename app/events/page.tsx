import { getAdminAccess } from "@/lib/admin-auth";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { featuredEvents } from "@/lib/demo-content";

function formatEventDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const adminAccess = await getAdminAccess();
  let profile = null;

  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null;
  }
  const params = (await searchParams) ?? {};
  const typeParam = Array.isArray(params.type) ? params.type[0] : params.type;
  const activeType = typeParam || "All";

  let events: Array<{
    id: string;
    title: string;
    description: string;
    eventType: string;
    location: string | null;
    link: string | null;
    eventDate: Date;
    createdBy: { fullName: string };
  }> = [];

  try {
    events = await prisma.event.findMany({
      where: activeType === "All" ? undefined : { eventType: activeType },
      include: { createdBy: true },
      orderBy: { eventDate: "asc" },
    });
  } catch {
    events = featuredEvents
      .filter((event) => activeType === "All" || event.type === activeType)
      .map((event, index) => ({
        id: `fallback-event-${index}`,
        title: event.title,
        description: event.description,
        eventType: event.type,
        location: event.type === "Campus" ? "BVRITH Campus" : "Google Meet",
        link: event.type === "Campus" ? null : "https://meet.google.com/",
        eventDate: new Date(event.date),
        createdBy: { fullName: "Alumni Connect Team" },
      }));
  }

  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">Events</h1>
          <p className="page-lead">Mentor meetups, career panels, placement workshops, and alumni sessions.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell">
          <form method="get" className="search-row" style={{ marginBottom: 18 }}>
            <input value="Browse and filter alumni events" readOnly />
            <select name="type" defaultValue={activeType}>
              <option>All</option>
              <option>Online</option>
              <option>Hybrid</option>
              <option>Campus</option>
            </select>
            <input value={`${events.length} events`} readOnly />
            <button className="button button-secondary" type="submit">
              Filter
            </button>
          </form>

          {adminAccess.isAdmin ? (
            <form action="/api/events" method="post" className="dashboard-panel form-grid" style={{ marginBottom: 18 }}>
              <div className="section-header" style={{ marginBottom: 0 }}>
                <div>
                  <h3>Create an event</h3>
                  <p className="card-copy">Faculty can publish official mentorship sessions, workshops, and campus events.</p>
                </div>
              </div>
              <label>
                Title
                <input name="title" required placeholder="Example: Resume teardown session for 2026 batch" />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  required
                  placeholder="What will students learn or experience in this session?"
                />
              </label>
              <label>
                Event type
                <select name="eventType" defaultValue="Online">
                  <option>Online</option>
                  <option>Hybrid</option>
                  <option>Campus</option>
                </select>
              </label>
              <label>
                Location
                <input name="location" placeholder="Example: Seminar Hall / Google Meet" />
              </label>
              <label>
                Event date and time
                <input name="eventDate" type="datetime-local" required />
              </label>
              <label>
                Meeting link
                <input name="link" placeholder="https://meet.google.com/..." />
              </label>
              <button className="button button-primary" type="submit">
                Publish event
              </button>
            </form>
          ) : (
            <div className="dashboard-panel" style={{ marginBottom: 18 }}>
              <h3>Faculty-managed events</h3>
              <p className="card-copy">
                Event publishing is controlled by faculty admins. Students and alumni can browse all scheduled sessions here.
              </p>
            </div>
          )}

          {events.length === 0 ? (
            <div className="empty-state">No events match the selected filter yet.</div>
          ) : (
            <div className="request-grid">
              {events.map((event) => (
                <article key={event.id} className="request-card">
                  <div className="tab-row" style={{ marginBottom: 10 }}>
                    <span className="tab-pill active">{event.eventType}</span>
                    <span className="tab-pill">{formatEventDate(event.eventDate)}</span>
                  </div>
                  <h3>{event.title}</h3>
                  <p className="card-copy">{event.description}</p>
                  <p className="muted" style={{ marginBottom: 8 }}>
                    Hosted by {event.createdBy.fullName}
                  </p>
                  {event.location ? (
                    <p className="small muted" style={{ marginBottom: 8 }}>
                      Location: {event.location}
                    </p>
                  ) : null}
                  {event.link ? (
                    <a href={event.link} target="_blank" rel="noreferrer" className="button button-ghost">
                      Open event link
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
