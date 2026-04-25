import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { OfferGridCard } from "@/components/OfferGridCard";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "My Offers | SecondLife" };

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  CLAIMED: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  SCRAPPED: "bg-gray-200 text-gray-700",
};

type OfferStatus = "AVAILABLE" | "CLAIMED" | "COMPLETED" | "SCRAPPED";

const SECTION_ORDER: { status: OfferStatus; label: string; icon: string }[] = [
  { status: "AVAILABLE", label: "Available", icon: "check_circle" },
  { status: "CLAIMED", label: "Claimed", icon: "assignment_ind" },
  { status: "COMPLETED", label: "Completed", icon: "task_alt" },
  { status: "SCRAPPED", label: "Scrapped", icon: "delete" },
];

const FILTERS: {
  key: "all" | Lowercase<OfferStatus>;
  label: string;
  status?: OfferStatus;
}[] = [
  { key: "all", label: "All" },
  { key: "available", label: "Available", status: "AVAILABLE" },
  { key: "claimed", label: "Claimed", status: "CLAIMED" },
  { key: "completed", label: "Completed", status: "COMPLETED" },
  { key: "scrapped", label: "Scrapped", status: "SCRAPPED" },
];

export default async function MyOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { status: statusParam } = await searchParams;
  const activeFilter =
    FILTERS.find((f) => f.key === statusParam?.toLowerCase())?.key ?? "all";

  const offers = await prisma.offer.findMany({
    where: { offeringUserId: user.id },
    include: { claim: { include: { claimingUser: true } } },
    orderBy: { createdAt: "desc" },
  });

  const counts = {
    total: offers.length,
    available: offers.filter((o) => o.status === "AVAILABLE").length,
    claimed: offers.filter((o) => o.status === "CLAIMED").length,
    completed: offers.filter((o) => o.status === "COMPLETED").length,
    scrapped: offers.filter((o) => o.status === "SCRAPPED").length,
  };

  const filterCount = (key: (typeof FILTERS)[number]["key"]) => {
    if (key === "all") return counts.total;
    if (key === "available") return counts.available;
    if (key === "claimed") return counts.claimed;
    if (key === "completed") return counts.completed;
    return counts.scrapped;
  };

  const visibleSections = SECTION_ORDER.filter((section) => {
    if (activeFilter !== "all") {
      const match = FILTERS.find((f) => f.key === activeFilter);
      if (match?.status !== section.status) return false;
    }
    return offers.some((o) => o.status === section.status);
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-editorial-display text-4xl font-extrabold tracking-tight text-on-surface">
            My Offers
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Every listing you&apos;ve posted — edit, retire, or track their
            status.
          </p>
        </div>
        <Link
          href="/offers/new"
          className="flex items-center gap-2 self-start rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md hover:scale-[1.02] md:self-auto"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Post new item
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total" value={counts.total} />
        <Stat label="Available" value={counts.available} tone="green" />
        <Stat label="Claimed" value={counts.claimed} tone="amber" />
        <Stat label="Completed" value={counts.completed} tone="blue" />
      </section>

      {offers.length > 0 && (
        <nav
          aria-label="Filter offers by status"
          className="flex flex-wrap gap-2"
        >
          {FILTERS.map((f) => {
            const isActive = f.key === activeFilter;
            const href = f.key === "all" ? "/my-offers" : `/my-offers?status=${f.key}`;
            return (
              <Link
                key={f.key}
                href={href}
                className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-outline-variant/60 bg-surface-container-lowest text-on-surface hover:bg-surface-container"
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {filterCount(f.key)}
                </span>
              </Link>
            );
          })}
        </nav>
      )}

      {offers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-outline">
            inventory_2
          </span>
          <h3 className="mt-3 text-lg font-bold text-on-surface">
            No offers yet
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Post your first item to make it visible to other departments.
          </p>
          <Link
            href="/offers/new"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-white"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Post new item
          </Link>
        </div>
      ) : visibleSections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-10 text-center">
          <span className="material-symbols-outlined text-4xl text-outline">
            filter_list_off
          </span>
          <p className="mt-2 text-sm text-on-surface-variant">
            No offers match this filter.
          </p>
          <Link
            href="/my-offers"
            className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Clear filter
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {visibleSections.map((section) => {
            const sectionOffers = offers.filter(
              (o) => o.status === section.status,
            );
            return (
              <section key={section.status} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${STATUS_STYLE[section.status]}`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {section.icon}
                    </span>
                  </span>
                  <h3 className="text-xl font-extrabold text-on-surface">
                    {section.label}
                  </h3>
                  <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-bold text-on-surface-variant">
                    {sectionOffers.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sectionOffers.map((o) => (
                    <OfferGridCard key={o.id} offer={o} mode="owner" />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green" | "amber" | "blue";
}) {
  const toneCls =
    tone === "green"
      ? "text-green-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "blue"
          ? "text-blue-700"
          : "text-on-surface";
  return (
    <div className="rounded-xl bg-surface-container-lowest p-5 shadow-[0_10px_30px_-5px_rgba(25,27,35,0.04)]">
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <h3 className={`mt-1 text-3xl font-extrabold ${toneCls}`}>{value}</h3>
    </div>
  );
}

