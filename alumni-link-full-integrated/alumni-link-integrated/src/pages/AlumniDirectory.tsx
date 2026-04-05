import { useState, useMemo } from "react";
import { useAlumniProfiles } from "@/hooks/useProfiles";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Building2, GraduationCap, Briefcase, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

export default function AlumniDirectory() {
  const { data: alumni = [], isLoading } = useAlumniProfiles();
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");

  const companies = useMemo(() => [...new Set(alumni.map(a => a.company).filter(Boolean))].sort(), [alumni]);
  const batches = useMemo(() => [...new Set(alumni.map(a => a.batch).filter(Boolean))].sort(), [alumni]);

  const filtered = useMemo(() => {
    return alumni.filter(a => {
      const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.company?.toLowerCase().includes(search.toLowerCase()) ||
        a.expertise?.some(e => e.toLowerCase().includes(search.toLowerCase()));
      const matchCompany = companyFilter === "all" || a.company === companyFilter;
      const matchBatch = batchFilter === "all" || a.batch === batchFilter;
      return matchSearch && matchCompany && matchBatch;
    });
  }, [alumni, search, companyFilter, batchFilter]);

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
            <motion.h1 variants={fadeUp} custom={0} className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
              Alumni Directory
            </motion.h1>
            <motion.p variants={fadeUp} custom={1} className="text-primary-foreground/70 max-w-xl mx-auto">
              Explore our network of alumni across top companies and diverse expertise areas.
            </motion.p>
          </motion.div>
        </section>

        {/* Filters */}
        <div className="container py-8">
          <motion.div
            className="flex flex-col md:flex-row gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, company, or skill..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Company" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Batch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.map(b => <SelectItem key={b} value={b!}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </motion.div>

          <p className="text-sm text-muted-foreground mb-6">{filtered.length} alumni found</p>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            >
              {filtered.map((a, i) => (
                <motion.div key={a.id} variants={fadeUp} custom={i} whileHover={{ y: -4 }}>
                  <div className="bg-card rounded-xl border-2 border-border p-6 h-full hover:border-foreground/20 transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                        {a.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-foreground truncate">{a.name}</h3>
                        {a.job_role && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" /> {a.job_role}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      {a.company && <p className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {a.company}</p>}
                      {a.batch && <p className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Batch {a.batch}</p>}
                      {a.package && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {a.package} LPA</p>}
                    </div>
                    {a.expertise && a.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {a.expertise.slice(0, 4).map(e => (
                          <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                        ))}
                        {a.expertise.length > 4 && <Badge variant="outline" className="text-xs">+{a.expertise.length - 4}</Badge>}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No alumni match your filters.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
