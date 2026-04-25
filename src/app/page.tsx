import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatCondition, daysUntil } from "@/lib/format";
import { CATEGORIES, getCategory, isValidCategory } from "@/lib/categories";
import { createSearchSubscriptionAction } from "@/lib/actions";
import Link from "next/link";
import Image from "next/image";
import type { Prisma } from "@prisma/client";

function buildHref(
  q: string,
  view: "grid" | "list",
  category: string | null,
  page: number = 1,
): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (view === "list") params.set("view", "list");
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const s = params.toString();
  return s ? `/?${s}` : "/";
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < nums.length; i++) {
    if (i > 0 && nums[i] - nums[i - 1] > 1) out.push("…");
    out.push(nums[i]);
  }
  return out;
}

function conditionBadge(cond: string) {
  switch (cond) {
    case "LIKE_NEW":
      return { label: "Excellent", cls: "excellent" };
    case "GOOD":
      return { label: "Good", cls: "good" };
    case "FAIR":
      return { label: "Fair", cls: "fair" };
    default:
      return { label: "Salvage", cls: "salvage" };
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string; category?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  const { q: rawQ, view: rawView, category: rawCat, page: rawPage } = await searchParams;
  const q = rawQ?.trim() ?? "";
  const view: "grid" | "list" = rawView === "list" ? "list" : "grid";
  const category = rawCat && isValidCategory(rawCat) ? rawCat : null;
  const take = view === "list" ? 20 : 24;

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

  const matchingCount = await prisma.offer.count({
    where: {
      status: "AVAILABLE",
      offeringUserId: { not: user.id },
      AND: filters,
    },
  });
  const totalPages = Math.max(1, Math.ceil(matchingCount / take));
  const parsedPage = Number(rawPage);
  const page =
    Number.isFinite(parsedPage) && parsedPage >= 1
      ? Math.min(Math.floor(parsedPage), totalPages)
      : 1;
  const skip = (page - 1) * take;

  const [
    liveOffers,
    categoryCounts,
    pendingReceipts,
  ] = await Promise.all([
    prisma.offer.findMany({
      where: {
        status: "AVAILABLE",
        offeringUserId: { not: user.id },
        AND: filters,
      },
      include: { offeringUser: true },
      orderBy: { scrapDate: "asc" },
      skip,
      take,
    }),
    prisma.offer.groupBy({
      by: ["category"],
      where: {
        status: "AVAILABLE",
        offeringUserId: { not: user.id },
      },
      _count: { _all: true },
    }),
    prisma.claim.findMany({
      where: {
        claimingUserId: user.id,
        status: { in: ["PENDING", "PICKUP_SCHEDULED"] },
      },
      include: { offer: true },
      orderBy: { createdAt: "asc" },
      take: 3,
    }),
  ]);

  const countByCategory = new Map(
    categoryCounts.map((c) => [c.category, c._count._all]),
  );
  const totalCount = categoryCounts.reduce((s, c) => s + c._count._all, 0);

  return (
    <div>
      {/* Pending-receipt banner */}
      {pendingReceipts.length > 0 && (
        <section className="mb-6 overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-100 px-5 py-3">
            <span className="material-symbols-outlined text-amber-700">
              notifications_active
            </span>
            <h3 className="text-sm font-bold text-amber-900">
              {pendingReceipts.length === 1
                ? "1 item waiting to be received"
                : `${pendingReceipts.length} items waiting to be received`}
            </h3>
          </div>
          <ul className="divide-y divide-amber-200">
            {pendingReceipts.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/offers/${c.offerId}`}
                  className="group flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-amber-100"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-amber-950">
                      {c.offer.itemName}
                    </p>
                    <p className="truncate text-xs text-amber-800">
                      {c.offer.location}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-bold text-white transition-all group-hover:bg-green-700">
                    <span className="material-symbols-outlined text-sm">
                      check_circle
                    </span>
                    Mark received
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Free banner */}
      <div className="free-banner">
        <div className="free-banner-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.5 2 7 0 5.5-4 10-10 11" />
            <path d="M2 22c5-3 7-7.5 9-15" />
          </svg>
        </div>
        <div className="free-banner-body">
          <div className="free-banner-title">
            <span className="pill">FREE TO CLAIM</span>
            Everything here is an internal asset available at no cost
          </div>
          <div className="free-banner-desc">
            Replacement values are shown as reference only — no budget, PO, or
            transfer charge is required. Listings expire after the deadline and
            are sent to salvage.
          </div>
        </div>
      </div>

      {/* Page head */}
      <div className="page-head">
        <div>
          <div className="page-title">Live Offers</div>
          <div className="page-subtitle">
            {category
              ? `Filtered: ${getCategory(category).label}${q ? ` · "${q}"` : ""}`
              : q
                ? `Search results for "${q}"`
                : "Available for immediate claim or salvage"}
            {" · "}
            {totalCount} items across {categoryCounts.length} categories
          </div>
        </div>
        <div className="page-head-right">
          <form action="/" method="GET" className="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by item, description, or location…"
            />
            <input type="hidden" name="view" value={view} />
            {category && (
              <input type="hidden" name="category" value={category} />
            )}
          </form>
          <div className="view-toggle">
            <Link
              href={buildHref(q, "grid", category)}
              aria-label="Grid view"
              className={view === "grid" ? "active" : ""}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            </Link>
            <Link
              href={buildHref(q, "list", category)}
              aria-label="List view"
              className={view === "list" ? "active" : ""}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" x2="21" y1="6" y2="6" />
                <line x1="8" x2="21" y1="12" y2="12" />
                <line x1="8" x2="21" y1="18" y2="18" />
                <line x1="3" x2="3.01" y1="6" y2="6" />
                <line x1="3" x2="3.01" y1="12" y2="12" />
                <line x1="3" x2="3.01" y1="18" y2="18" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <Link
          href={buildHref(q, view, null)}
          className={`chip ${!category ? "active" : ""}`}
        >
          All <span className="count">{totalCount}</span>
        </Link>
        {CATEGORIES.map((c) => {
          const count = countByCategory.get(c.id) ?? 0;
          if (count === 0 && category !== c.id) return null;
          const active = category === c.id;
          return (
            <Link
              key={c.id}
              href={buildHref(q, view, active ? null : c.id)}
              className={`chip ${active ? "active" : ""}`}
            >
              {c.label} <span className="count">{count}</span>
            </Link>
          );
        })}
        <span className="filter-sort">Deadline: soonest ▾</span>
      </div>

      {/* Results count */}
      <div className="results-count">
        {matchingCount === 0 ? (
          <>Showing <b>0</b></>
        ) : (
          <>
            Showing <b>{skip + 1}–{skip + liveOffers.length}</b> of{" "}
            <b>{matchingCount}</b>
            {totalPages > 1 && <> · page {page} of {totalPages}</>}
          </>
        )}
      </div>

      {/* Offer grid or list */}
      {liveOffers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-10 text-center text-on-surface-variant">
          {q ? (
            <>
              <p>No offers match &quot;{q}&quot; right now.</p>
              <form
                action={createSearchSubscriptionAction}
                className="mt-4 flex justify-center"
              >
                <input type="hidden" name="query" value={q} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-container"
                >
                  <span className="material-symbols-outlined text-base">
                    notifications_active
                  </span>
                  Notify me when it&apos;s added
                </button>
              </form>
              <p className="mt-2 text-xs text-on-surface-variant/70">
                We&apos;ll drop a note in your inbox the moment a matching item
                is posted.
              </p>
            </>
          ) : (
            "No live offers right now from other departments."
          )}
        </div>
      ) : view === "list" ? (
        <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="hidden border-b border-outline-variant/20 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant md:grid md:grid-cols-[2.5fr_1fr_1.5fr_1fr_0.8fr_0.8fr_6rem] md:gap-4">
            <div>Item</div>
            <div>Department</div>
            <div>Location</div>
            <div>Deadline</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Est. Value</div>
            <div className="sr-only">Action</div>
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
                    className="group flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-surface-container md:grid md:grid-cols-[2.5fr_1fr_1.5fr_1fr_0.8fr_0.8fr_6rem] md:items-center md:gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {o.images[0] ? (
                        <Image
                          src={o.images[0]}
                          alt=""
                          width={64}
                          height={64}
                          className="h-16 w-16 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                          <span className="material-symbols-outlined text-3xl">
                            {getCategory(o.category).icon}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-on-surface">
                          {o.itemName}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`card-cond ${badge.cls}`}>
                            <span className="dot" />
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
                    <div className="text-right text-xs text-gray-500">
                      {o.estimatedValue > 0
                        ? `$${o.estimatedValue.toLocaleString()}`
                        : "—"}
                    </div>
                    <div className="mt-2 md:mt-0 md:justify-self-end">
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1.5 text-xs font-bold text-primary transition-colors group-hover:bg-primary-container group-hover:text-white">
                        View
                        <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-0.5">
                          arrow_forward
                        </span>
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {liveOffers.map((o) => {
            const days = daysUntil(o.scrapDate);
            const urgent = days <= 1;
            const overdue = days <= 0;
            const badge = conditionBadge(o.condition);
            return (
              <Link
                key={o.id}
                href={`/offers/${o.id}`}
                aria-label={`View and claim ${o.itemName}`}
                className="group block overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-surface-container-high to-surface-container">
                  {overdue && (
                    <div className="absolute inset-x-0 top-0 z-10 bg-amber-500/95 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-white shadow-sm backdrop-blur">
                      Overdue
                    </div>
                  )}
                  {o.images[0] ? (
                    <Image
                      src={o.images[0]}
                      alt={o.itemName}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-primary/40 transition-transform duration-500 group-hover:scale-105">
                      <span className="material-symbols-outlined text-[96px]">
                        {getCategory(o.category).icon}
                      </span>
                    </div>
                  )}
                  <span className={`card-cond ${badge.cls} absolute left-3 top-3`}>
                    <span className="dot" />
                    {badge.label}
                  </span>
                  <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-on-surface shadow-sm backdrop-blur">
                    <span className="material-symbols-outlined text-xs">
                      {getCategory(o.category).icon}
                    </span>
                    {getCategory(o.category).label}
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-2 min-w-0">
                    <h3 className="text-lg font-bold text-on-surface">
                      {o.itemName}
                    </h3>
                    {o.subCategory && (
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        {getCategory(o.category).label} · {o.subCategory}
                      </p>
                    )}
                    {o.estimatedValue > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        Estimated Value: ${o.estimatedValue.toLocaleString()}
                      </p>
                    )}
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
                  <span
                    role="button"
                    aria-hidden="true"
                    className="block w-full rounded-lg bg-surface-container py-3 text-center font-bold text-primary transition-colors group-hover:bg-primary-container group-hover:text-white"
                  >
                    Claim Asset
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-6 flex flex-wrap items-center justify-center gap-1"
        >
          {page > 1 ? (
            <Link
              href={buildHref(q, view, category, page - 1)}
              className="flex h-9 items-center gap-1 rounded-full bg-surface-container px-3 text-xs font-bold text-on-surface hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
              Prev
            </Link>
          ) : (
            <span className="flex h-9 items-center gap-1 rounded-full bg-surface-container/50 px-3 text-xs font-bold text-outline">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
              Prev
            </span>
          )}
          {pageNumbers(page, totalPages).map((n, i) =>
            n === "…" ? (
              <span
                key={`e${i}`}
                className="flex h-9 w-9 items-center justify-center text-xs text-outline"
              >
                …
              </span>
            ) : n === page ? (
              <span
                key={n}
                aria-current="page"
                className="flex h-9 min-w-9 items-center justify-center rounded-full bg-primary px-3 text-xs font-bold text-white shadow-sm"
              >
                {n}
              </span>
            ) : (
              <Link
                key={n}
                href={buildHref(q, view, category, n)}
                className="flex h-9 min-w-9 items-center justify-center rounded-full bg-surface-container px-3 text-xs font-bold text-on-surface hover:bg-surface-container-high"
              >
                {n}
              </Link>
            ),
          )}
          {page < totalPages ? (
            <Link
              href={buildHref(q, view, category, page + 1)}
              className="flex h-9 items-center gap-1 rounded-full bg-surface-container px-3 text-xs font-bold text-on-surface hover:bg-surface-container-high"
            >
              Next
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Link>
          ) : (
            <span className="flex h-9 items-center gap-1 rounded-full bg-surface-container/50 px-3 text-xs font-bold text-outline">
              Next
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </span>
          )}
        </nav>
      )}
    </div>
  );
}

