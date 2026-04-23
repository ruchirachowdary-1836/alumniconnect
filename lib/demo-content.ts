export const featuredEvents = [
  {
    title: "Alumni Mentorship Kickoff",
    date: "April 28, 2026",
    type: "Hybrid",
    description:
      "Meet senior alumni mentors, understand the portal, and start your first guidance circle.",
  },
  {
    title: "Referral Readiness Workshop",
    date: "May 3, 2026",
    type: "Online",
    description:
      "Resume review, outreach strategy, and mock conversations for top product and service firms.",
  },
  {
    title: "Women In Tech Career Panel",
    date: "May 10, 2026",
    type: "Campus",
    description:
      "A conversation with alumni across Microsoft, Visa, HSBC, UBS, and Optum.",
  },
];

export const forumPosts = [
  {
    category: "Career Advice",
    title: "How to choose the right career path after graduation?",
    author: "Admin",
    date: "Mar 24, 2026",
    summary:
      "Many students feel confused after graduation. What factors should guide the first career move: role, salary, learning curve, or growth?",
    replies: [
      "Start with roles that strengthen fundamentals and keep long-term doors open.",
      "Choose a team where you can ship real work and build confidence in the first year.",
    ],
  },
  {
    category: "Campus Life",
    title: "Best electives for AI/ML placements",
    author: "David Ashaya",
    date: "Mar 22, 2026",
    summary:
      "For anyone interested in AI/ML, which electives helped the most, and which ones should we avoid if the semester already feels overloaded?",
    replies: [
      "Probability, linear algebra, and lightweight ML projects help more than stacked theory alone.",
      "Keep one practical project in every semester so your resume tells a coherent story.",
    ],
  },
];

export const chatThreads = [
  {
    name: "Guntur Hema Ashritha",
    preview: "No messages yet",
    unread: 0,
  },
  {
    name: "Bhuvana",
    preview: "Hi Bhuvana, I hope you're doing well...",
    unread: 1,
  },
  {
    name: "Bhuvana",
    preview: "via the backend. A Software Engineer...",
    unread: 0,
  },
];

export const chatMessages = [
  {
    side: "them" as const,
    text: "hey, can I know more about your role",
    time: "12:03 PM",
  },
  {
    side: "me" as const,
    text:
      "I work on backend services and cloud workflows. The role involves designing APIs, debugging production issues, and building features that support real product teams.",
    time: "12:33 AM",
  },
];

export const companyOptions = [
  "All Companies",
  "Infosys",
  "Capgemini",
  "Microsoft",
  "Visa",
  "HSBC",
  "UBS",
  "Optum",
  "Genpact",
];

export const fallbackOpportunities = [
  {
    id: "opp-demo-1",
    title: "Software Engineer Intern",
    company: "Microsoft",
    type: "Internship",
    location: "Hyderabad",
    description:
      "Work on product engineering, backend APIs, and platform reliability in a mentor-led summer internship.",
    applyLink: "https://careers.microsoft.com/",
    postedByName: "Ashrita Guntur",
    postedByEmail: "ashritaguntur@gmail.com",
    postedByRollNumber: "ALUMNI-DEMO-001",
    createdAt: "2026-04-19T10:00:00+05:30",
    status: "OPEN",
  },
  {
    id: "opp-demo-2",
    title: "Associate Software Engineer",
    company: "Infosys",
    type: "Job",
    location: "Bengaluru",
    description:
      "Entry-level full-time opportunity for students graduating this year with strong fundamentals in Java, SQL, and problem solving.",
    applyLink: "https://www.infosys.com/careers/",
    postedByName: "G.Revathi Sai Nageswari",
    postedByEmail: "mentor@alumniconnect.local",
    postedByRollNumber: "22WH1A6606",
    createdAt: "2026-04-18T15:30:00+05:30",
    status: "OPEN",
  },
];

