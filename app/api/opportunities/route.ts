import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { auth } from "@clerk/nextjs/server";

import { getAdminAccess } from "@/lib/admin-auth";
import { getCurrentProfile, getSignedInIdentity } from "@/lib/auth";
import { resolveChatProfile } from "@/lib/chat-service";
import { prisma } from "@/lib/db";
import { getOpportunities } from "@/lib/opportunities-data";
import { appendPortalOpportunity } from "@/lib/portal-store";
import { springBackendJson } from "@/lib/spring-backend";

function wantsJson(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";

  return accept.includes("application/json") || contentType.includes("application/json");
}

export async function GET() {
  const springResponse = await springBackendJson<{ opportunities: unknown[] }>("/opportunities");

  if (springResponse.ok) {
    return NextResponse.json(springResponse.data);
  }

  const opportunities = await getOpportunities();

  return NextResponse.json({ opportunities });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return wantsJson(request)
      ? NextResponse.json({ error: "Please sign in as alumni or faculty to post opportunities." }, { status: 401 })
      : NextResponse.redirect(new URL("/alumni/login", request.url));
  }

  const formData = await request.formData();
  const title = formData.get("title")?.toString().trim();
  const company = formData.get("company")?.toString().trim();
  const type = formData.get("type")?.toString().trim() || "Job";
  const location = formData.get("location")?.toString().trim() || "Remote";
  const description = formData.get("description")?.toString().trim();
  const applyLink = formData.get("applyLink")?.toString().trim() || "";

  if (!title || !company || !description) {
    return wantsJson(request)
      ? NextResponse.json({ error: "Title, company, and description are required." }, { status: 400 })
      : NextResponse.redirect(new URL("/opportunities", request.url));
  }

  const { email, fullName } = await getSignedInIdentity();
  const adminAccess = await getAdminAccess();
  let alumni = null;

  try {
    alumni = (await getCurrentProfile()) ?? (await resolveChatProfile());

    if (!alumni && email && !adminAccess.isAdmin) {
      alumni = await prisma.userProfile.findUnique({ where: { email } });
    }
  } catch {
    alumni = null;
  }

  if (!(alumni?.role === "ALUMNI" || adminAccess.isAdmin)) {
    return wantsJson(request)
      ? NextResponse.json({ error: "Only alumni and faculty can publish opportunities." }, { status: 403 })
      : NextResponse.redirect(new URL("/opportunities", request.url));
  }

  const postedByName = alumni?.fullName || fullName || (adminAccess.isAdmin ? "Faculty Admin" : "Alumni Mentor");
  const postedByEmail = alumni?.email || email || "";
  const postedByRollNumber =
    alumni?.rollNumber || (adminAccess.isAdmin ? "FACULTY" : `ALUMNI-${userId.slice(0, 8).toUpperCase()}`);

  const springResponse = await springBackendJson<{ opportunities: unknown[] }>("/opportunities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      company,
      type,
      location,
      description,
      applyLink,
      postedByName,
      postedByEmail,
      postedByRollNumber,
    }),
  });

  if (springResponse.ok) {
    return wantsJson(request)
      ? NextResponse.json(springResponse.data)
      : NextResponse.redirect(new URL("/opportunities?posted=1", request.url));
  }

  await appendPortalOpportunity({
    id: `opp-${crypto.randomUUID()}`,
    title,
    company,
    type,
    location,
    description,
    applyLink,
    postedByName,
    postedByEmail,
    postedByRollNumber,
    createdAt: new Date().toISOString(),
    status: "OPEN",
  });

  revalidatePath("/opportunities");

  if (wantsJson(request)) {
    const opportunities = await getOpportunities();
    return NextResponse.json({ opportunities });
  }

  return NextResponse.redirect(new URL("/opportunities?posted=1", request.url));
}
