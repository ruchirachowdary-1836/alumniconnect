import { getCurrentProfile, getSignedInIdentity } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { demoChatThreads, demoMentorshipRequests } from "@/lib/demo-content";
import { extractInstitutionRollNumber, inferNameFromEmail } from "@/lib/identity";
import { get, put } from "@vercel/blob";
import {
  appendPortalChatMessage,
  readPortalChatMessages,
  readPortalMentorshipRequests,
  type StoredChatAttachment,
} from "@/lib/portal-store";

export type ChatActor = {
  chatId: string;
  dbId: string | null;
  email: string | null;
  role: string;
  fullName: string;
  rollNumber: string;
  branch: string | null;
  company: string | null;
  clerkUserId: string | null;
  isMentorActive: boolean;
};

export type ChatContact = {
  id: string;
  fullName: string;
  company: string | null;
  branch: string | null;
  role: string;
};

export type ChatViewMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender: ChatContact;
  receiver: ChatContact;
  attachments?: StoredChatAttachment[];
};

export type ChatThread = {
  profile: ChatContact;
  preview: string;
  updatedAt: string;
};

export type ChatViewState = {
  profile: ChatActor | null;
  threads: ChatThread[];
  activeThread: ChatContact | null;
  activeMessages: ChatViewMessage[];
};

const CHAT_PAYLOAD_PREFIX = "__CHAT_PAYLOAD__:";
const CHAT_THREAD_BLOB_PREFIX = "chat-threads";

function createContact(input: {
  id: string;
  fullName: string;
  company?: string | null;
  branch?: string | null;
  role: string;
}): ChatContact {
  return {
    id: input.id,
    fullName: input.fullName,
    company: input.company ?? null,
    branch: input.branch ?? null,
    role: input.role,
  };
}

function createActor(input: {
  dbId?: string | null;
  email?: string | null;
  role: string;
  fullName: string;
  rollNumber: string;
  branch?: string | null;
  company?: string | null;
  clerkUserId?: string | null;
  isMentorActive?: boolean;
}): ChatActor {
  return {
    chatId: input.rollNumber,
    dbId: input.dbId ?? null,
    email: input.email ?? null,
    role: input.role,
    fullName: input.fullName,
    rollNumber: input.rollNumber,
    branch: input.branch ?? "CSE (AI & ML)",
    company: input.company ?? null,
    clerkUserId: input.clerkUserId ?? null,
    isMentorActive: input.isMentorActive ?? input.role === "ALUMNI",
  };
}

function createMessage(input: {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date | string;
  sender: ChatContact;
  receiver: ChatContact;
  attachments?: StoredChatAttachment[];
}): ChatViewMessage {
  return {
    id: input.id,
    senderId: input.senderId,
    receiverId: input.receiverId,
    content: input.content,
    createdAt: typeof input.createdAt === "string" ? input.createdAt : input.createdAt.toISOString(),
    sender: input.sender,
    receiver: input.receiver,
    attachments: input.attachments ?? [],
  };
}

function serializeChatPayload(content: string, attachments: StoredChatAttachment[]) {
  return `${CHAT_PAYLOAD_PREFIX}${JSON.stringify({
    content,
    attachments,
  })}`;
}

function parseChatPayload(rawContent: string): {
  content: string;
  attachments: StoredChatAttachment[];
} {
  if (!rawContent.startsWith(CHAT_PAYLOAD_PREFIX)) {
    return {
      content: rawContent,
      attachments: [],
    };
  }

  try {
    const parsed = JSON.parse(rawContent.slice(CHAT_PAYLOAD_PREFIX.length)) as {
      content?: string;
      attachments?: StoredChatAttachment[];
    };

    return {
      content: parsed.content || "",
      attachments: parsed.attachments ?? [],
    };
  } catch {
    return {
      content: rawContent,
      attachments: [],
    };
  }
}

