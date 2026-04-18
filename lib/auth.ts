import { auth, currentUser } from "@clerk/nextjs/server";

import { isClerkConfigured } from "@/lib/auth-config";
import { prisma } from "@/lib/db";
import { ensureSeedData } from "@/lib/seed";

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
  await ensureSeedData();
  const { userId } = await getSafeAuth();

  if (!userId) {
    return null;
  }

  return prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
  });
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
