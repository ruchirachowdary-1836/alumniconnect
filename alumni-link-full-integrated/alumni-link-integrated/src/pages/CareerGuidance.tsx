import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Briefcase, BookOpen, Target, MessageSquare, TrendingUp, CheckCircle,
  Lightbulb, GraduationCap, FileText, Code, Users, Brain, Shield,
  ArrowRight, ExternalLink, Clock, Star, Zap, Award, Laptop, Globe,
} from "lucide-react";

const tips = [
  {
    icon: Target,
    title: "Set Clear Goals",
    items: [
      "Define short-term and long-term career objectives",
      "Research roles and industries that align with your interests",
      "Create a timeline with milestones to track progress",
      "Identify role models and study their career trajectories",
    ],
  },
  {
    icon: BookOpen,
    title: "Build Your Skills",
    items: [
      "Master DSA and core CS fundamentals",
      "Learn in-demand technologies (Cloud, AI/ML, Full-Stack)",
      "Contribute to open-source projects on GitHub",
      "Earn certifications (AWS, Azure, Google Cloud, TensorFlow)",
    ],
  },
  {
    icon: Briefcase,
    title: "Ace the Interview",
    items: [
      "Practice coding problems on LeetCode & CodeForces",
      "Prepare STAR-method answers for behavioural rounds",
      "Research the company culture and recent news before every interview",
      "Do mock interviews with peers or alumni mentors",
    ],
  },
  {
    icon: MessageSquare,
    title: "Network Effectively",
    items: [
      "Connect with alumni mentors through this platform",
      "Attend tech meetups, hackathons, and webinars",
      "Maintain an updated LinkedIn profile with projects",
      "Follow industry leaders and engage with their content",
    ],
  },
  {
    icon: FileText,
    title: "Craft a Winning Resume",
    items: [
      "Keep it to one page — prioritize impact over length",
      "Quantify achievements (e.g., 'Reduced load time by 40%')",
      "Tailor your resume for each role you apply to",
      "Include relevant projects, internships, and certifications",
    ],
  },
  {
    icon: Brain,
    title: "Develop Soft Skills",
    items: [
      "Practice clear and concise communication",
      "Learn to work effectively in cross-functional teams",
      "Develop time management and prioritization habits",
      "Build presentation skills — volunteer for talks and demos",
    ],
  },
];

const interviewPrep = [
  {
    round: "Online Assessment",
    icon: Code,
    duration: "60–90 min",
    topics: ["Arrays & Strings", "Trees & Graphs", "Dynamic Programming", "SQL Queries"],
    tip: "Solve 2–3 medium LeetCode problems daily. Focus on patterns, not memorization.",
  },
  {
    round: "Technical Interview",
    icon: Laptop,
    duration: "45–60 min",
    topics: ["System Design Basics", "OOP Concepts", "Code Optimization", "Problem Solving"],
    tip: "Think aloud. Interviewers care about your approach as much as the solution.",
  },
  {
    round: "HR / Behavioural",
    icon: Users,
    duration: "30–45 min",
    topics: ["Tell Me About Yourself", "Strengths & Weaknesses", "Conflict Resolution", "Why This Company?"],
    tip: "Use the STAR method (Situation, Task, Action, Result) for every answer.",
  },
  {
    round: "Managerial Round",
    icon: Shield,
    duration: "30–45 min",
    topics: ["Leadership Examples", "Project Deep-Dive", "Cultural Fit", "Career Goals"],
    tip: "Be authentic. Show passion for learning and alignment with company values.",
  },
];

const resources = [
  { title: "LeetCode", url: "https://leetcode.com", description: "Practice coding problems for technical interviews", icon: Code },
  { title: "GeeksforGeeks", url: "https://geeksforgeeks.org", description: "DSA tutorials and interview preparation", icon: BookOpen },
  { title: "Coursera", url: "https://coursera.org", description: "Online courses from top universities", icon: GraduationCap },
  { title: "LinkedIn Learning", url: "https://linkedin.com/learning", description: "Professional development courses", icon: Briefcase },
  { title: "HackerRank", url: "https://hackerrank.com", description: "Coding challenges and skill certifications", icon: Award },
  { title: "freeCodeCamp", url: "https://freecodecamp.org", description: "Free full-stack web development curriculum", icon: Globe },
  { title: "Kaggle", url: "https://kaggle.com", description: "Datasets, notebooks, and ML competitions", icon: Brain },
  { title: "GitHub", url: "https://github.com", description: "Host projects and contribute to open source", icon: Zap },
];

const roadmap = [
  {
    year: "1st Year", focus: "Foundation",
    tasks: ["Learn C/C++/Python basics", "Understand OOP & data structures", "Build small projects (calculator, to-do app)", "Explore different CS domains"],
  },
  {
    year: "2nd Year", focus: "Exploration",
    tasks: ["Explore domains (Web, ML, Cloud, DevOps)", "Start competitive programming", "Build 2–3 portfolio projects", "Apply for summer internships"],
  },
  {
    year: "3rd Year", focus: "Specialization",
    tasks: ["Deep-dive into chosen domain", "Land a solid internship", "Start DSA prep for placements", "Contribute to open-source"],
  },
  {
    year: "4th Year", focus: "Placement",
    tasks: ["Mock interviews & resume polish", "Apply through campus & off-campus", "Negotiate offers strategically", "Plan for higher studies if interested"],
  },
];