export const demoMentorshipRequests = [
  {
    id: "demo-mentor-req-1",
    studentName: "23WH1A6639",
    studentRollNumber: "23WH1A6639",
    studentEmail: "23wh1a6639@bvrithyderabad.edu.in",
    alumniName: "23WH1A6627",
    alumniRollNumber: "23WH1A6627",
    alumniEmail: "23wh1a6627@bvrithyderabad.edu.in",
    subject: "Mentorship Request",
    goals: "I would like guidance on placements, interview preparation, and career planning.",
    message: "I am interested in connecting for mentorship and would appreciate your guidance.",
    preferredMode: "Google Meet",
    availability: "Weekday evenings",
    status: "ACCEPTED",
    createdAt: "2026-04-21T10:00:00+05:30",
    alumniResponseMessage: "Happy to help. Let us start with resume review and placement strategy.",
  },
  {
    id: "demo-mentor-req-2",
    studentName: "23WH1A6639",
    studentRollNumber: "23WH1A6639",
    studentEmail: "23wh1a6639@bvrithyderabad.edu.in",
    alumniName: "22WH1A6639",
    alumniRollNumber: "22WH1A6639",
    alumniEmail: "22wh1a6639@bvrithyderabad.edu.in",
    subject: "Mentorship Request",
    goals: "I want company-specific preparation guidance and mock interview help.",
    message: "Could you mentor me for placements and share how to prepare effectively?",
    preferredMode: "Google Meet",
    availability: "Saturday afternoons",
    status: "ACCEPTED",
    createdAt: "2026-04-21T10:10:00+05:30",
    alumniResponseMessage: "Accepted. We can begin with mock interview questions and role-specific prep.",
  },
  {
    id: "demo-mentor-req-3",
    studentName: "23WH1A6639",
    studentRollNumber: "23WH1A6639",
    studentEmail: "23wh1a6639@bvrithyderabad.edu.in",
    alumniName: "22WH1A6616",
    alumniRollNumber: "22WH1A6616",
    alumniEmail: "22wh1a6616@bvrithyderabad.edu.in",
    subject: "Mentorship Request",
    goals: "I need advice on resume strength and interview communication.",
    message: "Please guide me on improving my profile for product and service roles.",
    preferredMode: "Google Meet",
    availability: "Flexible",
    status: "PENDING",
    createdAt: "2026-04-21T10:20:00+05:30",
    alumniResponseMessage: null,
  },
  {
    id: "demo-mentor-req-4",
    studentName: "23WH1A6639",
    studentRollNumber: "23WH1A6639",
    studentEmail: "23wh1a6639@bvrithyderabad.edu.in",
    alumniName: "22WH1A6624",
    alumniRollNumber: "22WH1A6624",
    alumniEmail: "22wh1a6624@bvrithyderabad.edu.in",
    subject: "Mentorship Request",
    goals: "I would like guidance on placement rounds and company expectations.",
    message: "Can you mentor me for interview prep and placement confidence building?",
    preferredMode: "Google Meet",
    availability: "Weekends",
    status: "PENDING",
    createdAt: "2026-04-21T10:30:00+05:30",
    alumniResponseMessage: null,
  },
  {
    id: "demo-mentor-req-5",
    studentName: "23WH1A6639",
    studentRollNumber: "23WH1A6639",
    studentEmail: "23wh1a6639@bvrithyderabad.edu.in",
    alumniName: "22WH1A6617",
    alumniRollNumber: "22WH1A6617",
    alumniEmail: "22wh1a6617@bvrithyderabad.edu.in",
    subject: "Mentorship Request",
    goals: "I want help planning preparation across aptitude, coding, and HR rounds.",
    message: "I would appreciate mentorship on building a steady placement preparation plan.",
    preferredMode: "Google Meet",
    availability: "Evenings",
    status: "PENDING",
    createdAt: "2026-04-21T10:40:00+05:30",
    alumniResponseMessage: null,
  },
  {
    id: "demo-mentor-req-6",
    studentName: "23WH1A6639",
    studentRollNumber: "23WH1A6639",
    studentEmail: "23wh1a6639@bvrithyderabad.edu.in",
    alumniName: "22WH1A6652",
    alumniRollNumber: "22WH1A6652",
    alumniEmail: "22wh1a6652@bvrithyderabad.edu.in",
    subject: "Mentorship Request",
    goals: "I need interview guidance and a review of my placement preparation approach.",
    message: "Please guide me on what to focus on most before the next placement cycle.",
    preferredMode: "Google Meet",
    availability: "Weekday mornings",
    status: "PENDING",
    createdAt: "2026-04-21T10:50:00+05:30",
    alumniResponseMessage: null,
  },
];

export const demoChatThreads = [
  {
    id: "demo-chat-1",
    studentRollNumber: "23WH1A6639",
    studentEmail: "23wh1a6639@bvrithyderabad.edu.in",
    alumniRollNumber: "23WH1A6627",
    alumniEmail: "23wh1a6627@bvrithyderabad.edu.in",
    alumniName: "23WH1A6627",
    messages: [
      {
        side: "them" as const,
        text: "Hi, I have gone through your mentorship request. Tell me where you currently feel least confident: aptitude, technical interviews, or communication.",
        time: "10:15 AM",
      },
      {
        side: "me" as const,
        text: "Thank you for accepting. My biggest concern is technical interviews, especially explaining projects clearly under pressure.",
        time: "10:18 AM",
      },
      {
        side: "them" as const,
        text: "That is a common issue. Start with one strong project and prepare a simple flow: problem, approach, tech stack, your contribution, and measurable result.",
        time: "10:22 AM",
      },
      {
        side: "me" as const,
        text: "That helps. I also want to improve my resume because I am not sure whether it reflects my strengths properly.",
        time: "10:24 AM",
      },
      {
        side: "them" as const,
        text: "Send me your resume here after updating the project bullets. Keep each point focused on impact, ownership, and tools used. We can review it together before the next drive.",
        time: "10:28 AM",
      },
    ],
  },
  {
    id: "demo-chat-2",
    studentRollNumber: "23WH1A6639",
    studentEmail: "23wh1a6639@bvrithyderabad.edu.in",
    alumniRollNumber: "22WH1A6639",
    alumniEmail: "22wh1a6639@bvrithyderabad.edu.in",
    alumniName: "22WH1A6639",
    messages: [
      {
        side: "them" as const,
        text: "I can help you prepare for company-specific interview rounds. Start by sharing your strongest projects.",
        time: "11:00 AM",
      },
      {
        side: "me" as const,
        text: "Sure, I will prepare a short project summary and send it here.",
        time: "11:04 AM",
      },
    ],
  },
];
