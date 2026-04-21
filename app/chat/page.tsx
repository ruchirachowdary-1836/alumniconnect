import Link from "next/link";

import { getCurrentProfile, getSignedInIdentity } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chatMessages, demoChatThreads, demoMentorshipRequests } from "@/lib/demo-content";
import { extractInstitutionRollNumber, inferNameFromEmail } from "@/lib/identity";

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  let profile = null;

  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null;
  }

  if (!profile) {
    const { email, fullName } = await getSignedInIdentity();
    const inferredRollNumber = extractInstitutionRollNumber(email);

    if (email && inferredRollNumber) {
      const isDemoStudent = demoChatThreads.some(
        (thread) => thread.studentEmail.toLowerCase() === email.toLowerCase(),
      );
      const isDemoAlumni = demoChatThreads.some(
        (thread) => thread.alumniEmail.toLowerCase() === email.toLowerCase(),
      );

      if (isDemoStudent || isDemoAlumni) {
        profile = {
          id: inferredRollNumber,
          clerkUserId: null,
          email,
          role: isDemoStudent ? "STUDENT" : "ALUMNI",
          fullName: fullName || inferNameFromEmail(email) || inferredRollNumber,
          rollNumber: inferredRollNumber,
          batchYear: null,
          branch: "CSE (AI & ML)",
          company: isDemoStudent ? null : "Alumni Mentor",
          packageLpa: null,
          drivesAttended: null,
          backlogs: null,
          internship: null,
          mentorAreas: null,
          bio: null,
          acceptedGuidelines: true,
          isMentorActive: isDemoAlumni,
        };
      }
    }
  }

  if (!profile) {
    return (
      <>
        <section className="page-band">
          <div className="shell page-band-inner">
            <h1 className="page-title">Chat</h1>
            <p className="page-lead">Direct conversations between students and alumni mentors.</p>
          </div>
        </section>

        <section className="page-section">
          <div className="shell">
            <div className="empty-state">
              No chats available yet.
            </div>
          </div>
        </section>
      </>
    );
  }

  const params = (await searchParams) ?? {};
  const withParam = Array.isArray(params.with) ? params.with[0] : params.with;

  let messages: Array<{
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt: Date;
    sender: { id: string; fullName: string; company: string | null; branch: string | null; role: string };
    receiver: { id: string; fullName: string; company: string | null; branch: string | null; role: string };
  }> = [];
  let suggestedContacts: Array<{ id: string; fullName: string; company: string | null; branch: string | null; role: string }> = [];

  try {
    const acceptedRequests = await prisma.mentorshipRequest.findMany({
      where:
        profile.role === "STUDENT"
          ? { studentId: profile.id, status: "ACCEPTED" }
          : { alumniId: profile.id, status: "ACCEPTED" },
      include: {
        student: true,
        alumni: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const allowedContactIds = acceptedRequests.map((request) =>
      profile.role === "STUDENT" ? request.alumni.id : request.student.id,
    );

    [messages, suggestedContacts] = await Promise.all([
      prisma.chatMessage.findMany({
        where: {
          OR: [{ senderId: profile.id }, { receiverId: profile.id }],
        },
        include: {
          sender: true,
          receiver: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      allowedContactIds.length === 0
        ? Promise.resolve([])
        : prisma.userProfile.findMany({
            where: {
              id: { in: allowedContactIds },
            },
            orderBy: { fullName: "asc" },
          }),
    ]);
  } catch {
    suggestedContacts = [];
    const activeContact = null;
    messages = activeContact
      ? chatMessages.map((message, index) => ({
          id: `fallback-message-${index}`,
          senderId: message.side === "me" ? profile.id : activeContact.id,
          receiverId: message.side === "me" ? activeContact.id : profile.id,
          content: message.text,
          createdAt: new Date(`2026-04-18T${message.time.includes("PM") ? "12:03:00" : "00:33:00"}+05:30`),
          sender:
            message.side === "me"
              ? {
                  id: profile.id,
                  fullName: profile.fullName,
                  company: profile.company,
                  branch: profile.branch,
                  role: profile.role,
                }
              : {
                  id: activeContact.id,
                  fullName: activeContact.fullName,
                  company: activeContact.company,
                  branch: activeContact.branch,
                  role: activeContact.role,
                },
          receiver:
            message.side === "me"
              ? {
                  id: activeContact.id,
                  fullName: activeContact.fullName,
                  company: activeContact.company,
                  branch: activeContact.branch,
                  role: activeContact.role,
                }
              : {
                  id: profile.id,
                  fullName: profile.fullName,
                  company: profile.company,
                  branch: profile.branch,
                  role: profile.role,
                },
        }))
      : [];
  }

  const demoAcceptedContacts = demoMentorshipRequests
    .filter((request) => request.status === "ACCEPTED")
    .filter((request) =>
      profile.role === "STUDENT"
        ? request.studentRollNumber === profile.rollNumber ||
          (profile.email ? request.studentEmail.toLowerCase() === profile.email.toLowerCase() : false)
        : request.alumniRollNumber === profile.rollNumber ||
          (profile.email ? request.alumniEmail?.toLowerCase() === profile.email.toLowerCase() : false),
    )
    .map((request) =>
      profile.role === "STUDENT"
        ? {
            id: request.alumniRollNumber,
            fullName: request.alumniName,
            company: "Alumni Mentor",
            branch: "CSE (AI & ML)",
            role: "ALUMNI",
          }
        : {
            id: request.studentRollNumber,
            fullName: request.studentName,
            company: null,
            branch: "CSE (AI & ML)",
            role: "STUDENT",
          },
    );

  for (const demoContact of demoAcceptedContacts) {
    if (!suggestedContacts.some((contact) => contact.id === demoContact.id)) {
      suggestedContacts.push(demoContact);
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
        const studentId = thread.studentRollNumber;
        const alumniId = thread.alumniRollNumber;
        const studentProfile = {
          id: studentId,
          fullName: thread.studentRollNumber,
          company: null,
          branch: "CSE (AI & ML)",
          role: "STUDENT",
        };
        const alumniProfile = {
          id: alumniId,
          fullName: thread.alumniName,
          company: "Alumni Mentor",
          branch: "CSE (AI & ML)",
          role: "ALUMNI",
        };
        const senderIsCurrentUser =
          profile.role === "STUDENT" ? message.side === "me" : message.side === "them";

        return {
          id: `demo-chat-${threadIndex}-${messageIndex}`,
          senderId: senderIsCurrentUser ? profile.id : profile.role === "STUDENT" ? alumniId : studentId,
          receiverId: senderIsCurrentUser ? (profile.role === "STUDENT" ? alumniId : studentId) : profile.id,
          content: message.text,
          createdAt: new Date(`2026-04-21T${message.time.includes("PM") ? "13:15:00" : "10:15:00"}+05:30`),
          sender: senderIsCurrentUser
            ? {
                id: profile.id,
                fullName: profile.fullName,
                company: profile.company,
                branch: profile.branch,
                role: profile.role,
              }
            : profile.role === "STUDENT"
              ? alumniProfile
              : studentProfile,
          receiver: senderIsCurrentUser
            ? profile.role === "STUDENT"
              ? alumniProfile
              : studentProfile
            : {
                id: profile.id,
                fullName: profile.fullName,
                company: profile.company,
                branch: profile.branch,
                role: profile.role,
              },
        };
      }),
    );

  messages = [...messages, ...demoMessages];

  const threadMap = new Map<
    string,
    {
      profile: (typeof suggestedContacts)[number];
      preview: string;
      updatedAt: Date;
    }
  >();

  for (const message of messages) {
    const counterpart = message.senderId === profile.id ? message.receiver : message.sender;
    threadMap.set(counterpart.id, {
      profile: counterpart,
      preview: message.content,
      updatedAt: message.createdAt,
    });
  }

  for (const candidate of suggestedContacts) {
    if (!threadMap.has(candidate.id)) {
      threadMap.set(candidate.id, {
        profile: candidate,
        preview:
          "Mentorship chat unlocked",
        updatedAt: new Date(0),
      });
    }
  }

  const threads = [...threadMap.values()].sort(
    (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
  );
  const activeThread =
    threads.find((thread) => thread.profile.id === withParam) ?? threads[0] ?? null;
  const activeMessages = activeThread
    ? messages.filter(
        (message) =>
          (message.senderId === profile.id && message.receiverId === activeThread.profile.id) ||
          (message.receiverId === profile.id && message.senderId === activeThread.profile.id),
      )
    : [];

  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">Chat</h1>
          <p className="page-lead">Direct conversations between students and alumni mentors.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell">
          <div className="chat-shell">
            <aside className="chat-sidebar">
              <div className="section-header" style={{ marginBottom: 12 }}>
                <div>
                  <h3 className="panel-title">Chats</h3>
                </div>
                <span className="tab-pill">{threads.length}</span>
              </div>

              {threads.map((thread) => (
                <Link
                  key={thread.profile.id}
                  href={`/chat?with=${thread.profile.id}`}
                  className={`chat-list-item ${activeThread?.profile.id === thread.profile.id ? "active" : ""}`}
                >
                  <strong>{thread.profile.fullName}</strong>
                  <p className="small muted" style={{ margin: "6px 0 0" }}>
                    {thread.preview}
                  </p>
                </Link>
              ))}
            </aside>

            <section className="chat-main">
              {activeThread ? (
                <>
                  <div className="chat-header">
                    <strong>{activeThread.profile.fullName}</strong>
                    <p className="small muted" style={{ margin: "6px 0 0" }}>
                      {activeThread.profile.company ||
                        activeThread.profile.branch ||
                        activeThread.profile.role}
                    </p>
                  </div>

                  <div className="chat-thread">
                    {activeMessages.length === 0 ? (
                      <div className="empty-state" style={{ padding: 0 }}>
                        No messages yet. Your accepted mentorship chat is ready below.
                      </div>
                    ) : (
                      activeMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`bubble ${message.senderId === profile.id ? "me" : "them"}`}
                        >
                          {message.content}
                          <div className="small" style={{ marginTop: 6, opacity: 0.8 }}>
                            {formatTime(message.createdAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <form action="/api/chat" method="post" className="chat-compose">
                    <input type="hidden" name="receiverId" value={activeThread.profile.id} />
                    <input name="content" required placeholder="Type a message..." />
                    <button className="button button-secondary" type="submit">
                      Send
                    </button>
                  </form>
                </>
              ) : (
                <div className="empty-state">
                  Chat opens automatically after a mentorship request is accepted by the alumni mentor.
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
