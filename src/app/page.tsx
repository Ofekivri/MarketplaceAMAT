import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatCondition, daysUntil } from "@/lib/format";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

function iconFor(itemName: string): string {
  const n = itemName.toLowerCase();
  if (n.includes("chair") || n.includes("desk") || n.includes("furniture"))
    return "chair_alt";
  if (n.includes("motor") || n.includes("pump")) return "settings";
  if (n.includes("cable") || n.includes("wire") || n.includes("electric"))
    return "bolt";
  if (n.includes("tool")) return "construction";
  if (n.includes("pallet") || n.includes("box")) return "inventory_2";
  if (n.includes("monitor") || n.includes("screen") || n.includes("computer"))
    return "monitor";
  return "category";
}

function conditionBadge(cond: string) {
  switch (cond) {
    case "LIKE_NEW":
      return { label: "Excellent Condition", bg: "bg-tertiary" };
    case "GOOD":
      return { label: "Good Condition", bg: "bg-primary" };
    case "FAIR":
      return { label: "Fair / Salvage", bg: "bg-secondary" };
    default:
      return { label: "For Scrap", bg: "bg-error" };
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim() ?? "";

  if (!user) {
    return (
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Welcome to Asset Alert</h1>
        <p className="mt-2 text-on-surface-variant">
          Stop scrapping things other departments need.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-full bg-primary px-6 py-2 font-medium text-white hover:bg-primary-container"
        >
          Log in to continue
        </Link>
      </div>
    );
  }

  const searchFilter: Prisma.OfferWhereInput = q
    ? {
        OR: [
          { itemName: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [liveOffers, allLiveOffers, activeClaimCount] = await Promise.all([
    prisma.offer.findMany({
      where: {
        status: "AVAILABLE",
        offeringUserId: { not: user.id },
        ...searchFilter,
      },
      include: { offeringUser: true },
      orderBy: { scrapDate: "asc" },
      take: 6,
    }),
    prisma.offer.findMany({
      where: { status: "AVAILABLE" },
      select: { estimatedValue: true },
    }),
    prisma.claim.count({
      where: {
        claimingUserId: user.id,
        status: { in: ["PENDING", "PICKUP_SCHEDULED"] },
      },
    }),
  ]);

  const portfolioValue = allLiveOffers.reduce(
    (s, o) => s + o.estimatedValue,
    0,
  );
  const liveOffersCount = allLiveOffers.length;

  return (
    <div>
      {/* Hero / bento grid */}
      <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-container p-8 text-white shadow-xl md:col-span-2">
          <div className="relative z-10">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary-fixed">
              Portfolio Value
            </p>
            <h2 className="text-editorial-display text-5xl font-black">
              ₪{(portfolioValue / 1000).toFixed(1)}K
            </h2>
            <p className="mt-4 max-w-xs text-sm text-primary-fixed/80">
              Total estimated value of industrial assets currently in the live
              pipeline.
            </p>
          </div>
          <div className="relative z-10 mt-8 flex items-center gap-4">
            <Link
              href="/analytics"
              className="rounded-full bg-white px-6 py-2 text-sm font-bold text-primary shadow-sm"
            >
              View Analytics
            </Link>
            <span className="text-xs font-medium text-primary-fixed">
              Live across {new Set(liveOffers.map((o) => o.offeringUser.department)).size}+
              departments
            </span>
          </div>
          <div className="absolute -bottom-4 -right-4 opacity-10">
            <span className="material-symbols-outlined text-[180px]">
              precision_manufacturing
            </span>
          </div>
        </div>

        <StatCard
          icon="check_circle"
          iconColor="text-tertiary"
          label="Active Claims"
          value={activeClaimCount.toString()}
          sub={
            activeClaimCount === 0
              ? "None pending"
              : `${activeClaimCount} awaiting pickup`
          }
        />
        <StatCard
          icon="local_shipping"
          iconColor="text-primary-container"
          label="Live Offers"
          value={liveOffersCount.toString()}
          sub={
            liveOffers[0]
              ? `Newest from ${liveOffers[0].offeringUser.department}`
              : "None right now"
          }
        />
      </section>

      {/* Search + header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Live Offers</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {q
              ? `Search results for "${q}"`
              : "Available for immediate claim or salvage"}
          </p>
        </div>
        <form action="/" method="GET" className="flex w-full max-w-md items-center gap-2 rounded-full bg-surface-container px-4 py-2">
          <span className="material-symbols-outlined text-outline">search</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by item, description, or location..."
            className="w-full border-none bg-transparent text-sm placeholder:text-outline focus:outline-none focus:ring-0"
          />
          {q && (
            <Link
              href="/"
              aria-label="Clear search"
              className="rounded-full p-1 text-outline hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </Link>
          )}
        </form>
      </div>

      {/* Offer grid */}
      {liveOffers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-10 text-center text-on-surface-variant">
          {q
            ? `No offers match "${q}". Try a different search.`
            : "No live offers right now from other departments."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {liveOffers.map((o) => {
            const days = daysUntil(o.scrapDate);
            const urgent = days <= 1;
            const badge = conditionBadge(o.condition);
            return (
              <Link
                key={o.id}
                href={`/offers/${o.id}`}
                className="group block overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-xl"
              >
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-surface-container-high to-surface-container">
                  <div className="flex h-full w-full items-center justify-center text-primary/40 transition-transform duration-500 group-hover:scale-105">
                    <span className="material-symbols-outlined text-[96px]">
                      {iconFor(o.itemName)}
                    </span>
                  </div>
                  <div
                    className={`absolute left-3 top-3 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-tighter text-white ${badge.bg}`}
                  >
                    {badge.label}
                  </div>
                </div>
                <div className="p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-on-surface">
                      {o.itemName}
                    </h3>
                    <span className="whitespace-nowrap font-black text-primary">
                      {o.estimatedValue > 0
                        ? `₪${o.estimatedValue.toLocaleString()}`
                        : "—"}
                    </span>
                  </div>
                  <div className="mb-6 flex flex-wrap gap-y-2">
                    <div className="flex w-1/2 items-center gap-2">
                      <span className="material-symbols-outlined text-xs text-outline">
                        domain
                      </span>
                      <span className="text-xs font-medium text-on-surface-variant">
                        {o.offeringUser.department}
                      </span>
                    </div>
                    <div className="flex w-1/2 items-center gap-2">
                      <span className="material-symbols-outlined text-xs text-outline">
                        location_on
                      </span>
                      <span className="truncate text-xs font-medium text-on-surface-variant">
                        {o.location}
                      </span>
                    </div>
                    <div className="flex w-full items-center gap-2">
                      <span className="material-symbols-outlined text-xs text-outline">
                        schedule
                      </span>
                      <span
                        className={`text-xs font-bold uppercase tracking-tighter ${urgent ? "text-error" : "text-on-surface-variant"}`}
                      >
                        Deadline:{" "}
                        {days > 0 ? `${days}d left` : "expired"}
                      </span>
                    </div>
                    <div className="flex w-full items-center gap-2">
                      <span className="material-symbols-outlined text-xs text-outline">
                        inventory_2
                      </span>
                      <span className="text-xs font-medium text-on-surface-variant">
                        qty {o.quantity} · {formatCondition(o.condition)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full rounded-lg bg-surface-container py-3 text-center font-bold text-primary transition-colors group-hover:bg-primary-container group-hover:text-white">
                    Claim Asset
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-[0_10px_30px_-5px_rgba(25,27,35,0.06)]">
      <div>
        <span className={`material-symbols-outlined mb-2 ${iconColor}`}>
          {icon}
        </span>
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </p>
        <h3 className="mt-1 text-3xl font-bold text-on-surface">{value}</h3>
      </div>
      <p className="text-xs text-on-surface-variant">{sub}</p>
    </div>
  );
}
