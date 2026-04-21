import { getSafeCurrentUser } from "@/lib/auth";

const defaultFacultyAdminEmails = ["ruchirachowdary6@gmail.com"];

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function getFacultyAdminEmails() {
  const configuredEmails = (process.env.FACULTY_ADMIN_EMAILS ?? "")
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map(normalizeEmail);

  return [...new Set([...configuredEmails, ...defaultFacultyAdminEmails.map(normalizeEmail)])];
}

export async function getAdminAccess() {
  const clerkUser = await getSafeCurrentUser();

  if (!clerkUser) {
    return {
      isSignedIn: false,
      isAdmin: false,
      email: null as string | null,
      hasAllowlist: getFacultyAdminEmails().length > 0,
    };
  }

  const primaryEmail =
    clerkUser.emailAddresses.find(
      (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? null;
  const normalizedEmail = primaryEmail ? normalizeEmail(primaryEmail) : null;
  const allowlist = getFacultyAdminEmails();
  const publicMetadata = clerkUser.publicMetadata as Record<string, unknown>;

  const isAdmin =
    Boolean(publicMetadata.isAdmin) ||
    publicMetadata.role === "ADMIN" ||
    (normalizedEmail ? allowlist.includes(normalizedEmail) : false);

  return {
    isSignedIn: true,
    isAdmin,
    email: primaryEmail,
    hasAllowlist: allowlist.length > 0,
  };
}
