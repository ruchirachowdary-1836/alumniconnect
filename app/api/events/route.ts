import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireFacultyAdmin } from "@/lib/admin-guards";

export async function POST(request: NextRequest) {
  const adminCheck = await requireFacultyAdmin(request);

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const formData = await request.formData();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const eventType = formData.get("eventType")?.toString().trim() || "Online";
  const location = formData.get("location")?.toString().trim();
  const link = formData.get("link")?.toString().trim();
  const eventDate = formData.get("eventDate")?.toString().trim();

  if (!title || !description || !eventDate) {
    return NextResponse.redirect(new URL("/events", request.url));
  }

  try {
    const author = await prisma.userProfile.findFirst({
      where: { role: "ALUMNI" },
      orderBy: [{ packageLpa: "desc" }, { fullName: "asc" }],
    });

    if (author) {
      await prisma.event.create({
        data: {
          title,
          description,
          eventType,
          location: location || null,
          link: link || null,
          eventDate: new Date(eventDate),
          createdById: author.id,
        },
      });
    }
  } catch {
    // Ignore write failures on the production SQLite fallback.
  }

  return NextResponse.redirect(new URL(`/events?type=${encodeURIComponent(eventType)}`, request.url));
}
