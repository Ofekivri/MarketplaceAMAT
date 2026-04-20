import { prisma } from "@/lib/db";
import { iconFor } from "@/lib/display";

export const metadata = { title: "Analytics | Asset Alert" };

const DEPT_PALETTE = [
  "#2563eb", // primary
  "#10b981", // tertiary
  "#f59e0b", // secondary
  "#ef4444", // error
  "#8b5cf6", // purple
  "#14b8a6", // teal
  "#ec4899", // pink
  "#64748b", // slate
];

export default async function AnalyticsPage() {
  const [allOffers, claims] = await Promise.all([
    prisma.offer.findMany({ include: { offeringUser: true } }),
    prisma.claim.findMany({ include: { offer: true } }),
  ]);

  // KPIs
  const totalOffered = allOffers.length;
  const totalClaimed = allOffers.filter((o) =>
    ["CLAIMED", "COMPLETED"].includes(o.status),
  ).length;
  const totalScrapped = allOffers.filter((o) => o.status === "SCRAPPED").length;
  const claimRate =
    totalOffered === 0 ? 0 : Math.round((totalClaimed / totalOffered) * 100);
  const valueSaved = allOffers
    .filter((o) => ["CLAIMED", "COMPLETED"].includes(o.status))
    .reduce((sum, o) => sum + o.estimatedValue, 0);

  // Top 5 most-claimed items (by item name)
  const topClaimed = rankByName(claims.map((c) => c.offer.itemName)).slice(0, 5);

  // Top 5 most-offered items
  const topOffered = rankByName(allOffers.map((o) => o.itemName)).slice(0, 5);

  // Department share of offers (for donut)
  const deptSlices = rankByName(
    allOffers.map((o) => o.offeringUser.department),
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
          Impact Analytics
        </h1>
        <p className="mt-1 text-on-surface-variant">
          How much the marketplace is diverting from the scrap pile.
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Items offered" value={totalOffered.toString()} />
        <Stat
          label="Items claimed"
          value={`${totalClaimed}`}
          sub={`${claimRate}% claim rate`}
        />
        <Stat label="Items scrapped" value={totalScrapped.toString()} />
        <Stat
          label="Value saved"
          value={`₪${(valueSaved / 1000).toFixed(1)}K`}
          sub="total estimated"
        />
      </div>

      {/* Top 5 rankings */}
      <div className="grid gap-6 md:grid-cols-2">
        <TopItems
          title="Top 5 claimed items"
          subtitle="What other departments want most"
          accent="bg-primary"
          rows={topClaimed}
          unit="claims"
        />
        <TopItems
          title="Top 5 offered items"
          subtitle="What keeps showing up as surplus"
          accent="bg-tertiary"
          rows={topOffered}
          unit="listings"
        />
      </div>

      {/* Department donut */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <div className="h-8 w-2 rounded-full bg-secondary" />
          <h2 className="text-xl font-bold tracking-tight text-on-surface">
            Offers by department
          </h2>
          <span className="ml-auto rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
            {deptSlices.length}{" "}
            {deptSlices.length === 1 ? "DEPARTMENT" : "DEPARTMENTS"}
          </span>
        </div>

        {deptSlices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-10 text-center text-on-surface-variant">
            No offers yet — department distribution will appear once items are
            posted.
          </div>
        ) : (
          <div className="grid items-center gap-8 rounded-xl bg-surface-container-lowest p-8 shadow-sm md:grid-cols-[auto_1fr]">
            <Donut slices={deptSlices} palette={DEPT_PALETTE} />
            <ol className="space-y-2 text-sm">
              {deptSlices.map(({ name, count }, i) => {
                const pct = Math.round((count / totalOffered) * 100);
                return (
                  <li
                    key={name}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface-container"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{
                        backgroundColor:
                          DEPT_PALETTE[i % DEPT_PALETTE.length],
                      }}
                    />
                    <span className="flex-1 truncate font-medium text-on-surface">
                      {name}
                    </span>
                    <span className="font-mono text-xs text-on-surface-variant">
                      {count} · {pct}%
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────

function rankByName(
  names: string[],
): { name: string; count: number }[] {
  const byKey = new Map<string, { name: string; count: number }>();
  for (const raw of names) {
    const key = raw.trim().toLowerCase();
    if (!key) continue;
    const existing = byKey.get(key);
    if (existing) existing.count += 1;
    else byKey.set(key, { name: raw.trim(), count: 1 });
  }
  return [...byKey.values()].sort((a, b) => b.count - a.count);
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-5 shadow-[0_10px_30px_-5px_rgba(25,27,35,0.04)]">
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tracking-tighter text-on-surface">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-on-surface-variant">{sub}</p>}
    </div>
  );
}

function TopItems({
  title,
  subtitle,
  accent,
  rows,
  unit,
}: {
  title: string;
  subtitle: string;
  accent: string;
  rows: { name: string; count: number }[];
  unit: string;
}) {
  const max = rows[0]?.count ?? 1;

  return (
    <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className={`h-8 w-2 rounded-full ${accent}`} />
        <div>
          <h2 className="font-bold text-on-surface">{title}</h2>
          <p className="text-xs text-on-surface-variant">{subtitle}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-on-surface-variant">
          No data yet.
        </p>
      ) : (
        <ol className="space-y-3">
          {rows.map((row, i) => {
            const pct = Math.round((row.count / max) * 100);
            return (
              <li key={row.name} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-5 shrink-0 font-mono text-xs text-on-surface-variant">
                      #{i + 1}
                    </span>
                    <span className="material-symbols-outlined text-base text-on-surface-variant">
                      {iconFor(row.name)}
                    </span>
                    <span className="truncate font-semibold text-on-surface">
                      {row.name}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-on-surface-variant">
                    {row.count} {unit}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                  <div
                    className={`h-full rounded-full ${accent}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

// ─── SVG donut ───────────────────────────────────────────────────

function Donut({
  slices,
  palette,
  size = 220,
  thickness = 36,
}: {
  slices: { name: string; count: number }[];
  palette: string[];
  size?: number;
  thickness?: number;
}) {
  const total = slices.reduce((s, x) => s + x.count, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;

  // Single-slice edge case: render a full ring instead of a zero-length arc
  if (slices.length === 1) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={palette[0]}
          strokeWidth={thickness}
        />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="fill-on-surface font-black"
          style={{ fontSize: 28 }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          className="fill-on-surface-variant"
          style={{ fontSize: 11 }}
        >
          OFFERS
        </text>
      </svg>
    );
  }

  let acc = 0;
  const paths = slices.map((slice, i) => {
    const startAngle = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += slice.count;
    const endAngle = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    return (
      <path
        key={slice.name}
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none"
        stroke={palette[i % palette.length]}
        strokeWidth={thickness}
      />
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className="fill-on-surface font-black"
        style={{ fontSize: 28 }}
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        className="fill-on-surface-variant"
        style={{ fontSize: 11 }}
      >
        OFFERS
      </text>
    </svg>
  );
}
