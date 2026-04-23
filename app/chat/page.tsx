import { ChatWorkspace } from "@/components/chat-workspace";
import { getChatView } from "@/lib/chat-service";

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const withParam = Array.isArray(params.with) ? params.with[0] : params.with;
  const initialView = await getChatView(withParam);

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
          {!initialView.profile ? (
            <div className="empty-state">No chats available yet.</div>
          ) : (
            <ChatWorkspace initialView={initialView} initialWith={withParam} />
          )}
        </div>
      </section>
    </>
  );
}
