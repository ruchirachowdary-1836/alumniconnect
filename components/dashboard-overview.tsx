import { alumniSeed } from "@/lib/seed-data";

function buildDashboardStats() {
  const companyCounts = new Map<string, number>();
  const packageBands = [
    { label: "0-5 LPA", count: 0 },
    { label: "5-10 LPA", count: 0 },
    { label: "10-20 LPA", count: 0 },
    { label: "20-35 LPA", count: 0 },
    { label: "35+ LPA", count: 0 },
  ];
  const batchMap = new Map<number, number[]>();

  for (const alumni of alumniSeed) {
    const primaryCompany = alumni.company?.split(",")[0]?.trim() || "Other";
    companyCounts.set(primaryCompany, (companyCounts.get(primaryCompany) ?? 0) + 1);

    const packageLpa = alumni.packageLpa ?? 0;
    if (packageLpa < 5) packageBands[0].count += 1;
    else if (packageLpa < 10) packageBands[1].count += 1;
    else if (packageLpa < 20) packageBands[2].count += 1;
    else if (packageLpa < 35) packageBands[3].count += 1;
    else packageBands[4].count += 1;

    const batch = alumni.graduationYear ?? 2026;
    const packages = batchMap.get(batch) ?? [];
    packages.push(packageLpa);
    batchMap.set(batch, packages);
  }

  const topCompanies = [...companyCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5);
  const otherCompaniesCount = [...companyCounts.values()].slice(5).reduce((sum, value) => sum + value, 0);
  const donutSegments = [...topCompanies, ...(otherCompaniesCount ? [["Other", otherCompaniesCount] as const] : [])];
  const donutTotal = donutSegments.reduce((sum, [, count]) => sum + count, 0) || 1;
  const donutColors = ["#2fb982", "#56a1f3", "#4f87c9", "#6f89a7", "#8ea6c3", "#d2dfec"];

  let currentStop = 0;
  const donutGradient = donutSegments
    .map(([, count], index) => {
      const start = currentStop;
      currentStop += (count / donutTotal) * 100;
      return `${donutColors[index % donutColors.length]} ${start}% ${currentStop}%`;
    })
    .join(", ");

  const batchStats = [...batchMap.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([batch, packages]) => ({
      batch,
      highest: Math.max(...packages),
      average: packages.reduce((sum, value) => sum + value, 0) / packages.length,
    }));

  return {
    donutSegments,
    donutGradient,
    batchStats,
    packageBands,
  };
}

export function DashboardOverview() {
  const { donutSegments, donutGradient, batchStats, packageBands } = buildDashboardStats();
  const maxPackageValue = Math.max(...batchStats.flatMap((item) => [item.highest, item.average]), 1);
  const maxBandCount = Math.max(...packageBands.map((band) => band.count), 1);
  const donutColors = ["#2fb982", "#56a1f3", "#4f87c9", "#6f89a7", "#8ea6c3", "#d2dfec"];

  return (
    <>
      <section className="page-band">
        <div className="shell page-band-inner">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-lead">Placement analytics and alumni insights from the imported campus dataset.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="shell">
          <div className="analytics-grid" style={{ marginBottom: 18 }}>
            <article className="chart-card">
              <h3>Company Distribution</h3>
              <p className="small muted" style={{ marginTop: 0 }}>Top companies + Other</p>
              <div className="donut-wrap">
                <div className="donut" style={{ background: `conic-gradient(${donutGradient})` }} />
                <div className="legend">
                  {donutSegments.map(([label], index) => (
                    <span key={label} className="legend-item">
                      <span className="dot" style={{ background: donutColors[index % donutColors.length] }} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            <article className="chart-card">
              <h3>Package by Batch</h3>
              <p className="small muted" style={{ marginTop: 0 }}>Highest vs average package (LPA)</p>
              <div className="chart-box">
                <div className="bars">
                  {batchStats.map((item) => (
                    <div key={item.batch} className="bar-group">
                      <div className="bar" style={{ height: `${(item.highest / maxPackageValue) * 100}%` }} />
                      <div className="bar soft" style={{ height: `${(item.average / maxPackageValue) * 100}%` }} />
                      <span className="small muted" style={{ position: "absolute", marginTop: 168 }}>
                        {item.batch}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>

          <article className="chart-card">
            <h3>Package Range Distribution</h3>
            <p className="small muted" style={{ marginTop: 0 }}>Count of alumni by package band (LPA)</p>
            <div className="chart-box">
              <div className="bars">
                {packageBands.map((band) => (
                  <div key={band.label} className="bar-group">
                    <div className="bar" style={{ width: 92, height: `${(band.count / maxBandCount) * 100}%` }} />
                    <span className="small muted" style={{ position: "absolute", marginTop: 168, textAlign: "center", width: 92 }}>
                      {band.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
