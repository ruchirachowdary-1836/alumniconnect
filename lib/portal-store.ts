import { clerkClient } from "@clerk/nextjs/server";

import { getFacultyAdminEmails } from "@/lib/admin-auth";

export type StoredMentorshipRequest = {
  id: string;
  studentName: string;
  studentRollNumber: string;
  studentEmail: string;
  alumniName: string;
  alumniRollNumber: string;
  subject: string;
  goals: string;
  message: string;
  preferredMode: string;
  availability: string;
  status: string;
  createdAt: string;
  alumniResponseMessage?: string | null;
  source?: string;
};

export type StoredOpportunity = {
  id: string;
  title: string;
  company: string;
  type: string;
  location: string;
  description: string;
  applyLink?: string;
  postedByName: string;
  postedByEmail: string;
  postedByRollNumber: string;
  createdAt: string;
  status: string;
};

export type StoredReferralRequest = {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  company: string;
  studentName: string;
  studentRollNumber: string;
  studentEmail: string;
  alumniName: string;
  alumniRollNumber: string;
  alumniEmail?: string;
  message: string;
  status: string;
  createdAt: string;
  alumniResponseMessage?: string | null;
};

type StorePayload = {
  userId: string;
  privateMetadata: Record<string, unknown>;
};

function getStoredRequests(privateMetadata: Record<string, unknown>) {
  return Array.isArray(privateMetadata.portalMentorshipRequests)
    ? (privateMetadata.portalMentorshipRequests as StoredMentorshipRequest[])
    : [];
}

function getStoredOpportunities(privateMetadata: Record<string, unknown>) {
  return Array.isArray(privateMetadata.portalOpportunities)
    ? (privateMetadata.portalOpportunities as StoredOpportunity[])
    : [];
}

function getStoredReferralRequests(privateMetadata: Record<string, unknown>) {
  return Array.isArray(privateMetadata.portalReferralRequests)
    ? (privateMetadata.portalReferralRequests as StoredReferralRequest[])
    : [];
}

async function getPortalStoreUser(): Promise<StorePayload | null> {
  const emails = getFacultyAdminEmails();

  if (emails.length === 0) {
    return null;
  }

  try {
    const client = await clerkClient();

    for (const email of emails) {
      const result = await client.users.getUserList({
        emailAddress: [email],
        limit: 1,
      });
      const user = Array.isArray(result) ? result[0] : result.data?.[0];

      if (user) {
        return {
          userId: user.id,
          privateMetadata: (user.privateMetadata ?? {}) as Record<string, unknown>,
        };
      }
    }
  } catch {
    return null;
  }

  return null;
}

export async function readPortalMentorshipRequests() {
  const store = await getPortalStoreUser();

  if (!store) {
    return [];
  }

  return getStoredRequests(store.privateMetadata);
}

export async function appendPortalMentorshipRequest(request: StoredMentorshipRequest) {
  const store = await getPortalStoreUser();

  if (!store) {
    return false;
  }

  try {
    const client = await clerkClient();
    const existingRequests = getStoredRequests(store.privateMetadata);
    const alreadyExists = existingRequests.some(
      (item) =>
        item.studentRollNumber === request.studentRollNumber &&
        item.alumniRollNumber === request.alumniRollNumber &&
        item.status === "PENDING",
    );

    if (alreadyExists) {
      return true;
    }

    await client.users.updateUserMetadata(store.userId, {
      privateMetadata: {
        ...store.privateMetadata,
        portalMentorshipRequests: [...existingRequests, request],
      },
    });

    return true;
  } catch {
    return false;
  }
}

export async function updatePortalMentorshipRequest(
  id: string,
  updates: Partial<StoredMentorshipRequest>,
) {
  const store = await getPortalStoreUser();

  if (!store) {
    return null;
  }

  try {
    const client = await clerkClient();
    const existingRequests = getStoredRequests(store.privateMetadata);
    let updatedRequest: StoredMentorshipRequest | null = null;

    const nextRequests = existingRequests.map((item) => {
      if (item.id !== id) {
        return item;
      }

      updatedRequest = {
        ...item,
        ...updates,
      };

      return updatedRequest;
    });

    await client.users.updateUserMetadata(store.userId, {
      privateMetadata: {
        ...store.privateMetadata,
        portalMentorshipRequests: nextRequests,
      },
    });

    return updatedRequest;
  } catch {
    return null;
  }
}

export async function readPortalOpportunities() {
  const store = await getPortalStoreUser();

  if (!store) {
    return [];
  }

  return getStoredOpportunities(store.privateMetadata);
}

export async function appendPortalOpportunity(opportunity: StoredOpportunity) {
  const store = await getPortalStoreUser();

  if (!store) {
    return false;
  }

  try {
    const client = await clerkClient();
    const existingOpportunities = getStoredOpportunities(store.privateMetadata);

    await client.users.updateUserMetadata(store.userId, {
      privateMetadata: {
        ...store.privateMetadata,
        portalOpportunities: [opportunity, ...existingOpportunities],
      },
    });

    return true;
  } catch {
    return false;
  }
}

export async function readPortalReferralRequests() {
  const store = await getPortalStoreUser();

  if (!store) {
    return [];
  }

  return getStoredReferralRequests(store.privateMetadata);
}

export async function appendPortalReferralRequest(request: StoredReferralRequest) {
  const store = await getPortalStoreUser();

  if (!store) {
    return false;
  }

  try {
    const client = await clerkClient();
    const existingRequests = getStoredReferralRequests(store.privateMetadata);
    const alreadyExists = existingRequests.some(
      (item) =>
        item.opportunityId === request.opportunityId &&
        item.studentRollNumber === request.studentRollNumber &&
        item.status === "PENDING",
    );

    if (alreadyExists) {
      return true;
    }

    await client.users.updateUserMetadata(store.userId, {
      privateMetadata: {
        ...store.privateMetadata,
        portalReferralRequests: [request, ...existingRequests],
      },
    });

    return true;
  } catch {
    return false;
  }
}

export async function updatePortalReferralRequest(
  id: string,
  updates: Partial<StoredReferralRequest>,
) {
  const store = await getPortalStoreUser();

  if (!store) {
    return null;
  }

  try {
    const client = await clerkClient();
    const existingRequests = getStoredReferralRequests(store.privateMetadata);
    let updatedRequest: StoredReferralRequest | null = null;

    const nextRequests = existingRequests.map((item) => {
      if (item.id !== id) {
        return item;
      }

      updatedRequest = {
        ...item,
        ...updates,
      };

      return updatedRequest;
    });

    await client.users.updateUserMetadata(store.userId, {
      privateMetadata: {
        ...store.privateMetadata,
        portalReferralRequests: nextRequests,
      },
    });

    return updatedRequest;
  } catch {
    return null;
  }
}
