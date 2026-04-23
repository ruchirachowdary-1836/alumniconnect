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

export type StoredEvent = {
  id: string;
  title: string;
  description: string;
  eventType: string;
  location?: string | null;
  link?: string | null;
  eventDate: string;
  createdByName: string;
  createdByEmail?: string;
  createdByRollNumber: string;
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

export type StoredChatMessage = {
  id: string;
  senderRollNumber: string;
  senderEmail?: string;
  senderName: string;
  senderRole: string;
  receiverRollNumber: string;
  receiverEmail?: string;
  receiverName: string;
  receiverRole: string;
  content: string;
  createdAt: string;
  attachments?: StoredChatAttachment[];
};

export type StoredChatAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  source: "upload" | "drive";
  url: string;
};

export type StoredForumReply = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    fullName: string;
    role: string;
    rollNumber: string;
    email?: string;
  };
};

export type StoredForumPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  author: {
    fullName: string;
    role: string;
    rollNumber: string;
    email?: string;
  };
  replies: StoredForumReply[];
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

function getStoredEvents(privateMetadata: Record<string, unknown>) {
  return Array.isArray(privateMetadata.portalEvents)
    ? (privateMetadata.portalEvents as StoredEvent[])
    : [];
}

function getStoredReferralRequests(privateMetadata: Record<string, unknown>) {
  return Array.isArray(privateMetadata.portalReferralRequests)
    ? (privateMetadata.portalReferralRequests as StoredReferralRequest[])
    : [];
}

function getStoredChatMessages(privateMetadata: Record<string, unknown>) {
  return Array.isArray(privateMetadata.portalChatMessages)
    ? (privateMetadata.portalChatMessages as StoredChatMessage[])
    : [];
}

function getStoredForumPosts(privateMetadata: Record<string, unknown>) {
  return Array.isArray(privateMetadata.portalForumPosts)
    ? (privateMetadata.portalForumPosts as StoredForumPost[])
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

export async function readPortalEvents() {
  const store = await getPortalStoreUser();

  if (!store) {
    return [];
  }

  return getStoredEvents(store.privateMetadata);
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

export async function appendPortalEvent(event: StoredEvent) {
  const store = await getPortalStoreUser();

  if (!store) {
    return false;
  }

  try {
    const client = await clerkClient();
    const existingEvents = getStoredEvents(store.privateMetadata);

    await client.users.updateUserMetadata(store.userId, {
      privateMetadata: {
        ...store.privateMetadata,
        portalEvents: [event, ...existingEvents.filter((item) => item.id !== event.id)],
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

export async function readPortalChatMessages() {
  const store = await getPortalStoreUser();

  if (!store) {
    return [];
  }

  return getStoredChatMessages(store.privateMetadata);
}

export async function appendPortalChatMessage(message: StoredChatMessage) {
  const store = await getPortalStoreUser();

  if (!store) {
    return false;
  }

  try {
    const client = await clerkClient();
    const existingMessages = getStoredChatMessages(store.privateMetadata);
    const dedupedMessages = existingMessages.filter((item) => item.id !== message.id);

    await client.users.updateUserMetadata(store.userId, {
      privateMetadata: {
        ...store.privateMetadata,
        portalChatMessages: [...dedupedMessages, message],
      },
    });

    return true;
  } catch {
    return false;
  }
}

export async function readPortalForumPosts() {
  const store = await getPortalStoreUser();

  if (!store) {
    return [];
  }

  return getStoredForumPosts(store.privateMetadata);
}

export async function appendPortalForumPost(post: StoredForumPost) {
  const store = await getPortalStoreUser();

  if (!store) {
    return false;
  }

  try {
    const client = await clerkClient();
    const existingPosts = getStoredForumPosts(store.privateMetadata);

    await client.users.updateUserMetadata(store.userId, {
      privateMetadata: {
        ...store.privateMetadata,
        portalForumPosts: [post, ...existingPosts.filter((item) => item.id !== post.id)],
      },
    });

    return true;
  } catch {
    return false;
  }
}

export async function appendPortalForumReply(postId: string, reply: StoredForumReply) {
  const store = await getPortalStoreUser();

  if (!store) {
    return false;
  }

  try {
    const client = await clerkClient();
    const existingPosts = getStoredForumPosts(store.privateMetadata);
    const nextPosts = existingPosts.map((post) =>
      post.id !== postId
        ? post
        : {
            ...post,
            replies: [...post.replies.filter((item) => item.id !== reply.id), reply],
          },
    );

    await client.users.updateUserMetadata(store.userId, {
      privateMetadata: {
        ...store.privateMetadata,
        portalForumPosts: nextPosts,
      },
    });

    return true;
  } catch {
    return false;
  }
}

export async function deletePortalForumPost(postId: string) {
  const store = await getPortalStoreUser();

  if (!store) {
    return false;
  }

  try {
    const client = await clerkClient();
    const existingPosts = getStoredForumPosts(store.privateMetadata);

    await client.users.updateUserMetadata(store.userId, {
      privateMetadata: {
        ...store.privateMetadata,
        portalForumPosts: existingPosts.filter((post) => post.id !== postId),
      },
    });

    return true;
  } catch {
    return false;
  }
}
