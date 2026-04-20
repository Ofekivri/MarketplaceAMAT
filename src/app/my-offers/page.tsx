import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatCondition, formatDate, daysUntil } from "@/lib/format";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "My Offers | SecondLife" };

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

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  CLAIMED: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  SCRAPPED: "bg-gray-200 text-gray-700",
};

export default async function MyOffersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => {
            const days = daysUntil(o.scrapDate);
            const urgent = o.status === "AVAILABLE" && days <= 1;
            const editable =
              o.status !== "SCRAPPED" && o.status !== "COMPLETED";
            return (
              <div
                key={o.id}
                className="group flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-xl"
              >
                <Link
                  href={`/offers/${o.id}`}
                  className="relative block h-40 overflow-hidden bg-gradient-to-br from-surface-container-high to-surface-container"
                >
                  {o.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={o.images[0]}
                      alt={o.itemName}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-primary/40 transition-transform duration-500 group-hover:scale-105">
                      <span className="material-symbols-outlined text-[96px]">
                        {iconFor(o.itemName)}
                      </span>
                    </div>
                  )}
                  <span
                    className={`absolute left-3 top-3 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLE[o.status] ?? "bg-gray-100"}`}
                  >
                    {o.status}
                  </span>
                </Link>

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <Link
                      href={`/offers/${o.id}`}
                      className="text-lg font-bold text-on-surface hover:underline"
                    >
                      {o.itemName}
                    </Link>
                    <span className="whitespace-nowrap font-black text-primary">
                      {o.estimatedValue > 0
                        ? `₪${o.estimatedValue.toLocaleString()}`
                        : "—"}
                    </span>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-y-2">
                    <Meta
                      icon="location_on"
                      text={o.location}
                      wide
                    />
                    <Meta
                      icon="inventory_2"
                      text={`qty ${o.quantity} · ${formatCondition(o.condition)}`}
                      wide
                    />
                    <Meta
                      icon="schedule"
                      text={
                        o.status === "AVAILABLE"
                          ? days > 0
                            ? `Deadline: ${days}d left`
                            : `Deadline: expired ${formatDate(o.scrapDate)}`
                          : `Scrap by ${formatDate(o.scrapDate)}`
                      }
                      wide
                      highlight={urgent}
                    />
                    {o.claim && o.status === "CLAIMED" && (
                      <Meta
                        icon="assignment_ind"
                        text={`Claimed by ${o.claim.claimingUser.name}`}
                        wide
                      />
                    )}
                  </div>

                  <div className="mt-auto flex gap-2">
                    <Link
                      href={`/offers/${o.id}`}
                      className="flex-1 rounded-lg bg-surface-container py-2 text-center text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high"
                    >
                      View
                    </Link>
                    {editable && (
                      <Link
                        href={`/offers/${o.id}/edit`}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2 text-center text-sm font-bold text-white transition-colors hover:bg-primary/90"
                      >
                        <span className="material-symbols-outlined text-base">
                          edit
                        </span>
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
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

function Meta({
  icon,
  text,
  wide,
  highlight,
}: {
  icon: string;
  text: string;
  wide?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${wide ? "w-full" : "w-1/2"}`}>
      <span className="material-symbols-outlined text-xs text-outline">
        {icon}
      </span>
      <span
        className={`truncate text-xs font-medium ${highlight ? "text-error font-bold uppercase tracking-tighter" : "text-on-surface-variant"}`}
      >
        {text}
      </span>
    </div>
  );
}
