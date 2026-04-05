import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GraduationCap, Target, Users, Lightbulb } from "lucide-react";

const values = [
  { icon: Target, title: "Mission", description: "Bridge the gap between academic learning and industry expectations through structured mentorship." },
  { icon: Users, title: "Community", description: "Build a thriving network of students and alumni who support each other's growth." },
  { icon: Lightbulb, title: "Innovation", description: "Leverage technology to create meaningful, trustworthy professional connections." },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="gradient-hero py-20">
        <div className="container text-center">
          <GraduationCap className="h-12 w-12 mx-auto text-accent mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4">About Alumni Connect</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">
            A dedicated platform from BVRIT Hyderabad's CSE(AI&ML) department to connect students with experienced alumni.
          </p>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="container py-16">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">The Problem</h2>
            <p className="text-muted-foreground leading-relaxed">
              There is a widening gap between academic curriculum and industry expectations, leaving students
              insufficiently prepared for professional roles. The absence of a structured platform restricts
              access to mentorship, career guidance, and job referrals.
            </p>
          </div>
          <div className="bg-success/5 border border-success/20 rounded-xl p-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">Our Solution</h2>
            <p className="text-muted-foreground leading-relaxed">
              Alumni Connect provides a responsive, user-friendly platform where students can connect with
              experienced alumni for career guidance, use search filters to find mentors, access job referrals,
              and enjoy secure role-based access control.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <h2 className="text-3xl font-display font-bold text-center mb-10">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-card rounded-xl p-6 border border-border text-center">
                <v.icon className="h-10 w-10 mx-auto text-secondary mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