const faqs = [
  { q: "When should I start preparing for placements?", a: "Ideally from the 2nd year. Start with DSA fundamentals and build projects. By 3rd year, focus on interview-specific preparation and mock rounds." },
  { q: "How many LeetCode problems should I solve?", a: "Quality over quantity. Aim for 200–300 well-understood problems covering all major patterns (sliding window, two pointers, BFS/DFS, DP, etc.)." },
  { q: "Are certifications worth it?", a: "Yes, especially cloud certifications (AWS, Azure, GCP) and domain-specific ones (TensorFlow, Kubernetes). They add credibility and show initiative." },
  { q: "How do I choose between product and service companies?", a: "Product companies focus on building a single product with deeper engineering. Service companies offer exposure to diverse clients and technologies. Consider your preference for depth vs. breadth." },
  { q: "What if I don't get placed on campus?", a: "Many successful engineers get placed off-campus. Keep applying on job portals, leverage LinkedIn, attend hiring challenges, and ask alumni for referrals through this platform." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const sectionHeading = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const CareerGuidance = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(175_45%_40%_/_0.15),_transparent_60%)]" />
        <div className="relative container py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground/90 text-sm font-medium border border-primary-foreground/20 mb-6"
          >
            <Lightbulb className="h-4 w-4" />
            Career Resources
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-4xl md:text-6xl font-display font-bold text-primary-foreground mb-4"
          >
            Career <span className="text-gradient">Guidance</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-primary-foreground/70 max-w-2xl mx-auto text-lg"
          >
            Everything you need — tips, interview prep, resources, and a year-by-year roadmap to land your dream role.
          </motion.p>
        </div>
      </section>

      {/* Tips */}
      <section className="bg-muted/20">
        <div className="container py-20">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionHeading}
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Pro Tips</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Keys to Success</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mt-3">Actionable advice from alumni who've been through the process.</p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            {tips.map((tip, i) => (
              <motion.div key={tip.title} variants={fadeUp} custom={i}>
                <Card className="border-2 border-border hover:border-foreground/20 transition-all hover:shadow-md h-full">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center shrink-0">
                      <tip.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl">{tip.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tip.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Interview Prep */}
      <section className="bg-card border-y border-border">
        <div className="container py-20">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionHeading}
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Step-by-Step</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Interview Preparation</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mt-3">What to expect in each round and how to prepare.</p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            {interviewPrep.map((round, i) => (
              <motion.div
                key={round.round}
                variants={fadeUp}
                custom={i}
                className="bg-muted/30 rounded-xl p-7 border-2 border-border hover:border-foreground/20 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-11 h-11 rounded-xl gradient-accent flex items-center justify-center shrink-0">
                    <round.icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Round {i + 1}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70">
                        <Clock className="h-3 w-3" /> {round.duration}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-foreground text-lg">{round.round}</h3>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {round.topics.map((topic) => (
                    <span key={topic} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {topic}
                    </span>
                  ))}
                </div>
                <div className="flex items-start gap-2 bg-card rounded-lg p-3 border border-border">
                  <Star className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{round.tip}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="bg-muted/20">
        <div className="container py-20">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionHeading}
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Year-by-Year</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Career Roadmap</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mt-3">A structured plan from first year to placement day.</p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            {roadmap.map((step, i) => (
              <motion.div key={step.year} variants={fadeUp} custom={i} className="relative">
                <div className="bg-card rounded-xl p-6 border-2 border-border h-full hover:border-foreground/20 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center mb-4 text-accent-foreground font-bold text-sm">
                    {i + 1}
                  </div>
                  <h3 className="font-display font-bold text-foreground text-lg">{step.year}</h3>
                  <p className="text-sm text-secondary font-semibold mb-3">{step.focus}</p>
                  <ul className="space-y-1.5">
                    {step.tasks.map((task) => (
                      <li key={task} className="text-sm text-muted-foreground flex items-start gap-2">
                        <GraduationCap className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Resources */}
      <section className="bg-card border-y border-border">
        <div className="container py-20">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionHeading}
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Useful Links</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Learning Resources</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mt-3">Curated platforms to sharpen your skills.</p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            {resources.map((r, i) => (
              <motion.a
                key={r.title}
                variants={fadeUp}
                custom={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-muted/30 rounded-xl p-6 border-2 border-border hover:border-foreground/20 hover:shadow-md transition-all block"
                whileHover={{ y: -4 }}
              >
                <r.icon className="h-6 w-6 text-secondary mb-3" />
                <h3 className="font-display font-bold text-foreground mb-1 flex items-center gap-1.5">
                  {r.title}
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-muted-foreground">{r.description}</p>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-muted/20">
        <div className="container py-20">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionHeading}
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Common Questions</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">FAQs</h2>
          </motion.div>
          <motion.div
            className="max-w-3xl mx-auto space-y-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            {faqs.map((faq, i) => (
              <motion.details
                key={faq.q}
                variants={fadeUp}
                custom={i}
                className="group bg-card rounded-xl border-2 border-border hover:border-foreground/20 transition-all"
              >
                <summary className="flex items-center justify-between cursor-pointer p-5 font-display font-semibold text-foreground text-base list-none">
                  {faq.q}
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform shrink-0 ml-4" />
                </summary>
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              </motion.details>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(175_45%_40%_/_0.2),_transparent_60%)]" />
        <motion.div
          className="relative container py-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
            Ready to Get Mentored?
          </h2>
          <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">
            Connect with alumni who've been where you are. Get personalised guidance, referrals, and career advice.
          </p>
          <Link to="/login">
            <Button size="lg" className="gradient-warm text-accent-foreground font-semibold text-base px-12 py-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
              Find a Mentor <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default CareerGuidance;
