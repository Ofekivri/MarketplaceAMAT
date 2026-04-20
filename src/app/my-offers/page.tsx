import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { daysUntil, formatRelative } from "@/lib/format";
import { iconFor, conditionBadge, offerStatusColor } from "@/lib/display";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "My Offers | Asset Alert" };

type MyOffer = Awaited<ReturnType<typeof fetchMyOffers>>[number];

async function fetchMyOffers(userId: string) {
  return prisma.offer.findMany({
    where: { offeringUserId: userId },
    include: { claim: { include: { claimingUser: true } } },
    orderBy: [{ status: "asc" }, { scrapDate: "asc" }],
  });
}

export default async function MyOffersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const offers = await fetchMyOffers(user.id);

  const available = offers.filter((o) => o.status === "AVAILABLE");
  const claimed = offers.filter((o) => o.status === "CLAIMED");
  const archive = offers.filter((o) =>
    ["COMPLETED", "SCRAPPED"].includes(o.status),
  );

  const totalValue = offers.reduce((s, o) => s + o.estimatedValue, 0);
  const recoveredValue = offers
    .filter((o) => o.status === "COMPLETED")
    .reduce((s, o) => s + o.estimatedValue, 0);

  if (offers.length === 0) {
    return <EmptyPage />;
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">
            My Offers
          </h2>
          <p className="mt-1 text-on-surface-variant">
            Items you&apos;ve listed — grouped by status, most urgent first.
          </p>
        </div>
        <Link
          href="/offers/new"
          className="flex items-center gap-1 self-start rounded-full bg-primary px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-container md:self-auto"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Post another
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatTile
          label="Active"
          value={String(available.length).padStart(2, "0")}
          sub="Awaiting a claim"
          accent="text-tertiary"
        />
        <StatTile
          label="Claimed"
          value={String(claimed.length).padStart(2, "0")}
          sub="Awaiting pickup"
          accent="text-primary"
        />
        <StatTile
          label="Value Recovered"
          value={`₪${(recoveredValue / 1000).toFixed(1)}K`}
          sub={`of ₪${(totalValue / 1000).toFixed(1)}K listed`}
          accent="text-on-surface"
        />
      </div>

      {/* Active */}
      <Section
        title="Active"
        accent="bg-tertiary"
        count={available.length}
        emptyIcon="inventory_2"
        emptyTitle="Nothing awaiting a claim"
        emptyBody="Post an item or check back when new listings are made."
        offers={available}
      />

      {/* Claimed */}
      <Section
        title="Claimed — awaiting pickup"
        accent="bg-primary"
        count={claimed.length}
        emptyIcon="schedule"
        emptyTitle="No pending pickups"
        emptyBody="Items that have been claimed will appear here."
        offers={claimed}
      />

      {/* Archive */}
      {archive.length > 0 && (
        <Section
          title="Archive"
          accent="bg-outline-variant"
          count={archive.length}
          emptyIcon="history"
          emptyTitle=""
          emptyBody=""
          offers={archive}
          muted
        />
      )}
    </div>
  );
}

function Section({
  title,
  accent,
  count,
  offers,
  emptyIcon,
  emptyTitle,
  emptyBody,
  muted = false,
}: {
  title: string;
  accent: string;
  count: number;
  offers: MyOffer[];
  emptyIcon: string;
  emptyTitle: string;
  emptyBody: string;
  muted?: boolean;
}) {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <div className={`h-8 w-2 rounded-full ${accent}`} />
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        <span className="ml-auto rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
          {count} {count === 1 ? "ITEM" : "ITEMS"}
        </span>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-8 text-center">
          <span className="material-symbols-outlined text-3xl text-outline">
            {emptyIcon}
          </span>
          <p className="mt-2 font-semibold text-on-surface">{emptyTitle}</p>
          <p className="text-sm text-on-surface-variant">{emptyBody}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((o) => (
            <OfferCard key={o.id} offer={o} muted={muted} />
          ))}
        </div>
      )}
    </section>
  );
}

function OfferCard({ offer, muted }: { offer: MyOffer; muted: boolean }) {
  const badge = conditionBadge(offer.condition);
  const statusColor = offerStatusColor(offer.status);
  const days = daysUntil(offer.scrapDate);
  const urgent = offer.status === "AVAILABLE" && days <= 1;

  return (
    <Link
      href={`/offers/${offer.id}`}
      className={`group flex flex-col gap-4 rounded-xl p-5 shadow-sm transition-all hover:shadow-md ${
        muted
          ? "bg-surface-container-low opacity-80 hover:opacity-100"
          : "bg-surface-container-lowest"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
          <span className="material-symbols-outlined">
            {iconFor(offer.itemName)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-on-surface">{offer.itemName}</p>
          <p className="text-xs text-on-surface-variant">
            qty {offer.quantity} · {badge.label}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-xs font-black uppercase tracking-tight text-white ${statusColor}`}
        >
          {offer.status.toLowerCase()}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <Detail icon="location_on" value={offer.location} />
        <Detail
          icon="schedule"
          value={days > 0 ? `${days}d to scrap` : "expired"}
          accent={urgent ? "text-error" : undefined}
        />
        {offer.estimatedValue > 0 && (
          <Detail
            icon="payments"
            value={`₪${offer.estimatedValue.toLocaleString()}`}
          />
        )}
        <Detail
          icon="event"
          value={`Posted ${formatRelative(offer.createdAt)}`}
        />
      </dl>

      {offer.claim && (
        <div className="rounded-lg bg-primary-fixed/60 px-3 py-2 text-xs">
          <span className="font-bold text-primary">Claimed by:</span>{" "}
          <span className="text-on-surface">
            {offer.claim.claimingUser.name}
          </span>
          <span className="text-on-surface-variant">
            {" "}
            · {offer.claim.claimingUser.department}
          </span>
        </div>
      )}
    </Link>
  );
}

function Detail({
  icon,
  value,
  accent,
}: {
  icon: string;
  value: string;
  accent?: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 ${accent ?? "text-on-surface-variant"}`}
    >
      <span className="material-symbols-outlined text-sm">{icon}</span>
      <span className={`truncate ${accent ? "font-bold" : ""}`}>{value}</span>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_10px_30px_-5px_rgba(25,27,35,0.04)]">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-black tracking-tighter ${accent}`}>
          {value}
        </span>
        <span className="text-sm text-on-surface-variant">{sub}</span>
      </div>
    </div>
  );
}

function EmptyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">
          My Offers
        </h2>
        <p className="mt-1 text-on-surface-variant">
          Items you&apos;ve listed — track their status here.
        </p>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-primary-fixed to-surface-container-lowest p-12 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
          <span className="material-symbols-outlined text-3xl">
            inventory_2
          </span>
        </div>
        <h3 className="mt-4 text-xl font-bold text-on-surface">
          You haven&apos;t posted any offers yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
          Share surplus assets with other departments. Anything still usable —
          furniture, tools, electronics, pallets — someone probably needs it.
        </p>
        <Link
          href="/offers/new"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02]"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Post your first item
        </Link>
      </div>
    </div>
  );
}
