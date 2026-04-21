import { NextRequest, NextResponse } from "next/server";

import { getAdminAccess } from "@/lib/admin-auth";

export async function requireFacultyAdmin(request: NextRequest) {
  const access = await getAdminAccess();

  if (!access.isSignedIn) {
    return {
      ok: false as const,
      response: NextResponse.redirect(new URL("/admin", request.url)),
    };
  }

  if (!access.isAdmin) {
    return {
      ok: false as const,
      response: NextResponse.redirect(new URL("/admin", request.url)),
    };
  }

  return {
    ok: true as const,
    access,
  };
}
