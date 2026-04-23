import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getAdminAccess } from "@/lib/admin-auth";
import { getCurrentProfile, getSignedInIdentity } from "@/lib/auth";
import { resolveChatProfile } from "@/lib/chat-service";
import { prisma } from "@/lib/db";
import { getEvents } from "@/lib/events-data";
import { appendPortalEvent } from "@/lib/portal-store";
import { springBackendJson } from "@/lib/spring-backend";

function wantsJson(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";

  return accept.includes("application/json") || contentType.includes("application/json");
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "All";
  const springResponse = await springBackendJson<{ events: unknown[] }>(`/events?type=${encodeURIComponent(type)}`);

  if (springResponse.ok) {
    return NextResponse.json(springResponse.data);
  }

  const events = await getEvents(type);

  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const eventType = formData.get("eventType")?.toString().trim() || "Online";
  const location = formData.get("location")?.toString().trim();
  const link = formData.get("link")?.toString().trim();
  const eventDate = formData.get("eventDate")?.toString().trim();

  if (!title || !description || !eventDate) {
    return wantsJson(request)
      ? NextResponse.json({ error: "Title, description, and event date are required." }, { status: 400 })
      : NextResponse.redirect(new URL("/events", request.url));
  }

  const profile = (await getCurrentProfile().catch(() => null)) ?? (await resolveChatProfile());
  const adminAccess = await getAdminAccess();
  const { email, fullName } = await getSignedInIdentity();
  const canPost = profile?.role === "ALUMNI" || adminAccess.isAdmin;

  if (!canPost) {
    return wantsJson(request)
      ? NextResponse.json({ error: "Only alumni and faculty can publish events." }, { status: 403 })
      : NextResponse.redirect(new URL("/events", request.url));
  }

  const createdByName = profile?.fullName || fullName || email || "Portal Host";
  const createdByEmail = profile?.email || email || "";
  const createdByRollNumber =
    profile?.rollNumber || (adminAccess.isAdmin ? "FACULTY" : `ALUMNI-${crypto.randomUUID().slice(0, 8).toUpperCase()}`);
  const eventId = `event-${crypto.randomUUID()}`;

  const springResponse = await springBackendJson<{ events: unknown[]; activeType: string }>("/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      description,
      eventType,
      location: location || null,
      link: link || null,
      eventDate: new Date(eventDate).toISOString(),
      createdByName,
    }),
  });

  if (springResponse.ok) {
    return wantsJson(request)
      ? NextResponse.json(springResponse.data)
      : NextResponse.redirect(new URL(`/events?type=${encodeURIComponent(eventType)}`, request.url));
  }

  await appendPortalEvent({
    id: eventId,
    title,
    description,
    eventType,
    location: location || null,
    link: link || null,
    eventDate: new Date(eventDate).toISOString(),
    createdByName,
    createdByEmail,
    createdByRollNumber,
  });

  try {
    if (profile) {
      await prisma.event.create({
        data: {
          id: eventId,
          title,
          description,
          eventType,
          location: location || null,
          link: link || null,
          eventDate: new Date(eventDate),
          createdById: profile.id,
        },
      });
    }
  } catch {
    // Ignore write failures on the production SQLite fallback.
  }

  revalidatePath("/events");

  if (wantsJson(request)) {
    const events = await getEvents(eventType);
    return NextResponse.json({ events, activeType: eventType });
  }

  return NextResponse.redirect(new URL(`/events?type=${encodeURIComponent(eventType)}`, request.url));
}
