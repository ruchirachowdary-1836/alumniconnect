import { getCurrentProfile, getSignedInIdentity } from "@/lib/auth";
import { getAdminAccess } from "@/lib/admin-auth";
import { resolveChatProfile } from "@/lib/chat-service";
import { ForumBoard } from "@/components/forum-board";
import { forumCategories, getForumPosts } from "@/lib/forum-data";

export default async function ForumPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  let profile = null;
  const adminAccess = await getAdminAccess();

  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null;
  }

  if (!profile) {
    profile = await resolveChatProfile();
  }

  if (!profile && adminAccess.isAdmin) {
    const { email, fullName } = await getSignedInIdentity();
    profile = {
      id: "faculty-forum",
      clerkUserId: null,
      email,
      role: "FACULTY",
      fullName: fullName || adminAccess.email || "Faculty Admin",
      rollNumber: "FACULTY",
    };
  }
  const params = (await searchParams) ?? {};
  const categoryParam = Array.isArray(params.category) ? params.category[0] : params.category;
  const activeCategory =
    categoryParam && forumCategories.includes(categoryParam as (typeof forumCategories)[number])
      ? categoryParam
      : "All";
  const posts = await getForumPosts(activeCategory);

  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">Discussion Forum</h1>
          <p className="page-lead">Ask questions, share insights, and connect with the community.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell">
          <ForumBoard
            initialPosts={posts}
            categories={forumCategories}
            activeCategory={activeCategory}
            profile={profile ? { fullName: profile.fullName, role: profile.role } : null}
            isAdmin={adminAccess.isAdmin}
          />
        </div>
      </section>
    </>
  );
}
