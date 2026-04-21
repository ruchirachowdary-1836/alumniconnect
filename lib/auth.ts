import { auth, currentUser } from "@clerk/nextjs/server";

import { isClerkConfigured } from "@/lib/auth-config";
import { prisma } from "@/lib/db";
import { extractInstitutionRollNumber, inferNameFromEmail } from "@/lib/identity";
import { alumniSeed, studentSeed } from "@/lib/seed-data";

type PortalProfileMetadata = {
  role: string;
  fullName: string;
  rollNumber: string;
  batchYear?: number | null;
  branch?: string | null;
  company?: string | null;
  packageLpa?: number | null;
  drivesAttended?: number | null;
  backlogs?: string | null;
  internship?: string | null;
  mentorAreas?: string | null;
  bio?: string | null;
  acceptedGuidelines?: boolean;
  isMentorActive?: boolean;
  email?: string | null;
};

type SafeAuth = {
  userId: string | null;
};

export async function getSafeAuth(): Promise<SafeAuth> {
  if (!isClerkConfigured) {
    return { userId: null };
  }

  try {
    return await auth();
  } catch {
    return { userId: null };
  }
}

export async function getSafeCurrentUser() {
  if (!isClerkConfigured) {
    return null;
  }

  try {
    return await currentUser();
  } catch {
    return null;
  }
}

export async function getCurrentProfile() {
  const { userId } = await getSafeAuth();

  if (!userId) {
    return null;
  }

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
    });

    if (profile) {
      return profile;
    }
  } catch {
    // Fall back to Clerk metadata when the production DB is unavailable.
  }

  const { clerkUser, email, fullName } = await getSignedInIdentity();

  if (email) {
    try {
      const emailProfile = await prisma.userProfile.findUnique({
        where: { email },
      });

      if (emailProfile) {
        if (!emailProfile.clerkUserId || emailProfile.clerkUserId !== userId) {
          try {
            await prisma.userProfile.update({
              where: { id: emailProfile.id },
              data: { clerkUserId: userId },
            });
          } catch {
            // Keep returning the matched email profile even if the ID sync fails.
          }
        }

        return {
          ...emailProfile,
          clerkUserId: userId,
        };
      }
    } catch {
      // Ignore DB email lookup failures and continue to metadata fallback.
    }
  }

  const metadata = clerkUser?.publicMetadata?.portalProfile as
    | PortalProfileMetadata
    | undefined;

  const inferredRollNumber = extractInstitutionRollNumber(email);
  const inferredRoleFromSeed = inferredRollNumber
    ? alumniSeed.some((item) => item.rollNumber === inferredRollNumber)
      ? "ALUMNI"
      : studentSeed.some((item) => item.rollNumber === inferredRollNumber)
        ? "STUDENT"
        : null
    : null;

  if (inferredRollNumber && (metadata?.role || inferredRoleFromSeed)) {
    const inferredRole = metadata?.role || inferredRoleFromSeed;

    return {
      id: `inferred-${userId}`,
      clerkUserId: userId,
      email: email || null,
      role: inferredRole,
      fullName: metadata?.fullName || fullName || inferNameFromEmail(email) || inferredRollNumber,
      rollNumber: metadata?.rollNumber || inferredRollNumber,
      batchYear: metadata?.batchYear ?? null,
      branch: metadata?.branch ?? "CSE (AI & ML)",
      company: metadata?.company ?? null,
      packageLpa: metadata?.packageLpa ?? null,
      drivesAttended: metadata?.drivesAttended ?? null,
      backlogs: metadata?.backlogs ?? null,
      internship: metadata?.internship ?? null,
      mentorAreas: metadata?.mentorAreas ?? null,
      bio: metadata?.bio ?? null,
      acceptedGuidelines: metadata?.acceptedGuidelines ?? true,
      isMentorActive: metadata?.isMentorActive ?? inferredRole === "ALUMNI",
    };
  }

  if (!metadata?.rollNumber || !metadata?.role) {
    return null;
  }

  return {
    id: `clerk-${userId}`,
    clerkUserId: userId,
    email: email || metadata.email || null,
    role: metadata.role,
    fullName: metadata.fullName || fullName || "",
    rollNumber: metadata.rollNumber,
    batchYear: metadata.batchYear ?? null,
    branch: metadata.branch ?? null,
    company: metadata.company ?? null,
    packageLpa: metadata.packageLpa ?? null,
    drivesAttended: metadata.drivesAttended ?? null,
    backlogs: metadata.backlogs ?? null,
    internship: metadata.internship ?? null,
    mentorAreas: metadata.mentorAreas ?? null,
    bio: metadata.bio ?? null,
    acceptedGuidelines: metadata.acceptedGuidelines ?? true,
    isMentorActive: metadata.isMentorActive ?? false,
  };
}

export async function getSignedInIdentity() {
  const clerkUser = await getSafeCurrentUser();
  const primaryEmail = clerkUser?.emailAddresses.find(
    (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress;

  return {
    clerkUser,
    email: primaryEmail ?? "",
    fullName:
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
      clerkUser?.username ||
      "",
  };
}
