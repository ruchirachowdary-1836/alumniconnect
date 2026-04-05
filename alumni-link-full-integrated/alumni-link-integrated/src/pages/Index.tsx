import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Briefcase, Shield, ArrowRight, TrendingUp, Award, Building2, Sparkles, MessageSquare, Calendar, Star } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import PlacementCharts from "@/components/PlacementCharts";
import heroBg from "@/assets/hero-bg.jpg";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const features = [
  {
    icon: Users,
    title: "Alumni Directory",
    description: "Search and connect with alumni across top companies and diverse expertise areas.",
    link: "/alumni-directory",
  },
  {
    icon: Star,
    title: "Success Stories",
    description: "Discover incredible career journeys and achievements of our alumni community.",
    link: "/success-stories",
  },
  {
    icon: Calendar,
    title: "Events & Webinars",
    description: "Join alumni-hosted workshops, networking sessions, and career events.",
    link: "/events",
  },
  {
    icon: MessageSquare,
    title: "Discussion Forum",
    description: "Ask questions, share insights, and connect with the community.",
    link: "/discussions",
  },
  {
    icon: TrendingUp,
    title: "Career Guidance",
    description: "Get personalized advice on career paths, interviews, and skill development.",
    link: "/career-guidance",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Secure platform with dedicated dashboards for students, alumni, and admins.",
    link: "/login",
  },
];

const stats = [
  { value: "70+", label: "Students Placed", icon: Award },
  { value: "52 LPA", label: "Highest Package", icon: TrendingUp },
  { value: "7+", label: "Top Recruiters", icon: Building2 },
  { value: "10.2 LPA", label: "Avg Package", icon: Briefcase },
];

const topRecruiters = ["Microsoft", "Visa", "Bank of America", "HSBC", "UBS", "Infosys", "Capgemini"];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="absolute inset-0 gradient-hero opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(175_45%_40%_/_0.15),_transparent_60%)]" />
        <div className="relative container py-28 md:py-40 text-center">
          <motion.div
            className="max-w-3xl mx-auto space-y-8"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground/90 text-sm font-medium border border-primary-foreground/20">
              <Sparkles className="h-4 w-4" />
              BVRIT Hyderabad — CSE(AI&ML)
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-7xl font-display font-bold text-primary-foreground leading-[1.1] tracking-tight">
              Connect. Learn.{" "}
              <span className="text-gradient">Grow.</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-primary-foreground/75 max-w-2xl mx-auto leading-relaxed">
              A Student–Alumni Mentorship & Referral Portal bridging the gap between campus and corporate life.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link to="/login">
                <Button size="lg" className="gradient-warm text-accent-foreground font-semibold text-base px-10 py-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 text-base px-10 py-6 backdrop-blur-sm">
                  Learn More
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
        {/* Decorative bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Stats */}
      <motion.section
        className="relative -mt-8 z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
      >
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4 }}
                className="bg-card border border-border rounded-xl p-6 text-center space-y-2 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg gradient-accent flex items-center justify-center mx-auto">
                  <stat.icon className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div className="text-3xl md:text-4xl font-display font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <section className="bg-muted/20">
        <div className="container py-24">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={staggerContainer}
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Platform Features</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Everything You Need
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-xl mx-auto text-base">
              A comprehensive platform designed to enhance your career journey through meaningful alumni connections.
            </motion.p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {features.map((feature, i) => (
              <motion.div key={feature.title} variants={fadeUp} custom={i} whileHover={{ y: -6 }}>
                <Link
                  to={feature.link}
                  className="group bg-card rounded-xl p-7 border-2 border-border hover:border-foreground/20 transition-all duration-300 block h-full"
                >
                  <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-secondary mt-3 group-hover:gap-2 transition-all">
                    Explore <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Placement Analytics */}
      <section className="bg-card border-y border-border">
        <div className="container py-20">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={staggerContainer}
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Data Insights</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Placement Analytics
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-xl mx-auto">
              Real-time placement statistics powered by our alumni network data.
            </motion.p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <PlacementCharts />
          </motion.div>
        </div>
      </section>

      {/* Top Recruiters */}
      <section className="bg-muted/20">
        <div className="container py-20">
          <motion.div
            className="text-center mb-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={staggerContainer}
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Our Partners</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-display font-bold text-foreground">Top Recruiters</motion.h2>
          </motion.div>
          <motion.div
            className="flex flex-wrap justify-center gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            {topRecruiters.map((r, i) => (
              <motion.span
                key={r}
                variants={fadeUp}
                custom={i}
                whileHover={{ scale: 1.05 }}
                className="px-6 py-3 rounded-xl bg-card text-foreground font-semibold text-sm border-2 border-border hover:border-foreground/30 hover:shadow-sm transition-all cursor-default"
              >
                {r}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <motion.section
        className="gradient-hero relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={staggerContainer}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(175_45%_40%_/_0.2),_transparent_60%)]" />
        <div className="relative container py-24 text-center">
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-5xl font-display font-bold text-primary-foreground mb-5">
            Ready to Connect?
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-primary-foreground/70 mb-10 max-w-lg mx-auto text-lg">
            Join Alumni Connect today and unlock mentorship, career guidance, and job referrals.
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <Link to="/login">
              <Button size="lg" className="gradient-warm text-accent-foreground font-semibold text-base px-12 py-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                Join Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default Index;