type BlobThreadMessage = {
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

function getChatThreadKey(leftRollNumber: string, rightRollNumber: string) {
  return [leftRollNumber.toUpperCase(), rightRollNumber.toUpperCase()].sort().join("--");
}

function getChatThreadBlobPath(leftRollNumber: string, rightRollNumber: string) {
  return `${CHAT_THREAD_BLOB_PREFIX}/${getChatThreadKey(leftRollNumber, rightRollNumber)}.json`;
}

async function readBlobChatThread(
  leftRollNumber: string,
  rightRollNumber: string,
): Promise<BlobThreadMessage[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return [];
  }

  try {
    const result = await get(getChatThreadBlobPath(leftRollNumber, rightRollNumber), {
      access: "public",
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return [];
    }

    const payload = await new Response(result.stream).text();
    const parsed = JSON.parse(payload) as BlobThreadMessage[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function appendBlobChatThreadMessage(
  sender: ChatActor,
  receiver: ChatActor,
  message: BlobThreadMessage,
) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return false;
  }

  try {
    const path = getChatThreadBlobPath(sender.rollNumber, receiver.rollNumber);
    const existingMessages = await readBlobChatThread(sender.rollNumber, receiver.rollNumber);
    const nextMessages = [...existingMessages.filter((item) => item.id !== message.id), message];

    await put(path, JSON.stringify(nextMessages), {
      access: "public",
      allowOverwrite: true,
      contentType: "application/json",
      addRandomSuffix: false,
    });

    return true;
  } catch {
    return false;
  }
}

export async function resolveChatProfile(): Promise<ChatActor | null> {
  let profile = null;

  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null;
  }

  if (profile) {
    return createActor({
      dbId: profile.id,
      email: profile.email,
      role: profile.role,
      fullName: profile.fullName,
      rollNumber: profile.rollNumber,
      branch: profile.branch,
      company: profile.company,
      clerkUserId: profile.clerkUserId,
      isMentorActive: profile.isMentorActive,
    });
  }

  const { email, fullName, clerkUser } = await getSignedInIdentity();
  const inferredRollNumber = extractInstitutionRollNumber(email);

  if (!email || !inferredRollNumber) {
    return null;
  }

  const portalRequests = await readPortalMentorshipRequests();
  const isStudent = [...demoMentorshipRequests, ...portalRequests].some(
    (request) =>
      request.studentRollNumber === inferredRollNumber ||
      request.studentEmail.toLowerCase() === email.toLowerCase(),
  );
  const isAlumni = [...demoMentorshipRequests, ...portalRequests].some(
    (request) =>
      request.alumniRollNumber === inferredRollNumber ||
      request.alumniEmail?.toLowerCase() === email.toLowerCase(),
  );

  if (!isStudent && !isAlumni) {
    return null;
  }

  return createActor({
    dbId: null,
    email,
    role: isStudent ? "STUDENT" : "ALUMNI",
    fullName: fullName || inferNameFromEmail(email) || inferredRollNumber,
    rollNumber: inferredRollNumber,
    branch: "CSE (AI & ML)",
    company: isStudent ? null : "Alumni Mentor",
    clerkUserId: clerkUser?.id ?? null,
    isMentorActive: isAlumni,
  });
}

export async function resolveChatContactByKey(key: string): Promise<ChatActor | null> {
  try {
    const dbProfile =
      (await prisma.userProfile.findUnique({
        where: { rollNumber: key },
      })) ||
      (await prisma.userProfile.findUnique({
        where: { id: key },
      }));

    if (dbProfile) {
      return createActor({
        dbId: dbProfile.id,
        email: dbProfile.email,
        role: dbProfile.role,
        fullName: dbProfile.fullName,
        rollNumber: dbProfile.rollNumber,
        branch: dbProfile.branch,
        company: dbProfile.company,
        clerkUserId: dbProfile.clerkUserId,
        isMentorActive: dbProfile.isMentorActive,
      });
    }
  } catch {
    // Fall through to the imported/demo request lookup.
  }

  const portalRequests = await readPortalMentorshipRequests();
  const request = [...portalRequests, ...demoMentorshipRequests].find(
    (item) => item.studentRollNumber === key || item.alumniRollNumber === key,
  );

  if (!request) {
    return null;
  }

  if (request.alumniRollNumber === key) {
    return createActor({
      role: "ALUMNI",
      fullName: request.alumniName,
      rollNumber: request.alumniRollNumber,
      email: request.alumniEmail ?? null,
      branch: "CSE (AI & ML)",
      company: "Alumni Mentor",
      isMentorActive: true,
    });
  }

  return createActor({
    role: "STUDENT",
    fullName: request.studentName,
    rollNumber: request.studentRollNumber,
    email: request.studentEmail,
    branch: "CSE (AI & ML)",
    company: null,
    isMentorActive: false,
  });
}

async function ensureChatDbProfile(actor: ChatActor) {
  try {
    const existing =
      (await prisma.userProfile.findUnique({
        where: { rollNumber: actor.rollNumber },
      })) ||
      (actor.email
        ? await prisma.userProfile.findUnique({
            where: { email: actor.email },
          })
        : null);

    if (existing) {
      const updated = await prisma.userProfile.update({
        where: { id: existing.id },
        data: {
          clerkUserId: actor.clerkUserId ?? existing.clerkUserId,
          email: actor.email ?? existing.email,
          fullName: actor.fullName || existing.fullName,
          role: actor.role || existing.role,
          rollNumber: actor.rollNumber,
          branch: actor.branch ?? existing.branch,
          company: actor.company ?? existing.company,
          acceptedGuidelines: true,
          isMentorActive: actor.role === "ALUMNI" ? true : existing.isMentorActive,
        },
      });

      return createActor({
        dbId: updated.id,
        email: updated.email,
        role: updated.role,
        fullName: updated.fullName,
        rollNumber: updated.rollNumber,
        branch: updated.branch,
        company: updated.company,
        clerkUserId: updated.clerkUserId,
        isMentorActive: updated.isMentorActive,
      });
    }

    const created = await prisma.userProfile.create({
      data: {
        clerkUserId: actor.clerkUserId,
        email: actor.email,
        role: actor.role,
        fullName: actor.fullName,
        rollNumber: actor.rollNumber,
        branch: actor.branch,
        company: actor.company,
        acceptedGuidelines: true,
        isMentorActive: actor.role === "ALUMNI",
      },
    });

    return createActor({
      dbId: created.id,
      email: created.email,
      role: created.role,
      fullName: created.fullName,
      rollNumber: created.rollNumber,
      branch: created.branch,
      company: created.company,
      clerkUserId: created.clerkUserId,
      isMentorActive: created.isMentorActive,
    });
  } catch {
    return actor;
  }
}

export async function hasAcceptedMentorshipBetween(
  left: Pick<ChatActor, "rollNumber">,
  right: Pick<ChatActor, "rollNumber">,
) {
  try {
    const dbAccepted = await prisma.mentorshipRequest.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          {
            student: { rollNumber: left.rollNumber },
            alumni: { rollNumber: right.rollNumber },
          },
          {
            student: { rollNumber: right.rollNumber },
            alumni: { rollNumber: left.rollNumber },
          },
        ],
      },
      select: { id: true },
    });

    if (dbAccepted) {
      return true;
    }
  } catch {
    // Continue to metadata-backed fallbacks.
  }

  const portalAccepted = (await readPortalMentorshipRequests()).some(
    (request) =>
      request.status === "ACCEPTED" &&
      ((request.studentRollNumber === left.rollNumber &&
        request.alumniRollNumber === right.rollNumber) ||
        (request.studentRollNumber === right.rollNumber &&
          request.alumniRollNumber === left.rollNumber)),
  );

  if (portalAccepted) {
    return true;
  }

  return demoMentorshipRequests.some(
    (request) =>
      request.status === "ACCEPTED" &&
      ((request.studentRollNumber === left.rollNumber &&
        request.alumniRollNumber === right.rollNumber) ||
        (request.studentRollNumber === right.rollNumber &&
          request.alumniRollNumber === left.rollNumber)),
  );
}

