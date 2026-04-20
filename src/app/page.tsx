import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatCondition, daysUntil } from "@/lib/format";
import { iconFor, conditionBadge, offerStatusColor } from "@/lib/display";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();

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

  const [liveOffers, allLiveOffers, userClaims, myOffers] = await Promise.all([
    prisma.offer.findMany({
      where: { status: "AVAILABLE", offeringUserId: { not: user.id } },
      include: { offeringUser: true },
      orderBy: { scrapDate: "asc" },
      take: 4,
    }),
    prisma.offer.findMany({
      where: { status: "AVAILABLE" },
      select: { estimatedValue: true },
    }),
    prisma.claim.findMany({
      where: { claimingUserId: user.id },
      include: { offer: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.offer.findMany({
      where: { offeringUserId: user.id },
      include: { claim: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const portfolioValue = allLiveOffers.reduce(
    (s, o) => s + o.estimatedValue,
    0,
  );
  const activeClaimsCount = userClaims.filter((c) =>
    ["PENDING", "PICKUP_SCHEDULED"].includes(c.status),
  ).length;
  const liveOffersCount = allLiveOffers.length;

  return (
    <div>
      {/* Hero / bento grid */}
      <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-4">
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
          value={activeClaimsCount.toString()}
          sub={
            activeClaimsCount === 0
              ? "None pending"
              : `${activeClaimsCount} awaiting pickup`
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

      {/* Asymmetric main grid */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Live offers */}
        <div className="lg:col-span-2">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-on-surface">
                Live Offers
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Available for immediate claim or salvage
              </p>
            </div>
            <Link
              href="/offers/new"
              className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              Post item{" "}
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </Link>
          </div>

          {liveOffers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-10 text-center text-on-surface-variant">
              No live offers right now from other departments.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

        {/* Recent claims sidebar */}
        <div className="lg:col-span-1">
          <div className="h-fit rounded-xl bg-surface-container-low p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-on-surface">
                Recent Claims
              </h2>
              <span className="rounded bg-surface-container-highest px-2 py-1 text-[10px] font-black uppercase">
                {activeClaimsCount > 0 ? "Active" : "None"}
              </span>
            </div>

            {userClaims.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                You haven&apos;t claimed anything yet. Browse live offers on the
                left to start.
              </p>
            ) : (
              <div className="space-y-4">
                {userClaims.map((c) => (
                  <Link
                    key={c.id}
                    href={`/offers/${c.offerId}`}
                    className="group flex items-center gap-4 rounded-lg bg-surface-container-lowest p-4 transition-all hover:shadow-sm"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-primary-fixed text-primary">
                      <span className="material-symbols-outlined">
                        {iconFor(c.offer.itemName)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-on-surface">
                        {c.offer.itemName}
                      </p>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
                        {c.status.replace("_", " ").toLowerCase()}
                      </p>
                    </div>
                    <div
                      className={`h-2 w-2 rounded-full ${
                        c.status === "COMPLETED"
                          ? "bg-tertiary"
                          : c.status === "CANCELLED"
                            ? "bg-error"
                            : "bg-primary"
                      }`}
                    />
                  </Link>
                ))}
              </div>
            )}

            <Link
              href="/inbox"
              className="mt-6 flex w-full items-center justify-center gap-2 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:text-primary"
            >
              View Notifications{" "}
              <span className="material-symbols-outlined text-sm">history</span>
            </Link>
          </div>

          <div className="relative mt-10 overflow-hidden rounded-xl bg-[#191b23] p-6 text-white">
            <h4 className="relative z-10 text-lg font-bold">
              Coming next iteration
            </h4>
            <p className="relative z-10 mt-1 text-sm text-slate-400">
              Real email alerts (SendGrid), LDAP login, photo uploads, advanced
              search.
            </p>
            <Link
              href="/analytics"
              className="relative z-10 mt-4 inline-block rounded-lg bg-white px-4 py-2 text-xs font-black uppercase tracking-tight text-[#191b23]"
            >
              See Analytics
            </Link>
            <div className="absolute -bottom-4 -right-4 opacity-10">
              <span className="material-symbols-outlined text-8xl">
                factory
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* My Offers preview */}
      {myOffers.length > 0 && (
        <div className="mt-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-on-surface">My Offers</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Your most recent listings — view all on the My Offers page
              </p>
            </div>
            <Link
              href="/my-offers"
              className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              View all{" "}
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myOffers.map((o) => {
              const badge = conditionBadge(o.condition);
              const statusColor = offerStatusColor(o.status);
              return (
                <Link
                  key={o.id}
                  href={`/offers/${o.id}`}
                  className="group flex items-center gap-4 rounded-xl bg-surface-container-lowest p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                    <span className="material-symbols-outlined">
                      {iconFor(o.itemName)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-on-surface">
                      {o.itemName}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      qty {o.quantity} · {badge.label}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {o.claim ? "1 claim" : "No claims yet"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-tight text-white ${statusColor}`}
                  >
                    {o.status.toLowerCase()}
                  </span>
                </Link>
              );
            })}
          </div>
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
