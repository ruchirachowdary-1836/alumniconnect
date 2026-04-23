"use client";

import { useEffect, useState, useTransition } from "react";
import { useEffectEvent } from "react";
import { useRouter } from "next/navigation";

import type { EventBoardItem } from "@/lib/events-data";

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function EventsBoard({
  initialEvents,
  activeType,
  canPost,
}: {
  initialEvents: EventBoardItem[];
  activeType: string;
  canPost: boolean;
}) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState(activeType === "All" ? "Online" : activeType);
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [link, setLink] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadEvents = useEffectEvent(async (type: string) => {
    try {
      const query = type === "All" ? "" : `?type=${encodeURIComponent(type)}`;
      const response = await fetch(`/api/events${query}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { events: EventBoardItem[] };
      setEvents(data.events);
    } catch {
      // Keep current events visible during short-lived polling issues.
    }
  });

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadEvents(activeType);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [activeType, loadEvents]);

  const handleFilter = (type: string) => {
    startTransition(() => {
      router.replace(type === "All" ? "/events" : `/events?type=${encodeURIComponent(type)}`);
    });
  };

  const handlePublish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !description.trim() || !eventDate.trim()) {
      return;
    }

    setErrorText("");

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("eventType", eventType);
      formData.append("location", location.trim());
      formData.append("eventDate", eventDate);
      formData.append("link", link.trim());

      const response = await fetch("/api/events", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrorText(error?.error || "Unable to publish the event right now.");
        return;
      }

      const data = (await response.json()) as { events: EventBoardItem[]; activeType: string };
      setEvents(data.events);
      setTitle("");
      setDescription("");
      setLocation("");
      setEventDate("");
      setLink("");
      setEventType(data.activeType === "All" ? "Online" : data.activeType);
      handleFilter(data.activeType);
    } catch {
      setErrorText("Unable to publish the event right now.");
    }
  };

  return (
    <>
      <form className="search-row" style={{ marginBottom: 18 }} onSubmit={(event) => event.preventDefault()}>
        <input value="Browse and filter alumni events" readOnly />
        <select value={activeType} onChange={(event) => handleFilter(event.target.value)}>
          <option>All</option>
          <option>Online</option>
          <option>Hybrid</option>
          <option>Campus</option>
        </select>
        <input value={`${events.length} events`} readOnly />
        <button className="button button-secondary" type="button" disabled={isPending}>
          {isPending ? "Updating..." : "Live"}
        </button>
      </form>

      {canPost ? (
        <form onSubmit={handlePublish} className="dashboard-panel form-grid" style={{ marginBottom: 18 }}>
          <div className="section-header" style={{ marginBottom: 0 }}>
            <div>
              <h3>Create an event</h3>
              <p className="card-copy">Alumni and faculty can publish mentorship sessions, workshops, webinars, and campus events here.</p>
            </div>
          </div>
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Example: Resume teardown session for 2026 batch" />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              placeholder="What will students learn or experience in this session?"
            />
          </label>
          <label>
            Event type
            <select value={eventType} onChange={(event) => setEventType(event.target.value)}>
              <option>Online</option>
              <option>Hybrid</option>
              <option>Campus</option>
            </select>
          </label>
          <label>
            Location
            <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Example: Seminar Hall / Google Meet" />
          </label>
          <label>
            Event date and time
            <input value={eventDate} onChange={(event) => setEventDate(event.target.value)} name="eventDate" type="datetime-local" required />
          </label>
          <label>
            Meeting link
            <input value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://meet.google.com/..." />
          </label>
          <button className="button button-primary" type="submit">
            Publish event
          </button>
        </form>
      ) : (
        <div className="dashboard-panel" style={{ marginBottom: 18 }}>
          <h3>Community events</h3>
          <p className="card-copy">
            Students can browse all scheduled sessions here. Alumni and faculty can publish new events from their own portals.
          </p>
        </div>
      )}

      {errorText ? (
        <p className="small" style={{ marginBottom: 14, color: "#b42318" }}>
          {errorText}
        </p>
      ) : null}

      {events.length === 0 ? (
        <div className="empty-state">No events match the selected filter yet.</div>
      ) : (
        <div className="request-grid">
          {events.map((item) => (
            <article key={item.id} className="request-card">
              <div className="tab-row" style={{ marginBottom: 10 }}>
                <span className="tab-pill active">{item.eventType}</span>
                <span className="tab-pill">{formatEventDate(item.eventDate)}</span>
              </div>
              <h3>{item.title}</h3>
              <p className="card-copy">{item.description}</p>
              <p className="muted" style={{ marginBottom: 8 }}>
                Hosted by {item.createdBy.fullName}
              </p>
              {item.location ? (
                <p className="small muted" style={{ marginBottom: 8 }}>
                  Location: {item.location}
                </p>
              ) : null}
              {item.link ? (
                <a href={item.link} target="_blank" rel="noreferrer" className="button button-ghost">
                  Open event link
                </a>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