export async function persistChatMessage(
  sender: ChatActor,
  receiver: ChatActor,
  content: string,
  attachments: StoredChatAttachment[] = [],
) {
  const trimmed = content.trim();
  const normalizedContent =
    trimmed ||
    (attachments.some((attachment) => attachment.source === "drive")
      ? "Shared a Drive file"
      : "Shared an attachment");

  if (!normalizedContent && attachments.length === 0) {
    return false;
  }

  const messageId = `chat-${crypto.randomUUID()}`;
  const payloadContent = serializeChatPayload(normalizedContent, attachments);
  const dbSender = await ensureChatDbProfile(sender);
  const dbReceiver = await ensureChatDbProfile(receiver);
  const blobThreadMessage: BlobThreadMessage = {
    id: messageId,
    senderRollNumber: sender.rollNumber,
    senderEmail: sender.email ?? undefined,
    senderName: sender.fullName,
    senderRole: sender.role,
    receiverRollNumber: receiver.rollNumber,
    receiverEmail: receiver.email ?? undefined,
    receiverName: receiver.fullName,
    receiverRole: receiver.role,
    content: normalizedContent,
    createdAt: new Date().toISOString(),
    attachments,
  };

  const blobStored = await appendBlobChatThreadMessage(sender, receiver, blobThreadMessage);

  if (dbSender.dbId && dbReceiver.dbId) {
    try {
      await prisma.chatMessage.create({
        data: {
          id: messageId,
          senderId: dbSender.dbId,
          receiverId: dbReceiver.dbId,
          content: payloadContent,
        },
      });

      return true;
    } catch {
      // Fall through to blob/metadata fallbacks when DB storage is unavailable.
    }
  }

  if (blobStored) {
    return true;
  }

  return appendPortalChatMessage({
    ...blobThreadMessage,
  });
}

