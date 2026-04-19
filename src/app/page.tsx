import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatCondition, daysUntil, formatRelative } from "@/lib/format";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Asset Alert System</h1>
        <p className="mt-2 text-gray-500">
          Stop scrapping things other departments need.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded bg-amat-blue px-4 py-2 font-medium text-white hover:bg-amat-blue/90"
        >
          Log in to continue
        </Link>
      </div>
    );
  }

  const [liveOffers, yourOffers, yourClaims] = await Promise.all([
    prisma.offer.findMany({
      where: {
        status: "AVAILABLE",
        offeringUserId: { not: user.id },
      },
      include: { offeringUser: true },
      orderBy: { scrapDate: "asc" },
    }),
    prisma.offer.findMany({
      where: { offeringUserId: user.id },
      include: { claim: { include: { claimingUser: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.claim.findMany({
      where: { claimingUserId: user.id },
      include: { offer: { include: { offeringUser: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <Section
        title={`Live offers (${liveOffers.length})`}
        accent="green"
        empty="Nothing available right now. Check back later."
      >
        {liveOffers.map((o) => {
          const days = daysUntil(o.scrapDate);
          const urgent = days <= 1;
          return (
            <Card key={o.id} href={`/offers/${o.id}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{o.itemName}</p>
                  <p className="text-sm text-gray-500">
                    From <strong>{o.offeringUser.department}</strong> ·{" "}
                    {o.location}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatCondition(o.condition)} · qty {o.quantity} · posted{" "}
                    {formatRelative(o.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${urgent ? "text-red-600" : "text-gray-700"}`}
                  >
                    ⏰ {days > 0 ? `${days}d left` : "expired"}
                  </p>
                  <span className="mt-2 inline-block rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                    Claim →
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </Section>

      <Section
        title={`Your offers (${yourOffers.length})`}
        accent="blue"
        empty="You haven't posted anything yet."
        action={
          <Link
            href="/offers/new"
            className="text-sm font-medium text-amat-blue hover:underline"
          >
            + Post item
          </Link>
        }
      >
        {yourOffers.map((o) => (
          <Card key={o.id} href={`/offers/${o.id}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{o.itemName}</p>
                <p className="text-sm text-gray-500">
                  {o.location} · qty {o.quantity}
                </p>
                {o.claim && (
                  <p className="mt-1 text-xs text-gray-400">
                    Claimed by {o.claim.claimingUser.department}
                  </p>
                )}
              </div>
              <StatusPill status={o.status} />
            </div>
          </Card>
        ))}
      </Section>

      <Section
        title={`Your claims (${yourClaims.length})`}
        accent="amber"
        empty="You haven't claimed anything yet."
      >
        {yourClaims.map((c) => (
          <Card key={c.id} href={`/offers/${c.offerId}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{c.offer.itemName}</p>
                <p className="text-sm text-gray-500">
                  From <strong>{c.offer.offeringUser.department}</strong> ·{" "}
                  {c.offer.location}
                </p>
              </div>
              <StatusPill status={c.status} />
            </div>
          </Card>
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  accent,
  empty,
  action,
  children,
}: {
  title: string;
  accent: "green" | "blue" | "amber";
  empty: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const dot = {
    green: "bg-green-500",
    blue: "bg-amat-blue",
    amber: "bg-amber-500",
  }[accent];
  const childArray = Array.isArray(children) ? children : [children];
  const filled = childArray.filter(Boolean).length > 0;
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
          {title}
        </h2>
        {action}
      </div>
      {filled ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-400">
          {empty}
        </div>
      )}
    </section>
  );
}

function Card({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-amat-accent hover:shadow"
    >
      {children}
    </Link>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-800",
    CLAIMED: "bg-amber-100 text-amber-800",
    PENDING: "bg-amber-100 text-amber-800",
    PICKUP_SCHEDULED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-gray-200 text-gray-700",
    SCRAPPED: "bg-gray-200 text-gray-700",
  };
  return (
    <span
      className={`rounded px-2 py-1 text-xs font-semibold ${map[status] ?? "bg-gray-100"}`}
    >
      {status}
    </span>
  );
}
