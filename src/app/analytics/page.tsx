import { prisma } from "@/lib/db";

export default async function AnalyticsPage() {
  const [allOffers, claims] = await Promise.all([
    prisma.offer.findMany({ include: { offeringUser: true } }),
    prisma.claim.findMany({
      include: {
        claimingUser: true,
        offer: true,
      },
    }),
  ]);

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

  const claimsByDept = countBy(
    claims.map((c) => c.claimingUser.department),
  );
  const offersByDept = countBy(
    allOffers.map((o) => o.offeringUser.department),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Impact dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Items offered" value={totalOffered.toString()} />
        <Stat
          label="Items claimed"
          value={`${totalClaimed} (${claimRate}%)`}
        />
        <Stat label="Items scrapped" value={totalScrapped.toString()} />
        <Stat
          label="Value saved"
          value={`$${valueSaved.toLocaleString()}`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RankedList
          title="Top departments (claiming)"
          rows={Object.entries(claimsByDept).sort((a, b) => b[1] - a[1])}
        />
        <RankedList
          title="Top departments (offering)"
          rows={Object.entries(offersByDept).sort((a, b) => b[1] - a[1])}
        />
      </div>
    </div>
  );
}

function countBy(items: string[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, k) => {
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function RankedList({
  title,
  rows,
}: {
  title: string;
  rows: [string, number][];
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">No data yet.</p>
      ) : (
        <ol className="space-y-1 text-sm">
          {rows.map(([dept, count], i) => (
            <li key={dept} className="flex justify-between">
              <span>
                <span className="text-gray-400">{i + 1}.</span> {dept}
              </span>
              <span className="font-medium">{count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
