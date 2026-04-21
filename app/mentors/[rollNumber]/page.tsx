import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentProfile, getSafeAuth, getSignedInIdentity } from "@/lib/auth";
import { getAdminAccess } from "@/lib/admin-auth";
import { isClerkConfigured } from "@/lib/auth-config";
import { prisma } from "@/lib/db";
import { extractInstitutionRollNumber } from "@/lib/identity";
import { alumniSeed } from "@/lib/seed-data";

type MentorProfile = {
  id: string;
  role: string;
  fullName: string;
  company: string | null;
  packageLpa: number | null;
  batchYear: number | null;
  branch: string | null;
  mentorAreas: string | null;
  bio: string | null;
  isMentorActive: boolean;
  email: string | null;
  rollNumber: string;
};

export default async function MentorProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ rollNumber: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { rollNumber } = await params;
  const query = (await searchParams) ?? {};
  const requested = (Array.isArray(query.requested) ? query.requested[0] : query.requested) === "1";
  const requestError = (Array.isArray(query.error) ? query.error[0] : query.error) === "1";
  let mentor: MentorProfile | null = null;
  const importedAlumni = alumniSeed.find((item) => item.rollNumber === rollNumber);

  try {
    mentor = await prisma.userProfile.findUnique({
      where: { rollNumber },
    });
  } catch {
    mentor = null;
  }

  if (!mentor && importedAlumni) {
    mentor = {
      id: importedAlumni.rollNumber,
      role: "ALUMNI",
      fullName: importedAlumni.name,
      company: importedAlumni.company ?? null,
      packageLpa: importedAlumni.packageLpa ?? null,
      batchYear: importedAlumni.graduationYear ?? null,
      branch: importedAlumni.branch ?? null,
      mentorAreas: importedAlumni.mentorAreas?.join(", ") ?? null,
      bio: null,
      isMentorActive: false,
      email: null,
      rollNumber: importedAlumni.rollNumber,
    };
  }

  if (!mentor && !importedAlumni && extractInstitutionRollNumber(rollNumber) === rollNumber.toUpperCase()) {
    mentor = {
      id: rollNumber,
      role: "ALUMNI",
      fullName: rollNumber,
      company: "Alumni Mentor",
      packageLpa: null,
      batchYear: null,
      branch: "CSE (AI & ML)",
      mentorAreas: "Placements, Interview Prep, Career Planning",
      bio: null,
      isMentorActive: true,
      email: `${rollNumber.toLowerCase()}@bvrithyderabad.edu.in`,
      rollNumber: rollNumber.toUpperCase(),
    };
  }

  if (mentor && importedAlumni) {
    mentor = {
      ...mentor,
      fullName: mentor.fullName?.trim() || importedAlumni.name,
      company: mentor.company ?? importedAlumni.company ?? null,
      packageLpa: mentor.packageLpa ?? importedAlumni.packageLpa ?? null,
      batchYear: mentor.batchYear ?? importedAlumni.graduationYear ?? null,
      branch: mentor.branch ?? importedAlumni.branch ?? null,
      mentorAreas: mentor.mentorAreas ?? importedAlumni.mentorAreas?.join(", ") ?? null,
    };
  }

  if (!mentor || mentor.role !== "ALUMNI") {
    redirect("/directory");
  }

  const canAcceptRequests = Boolean(mentor.isMentorActive || importedAlumni);

  const { userId } = await getSafeAuth();
  const { email: signedInEmail, fullName: signedInFullName } = await getSignedInIdentity();
  const adminAccess = await getAdminAccess();
  let profile = null;

  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null;
  }

  const hasSignedInUser = Boolean(isClerkConfigured && userId);
  const isStudent = Boolean(hasSignedInUser && (!profile || profile.role === "STUDENT"));
  const isAlumni = Boolean(hasSignedInUser && profile?.role === "ALUMNI");
  const isFaculty = adminAccess.isAdmin;
  const defaultStudentName = profile?.fullName || signedInFullName || "";
  const defaultStudentRollNumber = profile?.rollNumber || "";
  const defaultStudentEmail = profile?.email || signedInEmail || "";
  const hasCompleteStudentDefaults = Boolean(defaultStudentName && defaultStudentRollNumber && defaultStudentEmail);

  return (
    <section className="page-section">
      <div className="shell two-column">
        <div className="dashboard-panel">
          <p className="eyebrow">Alumni Mentor</p>
          <h1
            className="page-title"
            style={{ fontSize: "clamp(2.1rem, 5vw, 3.4rem)", color: "#0e76a7" }}
          >
            {mentor.fullName || importedAlumni?.name || "Alumni Profile"}
          </h1>
          <p className="page-lead">
            {mentor.company} {mentor.packageLpa ? `- ${mentor.packageLpa} LPA` : ""}{" "}
            {mentor.batchYear ? `- Batch ${mentor.batchYear}` : ""}
          </p>

          <div className="meta-row">
            {mentor.branch ? <span className="meta-chip">{mentor.branch}</span> : null}
            {mentor.mentorAreas
              ? mentor.mentorAreas.split(",").map((area) => (
                  <span key={area.trim()} className="meta-chip">
                    {area.trim()}
                  </span>
                ))
              : null}
          </div>

          <p className="muted">
            {mentor.bio ||
              "This mentor is open to placement preparation, company-specific interview guidance, resume reviews, and career planning conversations."}
          </p>

          {canAcceptRequests && !isAlumni && !isFaculty ? (
            <div className="split-actions" style={{ marginTop: 16 }}>
              <form action="/api/mentorship" method="post">
                <input type="hidden" name="alumniId" value={mentor.id} />
                <input type="hidden" name="alumniRollNumber" value={mentor.rollNumber} />
                <input type="hidden" name="subject" value="Mentorship Request" />
                <input
                  type="hidden"
                  name="goals"
                  value="I would like guidance on placements, interview preparation, and career planning."
                />
                <input
                  type="hidden"
                  name="message"
                  value="I am interested in connecting for mentorship and would appreciate your guidance."
                />
                <input type="hidden" name="preferredMode" value="Google Meet" />
                {isStudent && hasCompleteStudentDefaults ? (
                  <>
                    <input type="hidden" name="studentName" value={defaultStudentName} />
                    <input type="hidden" name="studentRollNumber" value={defaultStudentRollNumber} />
                    <input type="hidden" name="studentEmail" value={defaultStudentEmail} />
                  </>
                ) : null}
                <button className="button button-primary" type="submit">
                  Request Mentorship
                </button>
              </form>
            </div>
          ) : null}

          {isAlumni && !isFaculty ? (
            <div className="split-actions" style={{ marginTop: 16 }}>
              <Link href="/alumni/dashboard" className="button button-secondary">
                Accept Mentorship
              </Link>
            </div>
          ) : null}

          {requested ? (
            <div className="comment-box" style={{ marginTop: 18 }}>
              <strong>Mentorship request sent.</strong>
              <p className="small muted" style={{ marginTop: 8 }}>
                The request has been added for this alumni mentor. Once accepted, chat can continue from the portal.
              </p>
            </div>
          ) : null}

          {requestError ? (
            <div className="comment-box" style={{ marginTop: 18 }}>
              <strong>Request could not be saved right now.</strong>
              <p className="small muted" style={{ marginTop: 8 }}>
                Please try once again. The portal is using a fallback save path, so a retry usually succeeds.
              </p>
            </div>
          ) : null}
        </div>

        <div className="form-panel">
          {isFaculty ? (
            <>
              <h3>Faculty View</h3>
              <div className="empty-state">
                Faculty can review this alumni profile as a directory record and manage mentorship visibility from the admin dashboard.
              </div>
            </>
          ) : isAlumni ? (
            <>
              <h3>Accept mentorship</h3>
              <div className="empty-state">
                Review incoming student requests from the alumni dashboard and accept them there.
              </div>
            </>
          ) : !isStudent || !hasCompleteStudentDefaults ? (
            <>
              <h3>Student Access</h3>
              <div className="empty-state">
                Sign in as a student to send the mentorship request instantly.
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
