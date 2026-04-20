import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatCondition, daysUntil } from "@/lib/format";
import { CATEGORIES, getCategory, isValidCategory } from "@/lib/categories";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

function buildHref(
  q: string,
  view: "grid" | "list",
  category: string | null,
): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (view === "list") params.set("view", "list");
  if (category) params.set("category", category);
  const s = params.toString();
  return s ? `/?${s}` : "/";
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
  searchParams: Promise<{ q?: string; view?: string; category?: string }>;
}) {
  const user = await getCurrentUser();
  const { q: rawQ, view: rawView, category: rawCat } = await searchParams;
  const q = rawQ?.trim() ?? "";
  const view: "grid" | "list" = rawView === "list" ? "list" : "grid";
  const category = rawCat && isValidCategory(rawCat) ? rawCat : null;
  const take = view === "list" ? 20 : 6;

  if (!user) {
    return (
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Welcome to SecondLife</h1>
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

  const filters: Prisma.OfferWhereInput[] = [];
  if (q) {
    filters.push({
      OR: [
        { itemName: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (category) {
    filters.push({ category });
  }

  const [liveOffers, allLiveOffers, activeClaimCount, categoryCounts] =
    await Promise.all([
    prisma.offer.findMany({
      where: {
        status: "AVAILABLE",
        offeringUserId: { not: user.id },
        AND: filters,
      },
      include: { offeringUser: true },
      orderBy: { scrapDate: "asc" },
      take,
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
    prisma.offer.groupBy({
      by: ["category"],
      where: {
        status: "AVAILABLE",
        offeringUserId: { not: user.id },
      },
      _count: { _all: true },
    }),
  ]);

  const portfolioValue = allLiveOffers.reduce(
    (s, o) => s + o.estimatedValue,
    0,
  );
  const liveOffersCount = allLiveOffers.length;

  const countByCategory = new Map(
    categoryCounts.map((c) => [c.category, c._count._all]),
  );
  const totalCount = categoryCounts.reduce((s, c) => s + c._count._all, 0);

  return (
    <div>
      {/* Hero / bento grid */}
      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-container p-5 text-white shadow-md md:col-span-2">
          <div className="relative z-10">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary-fixed">
              Portfolio Value
            </p>
            <h2 className="text-3xl font-black">
              ₪{(portfolioValue / 1000).toFixed(1)}K
            </h2>
            <p className="mt-1 max-w-xs text-xs text-primary-fixed/80">
              Total value of industrial assets in the live pipeline.
            </p>
          </div>
          <div className="relative z-10 mt-3 flex items-center gap-3">
            <Link
              href="/analytics"
              className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-primary shadow-sm"
            >
              View Analytics
            </Link>
            <span className="text-[10px] font-medium text-primary-fixed">
              Live across {new Set(liveOffers.map((o) => o.offeringUser.department)).size}+
              departments
            </span>
          </div>
          <div className="absolute -bottom-4 -right-4 opacity-10">
            <span className="material-symbols-outlined text-[120px]">
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
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Live Offers</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {category
              ? `Filtered: ${getCategory(category).label}${q ? ` · "${q}"` : ""}`
              : q
                ? `Search results for "${q}"`
                : "Available for immediate claim or salvage"}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 md:max-w-xl">
          <form
            action="/"
            method="GET"
            className="flex flex-1 items-center gap-2 rounded-full bg-surface-container px-4 py-2"
          >
            <span className="material-symbols-outlined text-outline">search</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by item, description, or location..."
              className="w-full border-none bg-transparent text-sm placeholder:text-outline focus:outline-none focus:ring-0"
            />
            <input type="hidden" name="view" value={view} />
            {category && (
              <input type="hidden" name="category" value={category} />
            )}
            {q && (
              <Link
                href={buildHref("", view, category)}
                aria-label="Clear search"
                className="rounded-full p-1 text-outline hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </Link>
            )}
          </form>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-surface-container p-1">
            <Link
              href={buildHref(q, "grid", category)}
              aria-label="Grid view"
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                view === "grid"
                  ? "bg-white text-primary shadow-sm"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg">grid_view</span>
            </Link>
            <Link
              href={buildHref(q, "list", category)}
              aria-label="List view"
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                view === "list"
                  ? "bg-white text-primary shadow-sm"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg">view_list</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="mb-6 -mx-1 flex flex-wrap gap-2 overflow-x-auto pb-1">
        <Link
          href={buildHref(q, view, null)}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
            !category
              ? "bg-primary text-white shadow-sm"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          All
          <span className={`rounded-full px-1.5 text-[10px] ${!category ? "bg-white/20" : "bg-white/70"}`}>
            {totalCount}
          </span>
        </Link>
        {CATEGORIES.map((c) => {
          const count = countByCategory.get(c.id) ?? 0;
          if (count === 0 && category !== c.id) return null;
          const active = category === c.id;
          return (
            <Link
              key={c.id}
              href={buildHref(q, view, active ? null : c.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{c.icon}</span>
              {c.label}
              <span
                className={`rounded-full px-1.5 text-[10px] ${
                  active ? "bg-white/20" : "bg-white/70"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Offer grid or list */}
      {liveOffers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-10 text-center text-on-surface-variant">
          {q
            ? `No offers match "${q}". Try a different search.`
            : "No live offers right now from other departments."}
        </div>
      ) : view === "list" ? (
        <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="hidden border-b border-outline-variant/20 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant md:grid md:grid-cols-[2fr_1fr_1.5fr_1fr_0.8fr_0.8fr] md:gap-4">
            <div>Item</div>
            <div>Department</div>
            <div>Location</div>
            <div>Deadline</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Value</div>
          </div>
          <ul className="divide-y divide-outline-variant/20">
            {liveOffers.map((o) => {
              const days = daysUntil(o.scrapDate);
              const urgent = days <= 1;
              const badge = conditionBadge(o.condition);
              return (
                <li key={o.id}>
                  <Link
                    href={`/offers/${o.id}`}
                    className="group flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-surface-container md:grid md:grid-cols-[2fr_1fr_1.5fr_1fr_0.8fr_0.8fr] md:items-center md:gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                        <span className="material-symbols-outlined text-base">
                          {getCategory(o.category).icon}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-on-surface">
                          {o.itemName}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tight text-white ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                          {o.subCategory && (
                            <span className="truncate text-[10px] text-outline">
                              {o.subCategory}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="truncate text-xs text-on-surface-variant">
                      {o.offeringUser.department}
                    </div>
                    <div className="truncate text-xs text-on-surface-variant">
                      {o.location}
                    </div>
                    <div
                      className={`text-xs font-bold uppercase tracking-tight ${
                        urgent ? "text-error" : "text-on-surface-variant"
                      }`}
                    >
                      {days > 0 ? `${days}d left` : "expired"}
                    </div>
                    <div className="text-right text-xs font-medium text-on-surface">
                      {o.quantity}
                    </div>
                    <div className="text-right text-sm font-black text-primary">
                      {o.estimatedValue > 0
                        ? `₪${o.estimatedValue.toLocaleString()}`
                        : "—"}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
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
                      {getCategory(o.category).icon}
                    </span>
                  </div>
                  <div
                    className={`absolute left-3 top-3 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-tighter text-white ${badge.bg}`}
                  >
                    {badge.label}
                  </div>
                  <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-on-surface shadow-sm backdrop-blur">
                    <span className="material-symbols-outlined text-xs">
                      {getCategory(o.category).icon}
                    </span>
                    {getCategory(o.category).label}
                  </div>
                </div>
                <div className="p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-on-surface">
                        {o.itemName}
                      </h3>
                      {o.subCategory && (
                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                          {getCategory(o.category).label} · {o.subCategory}
                        </p>
                      )}
                    </div>
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
    <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-4 shadow-[0_10px_30px_-5px_rgba(25,27,35,0.06)]">
      <div>
        <span className={`material-symbols-outlined mb-1 text-lg ${iconColor}`}>
          {icon}
        </span>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </p>
        <h3 className="mt-0.5 text-2xl font-bold text-on-surface">{value}</h3>
      </div>
      <p className="mt-1 text-[10px] text-on-surface-variant">{sub}</p>
    </div>
  );
}
