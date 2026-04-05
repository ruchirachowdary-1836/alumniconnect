import { useAlumniProfiles } from "@/hooks/useProfiles";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Award, Building2, TrendingUp, Star } from "lucide-react";
import { motion } from "framer-motion";

function parseNumberLike(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  const cleaned = v.replace(/,/g, " ").trim();
  const m = cleaned.match(/(\d+(\.\d+)?)/);
  if (!m) return 0;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : 0;
}

function getPackageLpa(profile: any): number {
  return parseNumberLike(profile?.packageAmount) || parseNumberLike(profile?.package) || parseNumberLike(profile?.package_amount) || 0;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

export default function SuccessStories() {
  const { data: alumni = [], isLoading } = useAlumniProfiles();

  // Feature top alumni by package
  const topAlumni = [...alumni]
    .map((a) => ({ a, pkg: getPackageLpa(a) }))
    .filter(({ pkg }) => pkg > 0)
    .sort((x, y) => y.pkg - x.pkg)
    .slice(0, 3);

  const highestPkg = topAlumni.length > 0 ? topAlumni[0].pkg : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(175_45%_40%_/_0.15),_transparent_60%)]" />
          <motion.div
            className="relative container py-16 text-center"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground/90 text-sm font-medium border border-primary-foreground/20 mb-4">
              <Star className="h-4 w-4" /> Celebrating Excellence
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
              Success Stories
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-primary-foreground/70 max-w-xl mx-auto">
              Discover the incredible career journeys and achievements of our alumni community.
            </motion.p>
          </motion.div>
        </section>

        {/* Highlight Banner */}
        {topAlumni.length > 0 && (
          <motion.section
            className="relative -mt-6 z-10"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          >
            <div className="container">
              <div className="bg-card border-2 border-border rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl gradient-warm flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Highest Package Achieved</p>
                    <p className="text-3xl font-display font-bold text-foreground">{highestPkg} LPA</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl gradient-accent flex items-center justify-center">
                    <Award className="h-7 w-7 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Top Alumni Showcased</p>
                    <p className="text-3xl font-display font-bold text-foreground">{topAlumni.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Stories Grid */}
        <div className="container py-16">
          <motion.div
            className="text-center mb-12"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Our Stars</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Top Achievers
            </motion.h2>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            >
              {topAlumni.map(({ a, pkg }, i) => (
                <motion.div key={a.id} variants={fadeUp} custom={i} whileHover={{ y: -6 }}>
                  <div className="bg-card rounded-xl border-2 border-border p-7 h-full hover:border-foreground/20 transition-all relative overflow-hidden">
                    {i < 3 && (
                      <div className="absolute top-4 right-4">
                        <Badge className="gradient-warm text-accent-foreground border-0">
                          #{i + 1} Top Achiever
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-xl shrink-0">
                        {a.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-foreground">{a.name}</h3>
                        {(a.jobRole || a.job_role) && <p className="text-sm text-muted-foreground">{a.jobRole || a.job_role}</p>}
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium text-foreground">{a.company || "Company not set"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium text-foreground">{pkg} LPA</span>
                      </div>
                      {a.batch && (
                        <Badge variant="outline" className="mt-2">Batch {a.batch}</Badge>
                      )}
                    </div>
                    {a.expertise && a.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border">
                        {a.expertise.slice(0, 3).map(e => (
                          <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                        ))}
                      </div>
                    )}
                    {a.bio && (
                      <p className="text-sm text-muted-foreground mt-4 line-clamp-2 italic">"{a.bio}"</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {!isLoading && topAlumni.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p className="font-medium text-foreground">No success stories available yet.</p>
              <p className="mt-2">Tip: ask alumni to add their package in the profile (Package / Package Amount) to populate this page.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
