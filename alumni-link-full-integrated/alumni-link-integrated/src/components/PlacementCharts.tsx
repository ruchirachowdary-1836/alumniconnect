import { useState } from "react";
import { useAlumniProfiles } from "@/hooks/useProfiles";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Building2, BarChart3 } from "lucide-react";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const PALETTE = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
];

interface PlacementChartsProps {
  showTitle?: boolean;
}

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
  return (
    parseNumberLike(profile?.packageAmount) ||
    parseNumberLike(profile?.package) ||
    parseNumberLike(profile?.package_amount) ||
    0
  );
}

function getBatchKey(batch: unknown): string {
  const s = typeof batch === "string" ? batch.trim() : "";
  if (!s) return "Unknown";
  const m = s.match(/\b(19|20)\d{2}\b/);
  return m?.[0] || s;
}

export default function PlacementCharts({ showTitle = false }: PlacementChartsProps) {
  const { data: alumni = [], isLoading } = useAlumniProfiles();
  const [batchFilter, setBatchFilter] = useState<string>("");

  if (isLoading) {
    return (
      <div className="space-y-8">
        {showTitle ? <Skeleton className="h-8 w-56 rounded-md" /> : null}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (alumni.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">No placement data available yet.</p>
    );
  }

  const availableBatches = Array.from(new Set(alumni.map((a) => getBatchKey(a.batch))))
    .filter((b) => b !== "Unknown")
    .sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (Number.isFinite(na) && Number.isFinite(nb)) return nb - na;
      return String(a).localeCompare(String(b));
    });

  const filteredAlumni = batchFilter
    ? alumni.filter((a) => getBatchKey(a.batch) === batchFilter)
    : alumni;

  // Company distribution
  const companyCount: Record<string, number> = {};
  filteredAlumni.forEach((a) => {
    const c = a.company || "Unknown";
    companyCount[c] = (companyCount[c] || 0) + 1;
  });
  const companyData = Object.entries(companyCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const pieCompanyLimit = 6;
  const companyTop = companyData.slice(0, pieCompanyLimit);
  const companyOther = companyData.slice(pieCompanyLimit).reduce((sum, d) => sum + d.value, 0);
  const companyPieData = companyOther > 0 ? [...companyTop, { name: "Other", value: companyOther }] : companyTop;
  const companyPieDataWithKey = companyPieData.map((d, i) => ({
    ...d,
    key: `company_${i}`,
  }));

  // Package distribution by batch
  const batchMap: Record<string, { count: number; total: number; highest: number }> = {};
  alumni.forEach((a) => {
    const batch = getBatchKey(a.batch);
    if (!batchMap[batch]) batchMap[batch] = { count: 0, total: 0, highest: 0 };
    const pkg = getPackageLpa(a);
    batchMap[batch].count++;
    batchMap[batch].total += pkg;
    batchMap[batch].highest = Math.max(batchMap[batch].highest, pkg);
  });
  const batchData = Object.entries(batchMap).map(([batch, d]) => ({
    batch,
    average: Math.round((d.total / d.count) * 10) / 10,
    highest: d.highest,
    placed: d.count,
  })).sort((a, b) => {
    const na = Number(a.batch);
    const nb = Number(b.batch);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return String(a.batch).localeCompare(String(b.batch));
  });

  // Package range distribution
  const ranges = ["0-5", "5-10", "10-20", "20-35", "35+"];
  const rangeData = ranges.map((range) => {
    const [min, max] = range.includes("+") ? [35, Infinity] : range.split("-").map(Number);
    return {
      range: `${range} LPA`,
      count: filteredAlumni.filter((a) => {
        const p = getPackageLpa(a);
        if (max === Infinity) return p >= min;
        return p >= min && p < max;
      }).length,
    };
  });

  // Summary stats
  const totalAlumni = filteredAlumni.length;
  const highestPkg = totalAlumni > 0 ? Math.max(...filteredAlumni.map((a) => getPackageLpa(a))) : 0;
  const avgPkg =
    totalAlumni > 0
      ? Math.round((filteredAlumni.reduce((s, a) => s + getPackageLpa(a), 0) / totalAlumni) * 10) / 10
      : 0;

  const batchChartConfig: ChartConfig = {
    highest: { label: "Highest", color: "hsl(var(--chart-1))" },
    average: { label: "Average", color: "hsl(var(--chart-2))" },
  };

  const rangeChartConfig: ChartConfig = {
    count: { label: "Alumni Count", color: "hsl(var(--chart-2))" },
  };

  const companyChartConfig: ChartConfig = Object.fromEntries(
    companyPieDataWithKey.map((d, i) => [d.key, { label: d.name, color: PALETTE[i % PALETTE.length] }]),
  );

  return (
    <div className="space-y-8">
      {showTitle && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Placement Analytics</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {batchFilter ? `Showing batch: ${batchFilter}` : "Showing: all batches"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Batch</span>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm min-w-[180px]"
            >
              <option value="">All batches</option>
              {availableBatches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Mini stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-muted/40 rounded-xl p-5 text-center border border-border shadow-sm">
          <TrendingUp className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
          <div className="text-2xl font-display font-bold text-foreground">{highestPkg} LPA</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Highest Package</div>
        </div>
        <div className="bg-muted/40 rounded-xl p-5 text-center border border-border shadow-sm">
          <BarChart3 className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
          <div className="text-2xl font-display font-bold text-foreground">{avgPkg} LPA</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Average Package</div>
        </div>
        <div className="bg-muted/40 rounded-xl p-5 text-center border border-border shadow-sm">
          <Building2 className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
          <div className="text-2xl font-display font-bold text-foreground">{companyData.length}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Companies</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Distribution Pie */}
        <div className="glass-card rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="font-display font-bold text-lg">Company Distribution</h3>
              <p className="text-sm text-muted-foreground mt-1">Top {Math.min(pieCompanyLimit, companyData.length)} companies {companyOther > 0 ? "+ Other" : ""}</p>
            </div>
          </div>

          <ChartContainer config={companyChartConfig} className="h-[280px] w-full aspect-auto">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="key" />} />
              <Pie
                data={companyPieDataWithKey}
                dataKey="value"
                nameKey="key"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={102}
                paddingAngle={2}
                cornerRadius={10}
                stroke="#fff"
                strokeWidth={2}
                labelLine={false}
                isAnimationActive={false}
              >
                {companyPieDataWithKey.map((d) => (
                  <Cell key={d.key} fill={`var(--color-${d.key})`} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="key" />} />
            </PieChart>
          </ChartContainer>
        </div>

        {/* Package by Batch Bar */}
        <div className="glass-card rounded-2xl p-6 shadow-sm">
          <h3 className="font-display font-bold text-lg">Package by Batch</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-3">Highest vs average package (LPA)</p>

          <ChartContainer config={batchChartConfig} className="h-[280px] w-full aspect-auto">
            <BarChart data={batchData} barGap={4}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#ccc" />
              <XAxis
                dataKey="batch"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={(v) => (String(v).length > 10 ? `${String(v).slice(0, 10)}...` : String(v))}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="highest" name="Highest" fill="var(--color-highest)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="average" name="Average" fill="var(--color-average)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Package Range */}
        <div className={cn("glass-card rounded-2xl p-6 shadow-sm", "lg:col-span-2")}>
          <h3 className="font-display font-bold text-lg">Package Range Distribution</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-3">Count of alumni by package band (LPA)</p>

          <ChartContainer config={rangeChartConfig} className="h-[260px] w-full aspect-auto">
            <BarChart data={rangeData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="range" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" name="Alumni Count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
