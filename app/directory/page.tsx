import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth";
import { getAdminAccess } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { alumniSeed } from "@/lib/seed-data";

type DirectoryMentor = {
  id: string;
  fullName: string;
  company: string | null;
  packageLpa: number | null;
  branch: string | null;
  batchYear: number | null;
  bio: string | null;
  email: string | null;
  isMentorActive: boolean;
  mentorAreas: string | null;
  rollNumber: string;
};

function fallbackMentors(): DirectoryMentor[] {
  return alumniSeed.map((alumni) => ({
    id: alumni.rollNumber,
    fullName: alumni.name,
    company: alumni.company ?? null,
    packageLpa: alumni.packageLpa ?? null,
    branch: alumni.branch ?? null,
    batchYear: alumni.graduationYear ?? null,
    bio: null,
    email: null,
    isMentorActive: false,
    mentorAreas: alumni.mentorAreas?.join(", ") ?? null,
    rollNumber: alumni.rollNumber,
  }));
}

export default async function DirectoryPage({
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

  if (profile?.role === "ALUMNI") {
    return redirect("/alumni/dashboard");
  }

  const adminAccess = await getAdminAccess();
  const canRequestMentorship = profile?.role !== "ALUMNI" && !adminAccess.isAdmin;
  const params = (await searchParams) ?? {};
  const query = Array.isArray(params.q) ? params.q[0] : params.q;
  const company = Array.isArray(params.company) ? params.company[0] : params.company;
  const batch = Array.isArray(params.batch) ? params.batch[0] : params.batch;

  let mentors: DirectoryMentor[] = fallbackMentors();

  try {
    const dbMentors = await prisma.userProfile.findMany({
      where: {
        role: "ALUMNI",
      },
      orderBy: [{ packageLpa: "desc" }, { fullName: "asc" }],
    });

    if (dbMentors.length > 0) {
      mentors = dbMentors;
    }
  } catch {
    mentors = fallbackMentors();
  }

  const companyOptions = [
    "All Companies",
    ...new Set(mentors.map((mentor) => mentor.company).filter((value): value is string => Boolean(value))),
  ];

  const batchOptions = [
    "All Batches",
    ...new Set(mentors.map((mentor) => mentor.batchYear).filter((value): value is number => Boolean(value))).values(),
  ];

  const normalizedQuery = query?.trim().toLowerCase() ?? "";
  const filteredMentors = mentors.filter((mentor) => {
    const matchesQuery =
      !normalizedQuery ||
      [mentor.fullName, mentor.company, mentor.mentorAreas, mentor.rollNumber]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery));

    const matchesCompany = !company || company === "All Companies" || mentor.company === company;
    const matchesBatch =
      !batch || batch === "All Batches" || mentor.batchYear?.toString() === batch;

    return matchesQuery && matchesCompany && matchesBatch;
  });

  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">Alumni Directory</h1>
          <p className="page-lead">
            Explore our network of alumni across top companies and diverse expertise areas.
          </p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell">
          <form method="get" className="search-row">
            <input
              name="q"
              defaultValue={query ?? ""}
              placeholder="Search by name, company, or skill..."
            />
            <select name="company" defaultValue={company ?? "All Companies"}>
              {companyOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <select name="batch" defaultValue={batch ?? "All Batches"}>
              {batchOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <button className="button button-secondary" type="submit">
              Filter
            </button>
          </form>

          <p className="subtle-count">{filteredMentors.length} alumni found</p>

          {filteredMentors.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 18 }}>
              No alumni records are available yet.
            </div>
          ) : (
            <div className="directory-grid" style={{ marginTop: 18 }}>
              {filteredMentors.map((mentor) => (
                <article key={mentor.id} className="mentor-card">
                  <div className="mentor-card-top">
                    <div className="mentor-card-head">
                      <div className="avatar">{mentor.fullName.charAt(0)}</div>
                      <div>
                        <h3>{mentor.fullName}</h3>
                        <p className="muted">
                          {mentor.company || "Alumni Mentor"} {mentor.packageLpa ? `- ${mentor.packageLpa} LPA` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="availability-badge">
                      {mentor.isMentorActive && mentor.email ? "Available" : "Imported"}
                    </span>
                  </div>

                  <div className="meta-row">
                    {mentor.branch ? <span className="meta-chip">{mentor.branch}</span> : null}
                    {mentor.batchYear ? <span className="meta-chip">Batch {mentor.batchYear}</span> : null}
                  </div>

                  <p className="card-copy">
                    {mentor.bio ||
                      "Open to placement strategy, resume reviews, mock interviews, and company-specific guidance."}
                  </p>

                  <div className="split-actions">
                    <Link
                      href={`/mentors/${mentor.rollNumber}`}
                      className="button button-subtle request-action"
                    >
                      View Profile
                    </Link>
                    {canRequestMentorship ? (
                      <Link
                        href={`/mentors/${mentor.rollNumber}#request-mentorship`}
                        className="button button-secondary request-action"
                      >
                        Request Mentorship
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
