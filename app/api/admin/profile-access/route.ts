import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireFacultyAdmin } from "@/lib/admin-guards";

export async function POST(request: NextRequest) {
  const adminCheck = await requireFacultyAdmin(request);

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const formData = await request.formData();
  const rollNumber = formData.get("rollNumber")?.toString().trim().toUpperCase();
  const action = formData.get("action")?.toString().trim();

  if (!action) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  try {
    if (action === "enable_all_alumni" || action === "disable_all_alumni") {
      await prisma.userProfile.updateMany({
        where: { role: "ALUMNI" },
        data: {
          isMentorActive: action === "enable_all_alumni",
        },
      });
    } else if (action === "activate_all_blocks") {
      await prisma.userProfile.updateMany({
        data: {
          acceptedGuidelines: true,
        },
      });
      await prisma.userProfile.updateMany({
        where: { role: "ALUMNI" },
        data: {
          isMentorActive: true,
        },
      });
    } else if (rollNumber) {
      const profile = await prisma.userProfile.findUnique({
        where: { rollNumber },
      });

      if (profile) {
        await prisma.userProfile.update({
          where: { id: profile.id },
          data: {
            isMentorActive: action === "enable",
          },
        });
      }
    }
  } catch {
    // Keep the admin page usable even when the production DB is unavailable.
  }

  return NextResponse.redirect(new URL("/admin", request.url));
}
