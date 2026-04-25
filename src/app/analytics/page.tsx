import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getCategory } from "@/lib/categories";
import { formatRelative } from "@/lib/format";
import {
  MyImpactClient,
  type Badge,
  type Category,
  type MonthBucket,
  type ActivityItem,
  type MyImpactData,
} from "./MyImpactClient";

export const metadata = { title: "My Impact | SecondLife" };

const KG_PER_DOLLAR = 0.025;

export default async function MyImpactPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [myOffers, myClaims, deptUsers] = await Promise.all([
    prisma.offer.findMany({
      where: { offeringUserId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.claim.findMany({
      where: { claimingUserId: user.id },
      include: { offer: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { department: user.department },
      select: { id: true },
    }),
  ]);

  const deptUserIds = deptUsers.map((u) => u.id);

  const postedRehomedValue = myOffers
    .filter((o) => o.status === "CLAIMED" || o.status === "COMPLETED")
    .reduce((sum, o) => sum + o.estimatedValue, 0);
  const claimedValue = myClaims.reduce(
    (sum, c) => sum + c.offer.estimatedValue,
    0,
  );
  const valueRehomed = postedRehomedValue + claimedValue;

  const postedAvailable = myOffers.filter(
    (o) => o.status === "AVAILABLE",
  ).length;
  const postedClaimed = myOffers.filter((o) => o.status === "CLAIMED").length;
  const postedCompleted = myOffers.filter(
    (o) => o.status === "COMPLETED",
  ).length;
  const postedExpired = myOffers.filter((o) => o.status === "SCRAPPED").length;

  const now = new Date();
  const quarterStart = startOfQuarter(now);
  const lastQuarterStart = startOfQuarter(addMonths(quarterStart, -3));
  const valueInRange = (start: Date, end: Date) => {
    const inRange = (d: Date) => d >= start && d < end;
    const fromPosted = myOffers
      .filter(
        (o) =>
          (o.status === "CLAIMED" || o.status === "COMPLETED") &&
          inRange(o.updatedAt),
      )
      .reduce((s, o) => s + o.estimatedValue, 0);
    const fromClaimed = myClaims
      .filter((c) => inRange(c.createdAt))
      .reduce((s, c) => s + c.offer.estimatedValue, 0);
    return fromPosted + fromClaimed;
  };
  const currentQuarterValue = valueInRange(quarterStart, addMonths(quarterStart, 3));
  const lastQuarterValue = valueInRange(lastQuarterStart, quarterStart);
  const valueDeltaQuarter = currentQuarterValue - lastQuarterValue;

  const deptClaimsCount = await prisma.claim.count({
    where: { claimingUserId: { in: deptUserIds } },
  });
  const deptClaimers = await prisma.claim.findMany({
    where: { claimingUserId: { in: deptUserIds } },
    distinct: ["claimingUserId"],
    select: { claimingUserId: true },
  });
  const claimedMultiplier =
    myClaims.length === 0 || deptClaimers.length === 0
      ? null
      : myClaims.length /
        Math.max(1, deptClaimsCount / deptClaimers.length);

  const months = buildMonthlyBuckets(now, myOffers, myClaims);

  const categoriesMap = new Map<string, number>();
  for (const o of myOffers) {
    if (o.status !== "CLAIMED" && o.status !== "COMPLETED") continue;
    categoriesMap.set(
      o.category,
      (categoriesMap.get(o.category) ?? 0) + o.estimatedValue,
    );
  }
  for (const c of myClaims) {
    categoriesMap.set(
      c.offer.category,
      (categoriesMap.get(c.offer.category) ?? 0) + c.offer.estimatedValue,
    );
  }
  const categoriesTotal = Array.from(categoriesMap.values()).reduce(
    (s, v) => s + v,
    0,
  );
  const categories: Category[] = Array.from(categoriesMap.entries())
    .map(([id, amt]) => ({
      name: getCategory(id).label,
      amt,
      pct: categoriesTotal === 0 ? 0 : Math.round((amt / categoriesTotal) * 100),
    }))
    .sort((a, b) => b.amt - a.amt)
    .slice(0, 6);

  const badges: Badge[] = buildBadges(myOffers, myClaims, valueRehomed);

  const timeline: ActivityItem[] = buildTimeline(myOffers, myClaims);

  const rank = await computeRank(user.id, quarterStart, now);

  const data: MyImpactData = {
    valueRehomed,
    valueDeltaQuarter,
    postedCount: myOffers.length,
    postedAvailable,
    postedClaimed,
    postedCompleted,
    postedExpired,
    claimedCount: myClaims.length,
    claimedMultiplier,
    kgDiverted: Math.round(valueRehomed * KG_PER_DOLLAR),
    rank: rank.position,
    rankTotal: rank.total,
    months,
    categories,
    badges,
    timeline,
  };

  return <MyImpactClient data={data} />;
}

function startOfQuarter(d: Date): Date {
  const q = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), q * 3, 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function buildMonthlyBuckets(
  now: Date,
  offers: { createdAt: Date }[],
  claims: { createdAt: Date }[],
): MonthBucket[] {
  const MONTH_LABELS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const buckets: MonthBucket[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      label: MONTH_LABELS[d.getMonth()],
      posted: 0,
      claimed: 0,
    });
  }
  const startMs = new Date(
    now.getFullYear(),
    now.getMonth() - 11,
    1,
  ).getTime();
  const indexFor = (date: Date) => {
    if (date.getTime() < startMs) return -1;
    return (
      (date.getFullYear() - new Date(startMs).getFullYear()) * 12 +
      (date.getMonth() - new Date(startMs).getMonth())
    );
  };
  for (const o of offers) {
    const idx = indexFor(o.createdAt);
    if (idx >= 0 && idx < buckets.length) buckets[idx].posted += 1;
  }
  for (const c of claims) {
    const idx = indexFor(c.createdAt);
    if (idx >= 0 && idx < buckets.length) buckets[idx].claimed += 1;
  }
  return buckets;
}

function buildBadges(
  offers: { createdAt: Date }[],
  claims: { createdAt: Date }[],
  valueRehomed: number,
): Badge[] {
  const badgeDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });

  const firstClaim = [...claims].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  )[0];
  const sortedOffers = [...offers].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const fifthOffer = sortedOffers[4];

  return [
    {
      key: "first-rescue",
      name: "First Rescue",
      desc: "Claim your first item",
      icon: "star",
      earned: claims.length >= 1,
      earnedLabel: firstClaim ? badgeDate(firstClaim.createdAt) : undefined,
    },
    {
      key: "generous-giver",
      name: "Generous Giver",
      desc: "Post 5+ items",
      icon: "volunteer_activism",
      earned: offers.length >= 5,
      earnedLabel: fifthOffer ? badgeDate(fifthOffer.createdAt) : undefined,
    },
    {
      key: "sustainability-champ",
      name: "Sustainability Champ",
      desc: "Divert $10k from salvage",
      icon: "park",
      earned: valueRehomed >= 10000,
    },
    {
      key: "century-club",
      name: "Century Club",
      desc: "Divert $100k (locked)",
      icon: "emoji_events",
      earned: valueRehomed >= 100000,
    },
  ];
}