export async function getChatView(withParam?: string): Promise<ChatViewState> {
  const profile = await resolveChatProfile();

  if (!profile) {
    return {
      profile: null,
      threads: [],
      activeThread: null,
      activeMessages: [],
    };
  }

  const suggestedContacts: ChatContact[] = [];
  const viewMessages: ChatViewMessage[] = [];

  try {
    const [acceptedRequests, dbMessages] = await Promise.all([
      prisma.mentorshipRequest.findMany({
        where:
          profile.role === "STUDENT"
            ? { status: "ACCEPTED", student: { rollNumber: profile.rollNumber } }
            : { status: "ACCEPTED", alumni: { rollNumber: profile.rollNumber } },
        include: {
          student: true,
          alumni: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.chatMessage.findMany({
        where: {
          OR: [
            { sender: { rollNumber: profile.rollNumber } },
            { receiver: { rollNumber: profile.rollNumber } },
          ],
        },
        include: {
          sender: true,
          receiver: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    for (const request of acceptedRequests) {
      const counterpart =
        profile.role === "STUDENT"
          ? createContact({
              id: request.alumni.rollNumber,
              fullName: request.alumni.fullName,
              company: request.alumni.company,
              branch: request.alumni.branch,
              role: request.alumni.role,
            })
          : createContact({
              id: request.student.rollNumber,
              fullName: request.student.fullName,
              company: request.student.company,
              branch: request.student.branch,
              role: request.student.role,
            });

      suggestedContacts.push(counterpart);
    }

    for (const message of dbMessages) {
      const parsedMessage = parseChatPayload(message.content);
      viewMessages.push(
        createMessage({
          id: message.id,
          senderId: message.sender.rollNumber,
          receiverId: message.receiver.rollNumber,
          content: parsedMessage.content,
          createdAt: message.createdAt,
          sender: createContact({
            id: message.sender.rollNumber,
            fullName: message.sender.fullName,
            company: message.sender.company,
            branch: message.sender.branch,
            role: message.sender.role,
          }),
          receiver: createContact({
            id: message.receiver.rollNumber,
            fullName: message.receiver.fullName,
            company: message.receiver.company,
            branch: message.receiver.branch,
            role: message.receiver.role,
          }),
          attachments: parsedMessage.attachments,
        }),
      );
    }
  } catch {
    // Prisma can be unavailable on Vercel with SQLite; continue with fallback store.
  }

  const portalAcceptedRequests = (await readPortalMentorshipRequests()).filter(
    (request) =>
      request.status === "ACCEPTED" &&
      (profile.role === "STUDENT"
        ? request.studentRollNumber === profile.rollNumber ||
          (profile.email ? request.studentEmail.toLowerCase() === profile.email.toLowerCase() : false)
        : request.alumniRollNumber === profile.rollNumber ||
          (profile.email ? request.alumniEmail?.toLowerCase() === profile.email.toLowerCase() : false)),
  );

  for (const request of portalAcceptedRequests) {
    suggestedContacts.push(
      profile.role === "STUDENT"
        ? createContact({
            id: request.alumniRollNumber,
            fullName: request.alumniName,
            company: "Alumni Mentor",
            branch: "CSE (AI & ML)",
            role: "ALUMNI",
          })
        : createContact({
            id: request.studentRollNumber,
            fullName: request.studentName,
            company: null,
            branch: "CSE (AI & ML)",
            role: "STUDENT",
          }),
    );
  }

  const demoAcceptedRequests = demoMentorshipRequests.filter(
    (request) =>
      request.status === "ACCEPTED" &&
      (profile.role === "STUDENT"
        ? request.studentRollNumber === profile.rollNumber ||
          (profile.email ? request.studentEmail.toLowerCase() === profile.email.toLowerCase() : false)
        : request.alumniRollNumber === profile.rollNumber ||
          (profile.email ? request.alumniEmail?.toLowerCase() === profile.email.toLowerCase() : false)),
  );

  for (const request of demoAcceptedRequests) {
    suggestedContacts.push(
      profile.role === "STUDENT"
        ? createContact({
            id: request.alumniRollNumber,
            fullName: request.alumniName,
            company: "Alumni Mentor",
            branch: "CSE (AI & ML)",
            role: "ALUMNI",
          })
        : createContact({
            id: request.studentRollNumber,
            fullName: request.studentName,
            company: null,
            branch: "CSE (AI & ML)",
            role: "STUDENT",
          }),
    );
  }

  const portalMessages = (await readPortalChatMessages()).filter(
    (message) =>
      message.senderRollNumber === profile.rollNumber ||
      message.receiverRollNumber === profile.rollNumber ||
      (profile.email
        ? message.senderEmail?.toLowerCase() === profile.email.toLowerCase() ||
          message.receiverEmail?.toLowerCase() === profile.email.toLowerCase()
        : false),
  );

  for (const message of portalMessages) {
    viewMessages.push(
      createMessage({
        id: message.id,
        senderId: message.senderRollNumber,
        receiverId: message.receiverRollNumber,
        content: message.content,
        createdAt: message.createdAt,
          sender: createContact({
            id: message.senderRollNumber,
            fullName: message.senderName,
          company: message.senderRole === "ALUMNI" ? "Alumni Mentor" : null,
          branch: "CSE (AI & ML)",
          role: message.senderRole,
        }),
          receiver: createContact({
            id: message.receiverRollNumber,
            fullName: message.receiverName,
          company: message.receiverRole === "ALUMNI" ? "Alumni Mentor" : null,
          branch: "CSE (AI & ML)",
            role: message.receiverRole,
          }),
          attachments: message.attachments ?? [],
        }),
      );
  }

  const blobThreadKeys = new Set<string>();
  for (const contact of suggestedContacts) {
    blobThreadKeys.add(getChatThreadKey(profile.rollNumber, contact.id));
  }
  if (withParam) {
    blobThreadKeys.add(getChatThreadKey(profile.rollNumber, withParam));
  }

  for (const key of blobThreadKeys) {
    const [leftRollNumber, rightRollNumber] = key.split("--");
    const blobMessages = await readBlobChatThread(leftRollNumber, rightRollNumber);

    for (const message of blobMessages) {
      viewMessages.push(
        createMessage({
          id: message.id,
          senderId: message.senderRollNumber,
          receiverId: message.receiverRollNumber,
          content: message.content,
          createdAt: message.createdAt,
          sender: createContact({
            id: message.senderRollNumber,
            fullName: message.senderName,
            company: message.senderRole === "ALUMNI" ? "Alumni Mentor" : null,
            branch: "CSE (AI & ML)",
            role: message.senderRole,
          }),
          receiver: createContact({
            id: message.receiverRollNumber,
            fullName: message.receiverName,
            company: message.receiverRole === "ALUMNI" ? "Alumni Mentor" : null,
            branch: "CSE (AI & ML)",
            role: message.receiverRole,
          }),
          attachments: message.attachments ?? [],
        }),
      );
    }
  }

  const demoMessages = demoChatThreads
    .filter((thread) =>
      profile.role === "STUDENT"
        ? thread.studentRollNumber === profile.rollNumber ||
          (profile.email ? thread.studentEmail.toLowerCase() === profile.email.toLowerCase() : false)
        : thread.alumniRollNumber === profile.rollNumber ||
          (profile.email ? thread.alumniEmail.toLowerCase() === profile.email.toLowerCase() : false),
    )
    .flatMap((thread, threadIndex) =>
      thread.messages.map((message, messageIndex) => {
        const student = createContact({
          id: thread.studentRollNumber,
          fullName: thread.studentRollNumber,
          company: null,
          branch: "CSE (AI & ML)",
          role: "STUDENT",
        });
        const alumni = createContact({
          id: thread.alumniRollNumber,
          fullName: thread.alumniName,
          company: "Alumni Mentor",
          branch: "CSE (AI & ML)",
          role: "ALUMNI",
        });
        const sender = profile.role === "STUDENT"
          ? message.side === "me"
            ? createContact({
                id: profile.rollNumber,
                fullName: profile.fullName,
                company: profile.company,
                branch: profile.branch,
                role: profile.role,
              })
            : alumni
          : message.side === "me"
            ? createContact({
                id: profile.rollNumber,
                fullName: profile.fullName,
                company: profile.company,
                branch: profile.branch,
                role: profile.role,
              })
            : student;
        const receiver = sender.id === student.id ? alumni : student;

        return createMessage({
          id: `demo-chat-${threadIndex}-${messageIndex}`,
          senderId: sender.id,
          receiverId: receiver.id,
          content: message.text,
          createdAt: `2026-04-21T${messageIndex.toString().padStart(2, "0")}:15:00+05:30`,
          sender,
          receiver,
        });
      }),
    );

  viewMessages.push(...demoMessages);

  const contactMap = new Map<string, ChatContact>();

  for (const contact of suggestedContacts) {
    contactMap.set(contact.id, contact);
  }

  for (const message of viewMessages) {
    contactMap.set(message.sender.id, message.sender);
    contactMap.set(message.receiver.id, message.receiver);
  }

  const uniqueMessages = [...new Map(viewMessages.map((message) => [message.id, message])).values()].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );

  const threadMap = new Map<string, ChatThread>();

  for (const message of uniqueMessages) {
    const counterpart = message.senderId === profile.rollNumber ? message.receiver : message.sender;
    threadMap.set(counterpart.id, {
      profile: counterpart,
      preview: message.content,
      updatedAt: message.createdAt,
    });
  }

  for (const contact of contactMap.values()) {
    if (contact.id === profile.rollNumber) {
      continue;
    }

    if (!threadMap.has(contact.id)) {
      threadMap.set(contact.id, {
        profile: contact,
        preview: "Mentorship chat unlocked",
        updatedAt: new Date(0).toISOString(),
      });
    }
  }

  const threads = [...threadMap.values()].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
  const activeThread = threads.find((thread) => thread.profile.id === withParam)?.profile ?? threads[0]?.profile ?? null;
  const activeMessages = activeThread
    ? uniqueMessages.filter(
        (message) =>
          (message.senderId === profile.rollNumber && message.receiverId === activeThread.id) ||
          (message.receiverId === profile.rollNumber && message.senderId === activeThread.id),
      )
    : [];

  return {
    profile,
    threads,
    activeThread,
    activeMessages,
  };
}
