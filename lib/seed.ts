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
          email: alumni.email,
          rollNumber: alumni.rollNumber,
          batchYear: alumni.graduationYear,
          branch: alumni.branch,
          company: alumni.company,
          packageLpa: alumni.packageLpa,
          mentorAreas: alumni.mentorAreas?.join(", "),
          isMentorActive: true,
        },
        update: {
          fullName: alumni.name,
          email: alumni.email,
          batchYear: alumni.graduationYear,
          branch: alumni.branch,
          company: alumni.company,
          packageLpa: alumni.packageLpa,
          mentorAreas: alumni.mentorAreas?.join(", "),
          isMentorActive: true,
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

  const [topMentor, careerMentor, placementMentor] = await Promise.all([
    prisma.userProfile.findUnique({ where: { rollNumber: "22WH1A6601" } }),
    prisma.userProfile.findUnique({ where: { rollNumber: "22WH1A6659" } }),
    prisma.userProfile.findUnique({ where: { rollNumber: "22WH1A6622" } }),
  ]);

  const [studentOne, studentTwo, studentThree] = await Promise.all([
    prisma.userProfile.findUnique({ where: { rollNumber: "22WH1A6602" } }),
    prisma.userProfile.findUnique({ where: { rollNumber: "22WH1A6628" } }),
    prisma.userProfile.findUnique({ where: { rollNumber: "23WH5A6601" } }),
  ]);

  if (topMentor && careerMentor && placementMentor) {
    const forumCount = await prisma.forumPost.count();

    if (forumCount === 0) {
      const mockInterviewPost = await prisma.forumPost.create({
        data: {
          title: "How should I prepare for the final HR plus technical combo round?",
          content:
            "I have cleared aptitude and coding rounds, but I still freeze in mixed technical and HR interviews. What structure helped you answer confidently?",
          category: "Interview Tips",
          authorId: placementMentor.id,
        },
      });

      const referralPost = await prisma.forumPost.create({
        data: {
          title: "What makes an outreach message strong when asking alumni for guidance?",
          content:
            "I want to reach out respectfully without sounding generic. What details should students include when they message alumni through the portal?",
          category: "Career Advice",
          authorId: careerMentor.id,
        },
      });

      await prisma.forumReply.createMany({
        data: [
          {
            postId: mockInterviewPost.id,
            authorId: topMentor.id,
            content:
              "Keep a simple format: introduce the problem, describe your decision, and end with the measurable outcome. That rhythm helps in both HR and technical discussions.",
          },
          {
            postId: mockInterviewPost.id,
            authorId: careerMentor.id,
            content:
              "Practice out loud with one project, one failure, and one teamwork story. Those three examples cover most follow-up questions.",
          },
          {
            postId: referralPost.id,
            authorId: placementMentor.id,
            content:
              "Mention your batch, target role, one reason you chose that alumnus, and one specific thing you want help with. Personal plus clear always works better than long messages.",
          },
        ],
      });
    }

    const eventCount = await prisma.event.count();

    if (eventCount === 0) {
      await prisma.event.createMany({
        data: [
          {
            title: "Alumni Mentorship Kickoff",
            description:
              "A launch session for students and alumni to meet, explore portal features, and understand how mentorship requests work.",
            eventType: "Hybrid",
            location: "BVRITH Seminar Hall + Google Meet",
            eventDate: new Date("2026-04-28T10:00:00+05:30"),
            link: "https://meet.google.com/",
            createdById: placementMentor.id,
          },
          {
            title: "Referral Readiness Workshop",
            description:
              "Resume review, outreach strategy, and role mapping for product and service company recruitment cycles.",
            eventType: "Online",
            location: "Google Meet",
            eventDate: new Date("2026-05-03T18:00:00+05:30"),
            link: "https://meet.google.com/",
            createdById: topMentor.id,
          },
          {
            title: "Women in Tech Alumni Panel",
            description:
              "A candid career panel featuring alumni across finance, health-tech, and product teams, followed by student Q and A.",
            eventType: "Campus",
            location: "Main Auditorium",
            eventDate: new Date("2026-05-10T14:30:00+05:30"),
            createdById: careerMentor.id,
          },
        ],
      });
    }
  }

  if (studentOne && studentTwo && studentThree && topMentor && placementMentor) {
    const chatCount = await prisma.chatMessage.count();

    if (chatCount === 0) {
      await prisma.chatMessage.createMany({
        data: [
          {
            senderId: studentOne.id,
            receiverId: topMentor.id,
            content: "Hi, I want to understand how you prepared for high-package interview rounds.",
          },
          {
            senderId: topMentor.id,
            receiverId: studentOne.id,
            content:
              "Start with DSA consistency, then focus on explaining project depth clearly. I can also help you frame mock interview answers.",
          },
          {
            senderId: studentTwo.id,
            receiverId: placementMentor.id,
            content: "Can you review how I should pitch my Amazon internship during interviews?",
          },
          {
            senderId: placementMentor.id,
            receiverId: studentTwo.id,
            content:
              "Yes, lead with impact, ownership, and one technical decision you made. Recruiters remember specifics more than task lists.",
          },
          {
            senderId: studentThree.id,
            receiverId: placementMentor.id,
            content: "I am from the lateral entry batch. Is it okay if I still apply for mentorship here?",
          },
          {
            senderId: placementMentor.id,
            receiverId: studentThree.id,
            content: "Absolutely. The portal is open to every student profile imported into the directory and dashboard.",
          },
        ],
      });
    }
  }

  hasSeeded = true;
}
