import { prisma } from "@/lib/db";
import { alumniSeed, studentSeed } from "@/lib/seed-data";

let hasSeeded = false;

export async function ensureSeedData() {
  if (hasSeeded) {
    return;
  }

  await Promise.all(
    alumniSeed.map((alumni) =>
      prisma.userProfile.upsert({
        where: { rollNumber: alumni.rollNumber },
        create: {
          role: "ALUMNI",
          fullName: alumni.name,
          rollNumber: alumni.rollNumber,
          batchYear: alumni.graduationYear,
          branch: alumni.branch,
          company: alumni.company,
          packageLpa: alumni.packageLpa,
          mentorAreas: alumni.mentorAreas?.join(", "),
          isMentorActive: false,
        },
        update: {
          fullName: alumni.name,
          batchYear: alumni.graduationYear,
          branch: alumni.branch,
          company: alumni.company,
          packageLpa: alumni.packageLpa,
          mentorAreas: alumni.mentorAreas?.join(", "),
        },
      }),
    ),
  );

  await Promise.all(
    studentSeed.map((student) =>
      prisma.userProfile.upsert({
        where: { rollNumber: student.rollNumber },
        create: {
          role: "STUDENT",
          fullName: student.name,
          rollNumber: student.rollNumber,
          branch: "CSE (AI & ML)",
          batchYear: 2026,
          backlogs: student.backlogs,
          drivesAttended: student.drivesAttended,
          internship: student.internship ?? undefined,
          isMentorActive: false,
        },
        update: {
          fullName: student.name,
          backlogs: student.backlogs,
          drivesAttended: student.drivesAttended,
          internship: student.internship ?? undefined,
        },
      }),
    ),
  );

  hasSeeded = true;
}