function buildTimeline(
  offers: {
    itemName: string;
    location: string;
    estimatedValue: number;
    createdAt: Date;
    status: string;
  }[],
  claims: {
    createdAt: Date;
    offer: { itemName: string; location: string; estimatedValue: number };
  }[],
): ActivityItem[] {
  type Entry = ActivityItem & { ts: number };
  const entries: Entry[] = [];
  for (const o of offers) {
    entries.push({
      type: "post",
      title: `You posted ${o.itemName}`,
      from: o.location,
      val: `$${o.estimatedValue.toLocaleString()} listed`,
      when: formatRelative(o.createdAt),
      ts: o.createdAt.getTime(),
    });
  }
  for (const c of claims) {
    entries.push({
      type: "claim",
      title: `You claimed ${c.offer.itemName}`,
      from: c.offer.location,
      val: `+$${c.offer.estimatedValue.toLocaleString()}`,
      when: formatRelative(c.createdAt),
      ts: c.createdAt.getTime(),
    });
  }
  return entries
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5)
    .map(({ ts: _ts, ...rest }) => rest);
}

async function computeRank(
  userId: string,
  quarterStart: Date,
  now: Date,
): Promise<{ position: number | null; total: number }> {
  const [postedThisQuarter, claimsThisQuarter] = await Promise.all([
    prisma.offer.findMany({
      where: {
        status: { in: ["CLAIMED", "COMPLETED"] },
        updatedAt: { gte: quarterStart, lte: now },
      },
      select: { offeringUserId: true, estimatedValue: true },
    }),
    prisma.claim.findMany({
      where: { createdAt: { gte: quarterStart, lte: now } },
      select: { claimingUserId: true, offer: { select: { estimatedValue: true } } },
    }),
  ]);

  const totals = new Map<string, number>();
  for (const o of postedThisQuarter) {
    totals.set(
      o.offeringUserId,
      (totals.get(o.offeringUserId) ?? 0) + o.estimatedValue,
    );
  }
  for (const c of claimsThisQuarter) {
    totals.set(
      c.claimingUserId,
      (totals.get(c.claimingUserId) ?? 0) + c.offer.estimatedValue,
    );
  }

  const ranked = Array.from(totals.entries())
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const position = ranked.findIndex(([id]) => id === userId);
  if (position < 0) return { position: null, total: ranked.length };
  return { position: position + 1, total: ranked.length };
}
