import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "My Offers | Asset Alert" };

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

export default async function MyOffersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const myOffers = await prisma.offer.findMany({
    where: { offeringUserId: user.id },
    include: { claim: { include: { claimingUser: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">
            My Offers
          </h2>
          <p className="mt-1 text-on-surface-variant">
            Items you&apos;ve listed — track their status here.
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

      {myOffers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-10 text-center">
          <span className="material-symbols-outlined text-3xl text-outline">
            inventory
          </span>
          <p className="mt-2 font-semibold text-on-surface">
            You haven&apos;t posted any offers yet
          </p>
          <p className="text-sm text-on-surface-variant">
            List an item to share surplus with other departments.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myOffers.map((o) => {
            const badge = conditionBadge(o.condition);
            const statusColor =
              o.status === "AVAILABLE"
                ? "bg-tertiary"
                : o.status === "CLAIMED"
                  ? "bg-primary"
                  : o.status === "COMPLETED"
                    ? "bg-outline"
                    : "bg-error";
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
                    {o.claim
                      ? `Claimed by ${o.claim.claimingUser.name}`
                      : "No claims yet"}
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
      )}
    </div>
  );
}
