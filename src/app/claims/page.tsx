import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  cancelClaimAction,
  completeClaimAction,
} from "@/lib/actions";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "My Claims | SecondLife" };

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

function refNumber(id: string) {
  return `#CLM-${id.slice(-6).toUpperCase()}`;
}

export default async function ClaimsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const claims = await prisma.claim.findMany({
    where: { claimingUserId: user.id },
    include: { offer: { include: { offeringUser: true } } },
    orderBy: { createdAt: "desc" },
  });

  const toCollect = claims.filter((c) =>
    ["PENDING", "PICKUP_SCHEDULED"].includes(c.status),
  );
  const scheduled = claims.filter((c) => c.status === "PICKUP_SCHEDULED");
  const collected = claims.filter((c) => c.status === "COMPLETED");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">
            My Claims
          </h2>
          <p className="mt-1 text-on-surface-variant">
            Track and manage your requested industrial assets.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-surface-container px-4 py-2 text-sm font-medium text-on-surface-variant">
            <span className="material-symbols-outlined text-base">
              filter_list
            </span>
            Sort by Date
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <StatTile
          label="Awaiting Pickup"
          value={String(toCollect.length).padStart(2, "0")}
          sub="Active Requests"
          accent="text-primary"
        />
        <StatTile
          label="Scheduled"
          value={String(scheduled.length).padStart(2, "0")}
          sub="Logistics confirmed"
          accent="text-tertiary"
        />
      </div>

      {/* To Collect */}
      <section>
        <SectionHeader
          accent="bg-primary"
          title="To Collect"
          right={
            <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed">
              {toCollect.length} {toCollect.length === 1 ? "ITEM" : "ITEMS"}
            </span>
          }
        />

        {toCollect.length === 0 ? (
          <EmptyState
            icon="check_circle"
            title="Nothing to collect"
            body="Browse the Marketplace to claim available assets."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {toCollect.map((c) => (
              <ToCollectCard key={c.id} claim={c} />
            ))}
          </div>
        )}
      </section>

      {/* Collected */}
      <section>
        <SectionHeader
          accent="bg-outline-variant"
          title="Collected"
          right={
            <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
              HISTORY
            </span>
          }
        />

        {collected.length === 0 ? (
          <EmptyState
            icon="history"
            title="No completed claims yet"
            body="Items you've picked up will be archived here."
          />
        ) : (
          <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0_10px_30px_-5px_rgba(25,27,35,0.04)]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Asset Name
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Origin Dept
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Received Date
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {collected.map((c) => (
                  <tr
                    key={c.id}
                    className="transition-colors hover:bg-surface-container-low"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/offers/${c.offerId}`}
                        className="flex items-center gap-3"
                      >
                        <span className="material-symbols-outlined text-tertiary">
                          check_circle
                        </span>
                        <span className="font-semibold text-on-surface">
                          {c.offer.itemName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {c.offer.offeringUser.department}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {formatDate(c.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="rounded bg-primary-fixed px-2 py-1 font-mono text-xs font-bold text-primary">
                        {refNumber(c.id)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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

function SectionHeader({
  accent,
  title,
  right,
}: {
  accent: string;
  title: string;
  right: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className={`h-8 w-2 rounded-full ${accent}`} />
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <div className="ml-auto">{right}</div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-10 text-center">
      <span className="material-symbols-outlined text-3xl text-outline">
        {icon}
      </span>
      <p className="mt-2 font-semibold text-on-surface">{title}</p>
      <p className="text-sm text-on-surface-variant">{body}</p>
    </div>
  );
}

type ClaimRow = {
  id: string;
  offerId: string;
  status: string;
  createdAt: Date;
  offer: {
    itemName: string;
    location: string;
    offeringUser: { name: string; department: string };
  };
};

function ToCollectCard({ claim }: { claim: ClaimRow }) {
  const isNew =
    Date.now() - new Date(claim.createdAt).getTime() < 24 * 60 * 60 * 1000;

  return (
    <div className="group flex items-center gap-5 rounded-xl bg-surface-container-lowest p-5 transition-all hover:translate-y-[-2px] hover:shadow-xl hover:shadow-blue-500/5">
      <Link
        href={`/offers/${claim.offerId}`}
        className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-surface-container-high to-surface-container text-primary/50"
      >
        <span className="material-symbols-outlined text-[48px]">
          {iconFor(claim.offer.itemName)}
        </span>
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/offers/${claim.offerId}`}>
              <h4 className="truncate font-bold text-on-surface hover:text-primary">
                {claim.offer.itemName}
              </h4>
            </Link>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-60">
              {claim.offer.offeringUser.department}
            </p>
          </div>
          {isNew && (
            <span className="whitespace-nowrap rounded bg-primary-container px-2 py-0.5 text-[10px] font-black uppercase text-white">
              NEW CLAIM
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">
              location_on
            </span>
            <span>{claim.offer.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">person</span>
            <span>{claim.offer.offeringUser.name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">tag</span>
            <span className="font-mono">{refNumber(claim.id)}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <form action={completeClaimAction}>
          <input type="hidden" name="offerId" value={claim.offerId} />
          <button
            type="submit"
            className="rounded-lg bg-primary-container px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-110"
          >
            Mark Received
          </button>
        </form>
        <form action={cancelClaimAction}>
          <input type="hidden" name="offerId" value={claim.offerId} />
          <button
            type="submit"
            className="rounded-lg bg-surface-container px-4 py-2 text-xs font-bold text-on-surface-variant transition-all hover:bg-error-container hover:text-error"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
