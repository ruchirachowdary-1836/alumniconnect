import { getAdminAccess } from "@/lib/admin-auth";
import { getCurrentProfile } from "@/lib/auth";
import { resolveChatProfile } from "@/lib/chat-service";
import { EventsBoard } from "@/components/events-board";
import { getEvents } from "@/lib/events-data";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const adminAccess = await getAdminAccess();
  let profile = null;

  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null;
  }
  if (!profile) {
    profile = await resolveChatProfile();
  }
  const params = (await searchParams) ?? {};
  const typeParam = Array.isArray(params.type) ? params.type[0] : params.type;
  const activeType = typeParam || "All";
  const canPost = profile?.role === "ALUMNI" || adminAccess.isAdmin;
  const events = await getEvents(activeType);

  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">Events</h1>
          <p className="page-lead">Mentor meetups, career panels, placement workshops, and alumni sessions.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell">
          <EventsBoard initialEvents={events} activeType={activeType} canPost={canPost} />
        </div>
      </section>
    </>
  );
}
