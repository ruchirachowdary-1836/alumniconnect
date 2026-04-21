import { NextRequest, NextResponse } from "next/server";

import { auth, clerkClient } from "@clerk/nextjs/server";

import { getSignedInIdentity } from "@/lib/auth";
import { sendMentorshipRequestEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { extractInstitutionRollNumber, inferNameFromEmail } from "@/lib/identity";
import { appendPortalMentorshipRequest, readPortalMentorshipRequests } from "@/lib/portal-store";
import { ensureSeedData } from "@/lib/seed";
import { alumniSeed, studentSeed } from "@/lib/seed-data";

export async function POST(request: NextRequest) {
  try {
    await ensureSeedData();
  } catch {
    // Production may run on a read-only or reset SQLite filesystem on Vercel.
    // Continue with the metadata fallback path instead of failing the request.
  }
  const { userId } = await auth();
  const { email: signedInEmail, fullName: signedInFullName } = await getSignedInIdentity();

  const formData = await request.formData();
  const alumniId = formData.get("alumniId")?.toString();
  const alumniRollNumber = formData.get("alumniRollNumber")?.toString().trim().toUpperCase();
  const studentRollNumber = formData.get("studentRollNumber")?.toString().trim().toUpperCase();
  const studentName = formData.get("studentName")?.toString().trim() || signedInFullName || "";
  const studentEmail = formData.get("studentEmail")?.toString().trim().toLowerCase() || signedInEmail?.toLowerCase() || "";
  const subject = formData.get("subject")?.toString().trim() || "Mentorship Request";
  const goals =
    formData.get("goals")?.toString().trim() ||
    "I would like guidance on placements, interview preparation, and career planning.";
  const message =
    formData.get("message")?.toString().trim() ||
    "I am interested in connecting for mentorship and would appreciate your guidance.";
  const preferredMode = formData.get("preferredMode")?.toString().trim() || "Google Meet";
  const availability = formData.get("availability")?.toString().trim();

  if ((!alumniId && !alumniRollNumber)) {
    return NextResponse.redirect(new URL("/directory", request.url));
  }

  let student = null;

  if (userId) {
    try {
      student = await prisma.userProfile.findUnique({
        where: { clerkUserId: userId },
      });
    } catch {
      student = null;
    }

    if (!student && studentEmail) {
      try {
        student = await prisma.userProfile.findUnique({
          where: { email: studentEmail },
        });
      } catch {
        student = null;
      }

      if (student && !student.clerkUserId) {
        try {
          student = await prisma.userProfile.update({
            where: { id: student.id },
            data: { clerkUserId: userId },
          });
        } catch {
          // Keep the matched student profile even if the Clerk ID sync cannot be saved.
        }
      }
    }
  }

  if (student?.role !== "STUDENT") {
    student = null;
  }

  const fallbackStudentRollNumber =
    studentRollNumber ||
    extractInstitutionRollNumber(studentEmail) ||
    (userId ? `CLERK-${userId.slice(0, 12).toUpperCase()}` : "");

  if (!student) {
    if (!studentName || !studentEmail) {
      return NextResponse.redirect(new URL("/directory", request.url));
    }

    const importedStudent = studentSeed.find((item) => item.rollNumber === fallbackStudentRollNumber);

    try {
      student = await prisma.userProfile.upsert({
        where: { rollNumber: fallbackStudentRollNumber },
        update: {
          role: "STUDENT",
          fullName: studentName || importedStudent?.name || "Student",
          email: studentEmail,
          batchYear: 2026,
          backlogs: importedStudent?.backlogs ?? undefined,
          drivesAttended: importedStudent?.drivesAttended ?? undefined,
          internship: importedStudent?.internship ?? undefined,
          clerkUserId: userId ?? undefined,
        },
        create: {
          role: "STUDENT",
          fullName: studentName || importedStudent?.name || "Student",
          rollNumber: fallbackStudentRollNumber,
          email: studentEmail,
          batchYear: 2026,
          backlogs: importedStudent?.backlogs ?? undefined,
          drivesAttended: importedStudent?.drivesAttended ?? undefined,
          internship: importedStudent?.internship ?? undefined,
          clerkUserId: userId ?? undefined,
        },
      });
    } catch {
      student = {
        id: `clerk-student-${userId || fallbackStudentRollNumber || "guest"}`,
        role: "STUDENT",
        fullName: studentName || importedStudent?.name || inferNameFromEmail(studentEmail) || "Student",
        rollNumber: fallbackStudentRollNumber || "STUDENT",
        email: studentEmail,
      };
    }
  }

  let alumni = null;

  if (alumniId) {
    try {
      alumni = await prisma.userProfile.findUnique({
        where: { id: alumniId },
      });
    } catch {
      alumni = null;
    }
  }

  if (!alumni && alumniRollNumber) {
    try {
      alumni = await prisma.userProfile.findUnique({
        where: { rollNumber: alumniRollNumber },
      });
    } catch {
      alumni = null;
    }
  }

  if (!alumni && alumniRollNumber) {
    const importedAlumni = alumniSeed.find((item) => item.rollNumber === alumniRollNumber);

    if (importedAlumni) {
      try {
        alumni = await prisma.userProfile.upsert({
          where: { rollNumber: importedAlumni.rollNumber },
          update: {
            role: "ALUMNI",
            fullName: importedAlumni.name,
            email: importedAlumni.email ?? undefined,
            branch: importedAlumni.branch ?? undefined,
            batchYear: importedAlumni.graduationYear ?? undefined,
            company: importedAlumni.company ?? undefined,
            packageLpa: importedAlumni.packageLpa ?? undefined,
            mentorAreas: importedAlumni.mentorAreas?.join(", ") ?? undefined,
            isMentorActive: true,
          },
          create: {
            role: "ALUMNI",
            fullName: importedAlumni.name,
            email: importedAlumni.email ?? undefined,
            rollNumber: importedAlumni.rollNumber,
            branch: importedAlumni.branch ?? undefined,
            batchYear: importedAlumni.graduationYear ?? undefined,
            company: importedAlumni.company ?? undefined,
            packageLpa: importedAlumni.packageLpa ?? undefined,
            mentorAreas: importedAlumni.mentorAreas?.join(", ") ?? undefined,
            isMentorActive: true,
          },
        });
      } catch {
        alumni = {
          id: importedAlumni.rollNumber,
          role: "ALUMNI",
          fullName: importedAlumni.name,
          email: importedAlumni.email ?? null,
          rollNumber: importedAlumni.rollNumber,
          branch: importedAlumni.branch ?? null,
          batchYear: importedAlumni.graduationYear ?? null,
          company: importedAlumni.company ?? null,
          packageLpa: importedAlumni.packageLpa ?? null,
          mentorAreas: importedAlumni.mentorAreas?.join(", ") ?? null,
          isMentorActive: true,
          clerkUserId: null,
        };
      }
    } else if (extractInstitutionRollNumber(alumniRollNumber) === alumniRollNumber) {
      alumni = {
        id: alumniRollNumber,
        role: "ALUMNI",
        fullName: alumniRollNumber,
        email: `${alumniRollNumber.toLowerCase()}@bvrithyderabad.edu.in`,
        rollNumber: alumniRollNumber,
        branch: "CSE (AI & ML)",
        batchYear: null,
        company: "Alumni Mentor",
        packageLpa: null,
        mentorAreas: "Placements, Interview Prep, Career Planning",
        isMentorActive: true,
        clerkUserId: null,
      };
    }
  }

  if (!alumni || alumni.role !== "ALUMNI") {
    return NextResponse.redirect(new URL("/directory", request.url));
  }

  try {
    const existingRequest = await prisma.mentorshipRequest.findFirst({
      where: {
        alumniId: alumni.id,
        studentId: student.id,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.redirect(new URL(`/mentors/${alumni.rollNumber}?requested=1`, request.url));
    }
  } catch {
    // Ignore DB lookup failures and continue to fallback storage.
  }

  try {
    const storedRequests = await readPortalMentorshipRequests();
    const alreadyExists = storedRequests.some(
      (item) =>
        item.studentRollNumber === student.rollNumber &&
        item.alumniRollNumber === alumni.rollNumber &&
        item.status === "PENDING",
    );

    if (alreadyExists) {
      return NextResponse.redirect(new URL(`/mentors/${alumni.rollNumber}?requested=1`, request.url));
    }
  } catch {
    // Ignore fallback read failures.
  }

  const portalRequestPayload = {
    id: `portal-${crypto.randomUUID()}`,
    studentName: student.fullName,
    studentRollNumber: student.rollNumber,
    studentEmail: student.email,
    alumniName: alumni.fullName,
    alumniRollNumber: alumni.rollNumber,
    subject,
    goals,
    message,
    preferredMode,
    availability: availability || "",
    status: "PENDING",
    createdAt: new Date().toISOString(),
    source: "portal-store",
  };

  let requestSaved = false;

  try {
    await prisma.mentorshipRequest.create({
      data: {
        alumniId: alumni.id,
        studentId: student.id,
        subject,
        goals,
        message,
        preferredMode,
        availability,
      },
    });
    requestSaved = true;
  } catch {
    requestSaved = false;
  }

  if (requestSaved) {
    await appendPortalMentorshipRequest(portalRequestPayload);
  }

  if (!requestSaved && alumni.clerkUserId) {
    try {
      const client = await clerkClient();
      const alumniUser = await client.users.getUser(alumni.clerkUserId);
      const privateMetadata = (alumniUser.privateMetadata ?? {}) as Record<string, unknown>;
      const inbox = Array.isArray(privateMetadata.alumniInbox)
        ? (privateMetadata.alumniInbox as Array<Record<string, unknown>>)
        : [];

      const alreadyExists = inbox.some(
        (item) =>
          item.studentRollNumber === student.rollNumber &&
          item.alumniRollNumber === alumni.rollNumber &&
          item.status === "PENDING",
      );

      if (!alreadyExists) {
        await client.users.updateUserMetadata(alumni.clerkUserId, {
          privateMetadata: {
            ...privateMetadata,
            alumniInbox: [
              ...inbox,
              {
                id: `meta-${crypto.randomUUID()}`,
                studentName: student.fullName,
                studentRollNumber: student.rollNumber,
                studentEmail: student.email,
                alumniName: alumni.fullName,
                alumniRollNumber: alumni.rollNumber,
                subject,
                goals,
                message,
                preferredMode,
                availability: availability || "",
                status: "PENDING",
                createdAt: new Date().toISOString(),
                source: "metadata",
              },
            ],
          },
        });
      }
      requestSaved = true;
    } catch {
      requestSaved = false;
    }
  }

  if (!requestSaved) {
    requestSaved = await appendPortalMentorshipRequest(portalRequestPayload);
  }

  if (!requestSaved) {
    return NextResponse.redirect(new URL(`/mentors/${alumni.rollNumber}?error=1`, request.url));
  }

  if (alumni.email) {
    try {
      await sendMentorshipRequestEmail({
        alumniEmail: alumni.email,
        alumniName: alumni.fullName,
        studentName: student.fullName,
        subject,
        goals,
        message,
      });
    } catch {
      // Do not fail the mentorship request if email delivery is unavailable.
    }
  }

  return NextResponse.redirect(new URL(`/mentors/${alumni.rollNumber}?requested=1`, request.url));
}
