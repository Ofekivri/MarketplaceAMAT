import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  claimOfferAction,
  completeClaimAction,
} from "@/lib/actions";
import { formatCondition, formatDate, daysUntil, formatRelative } from "@/lib/format";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      offeringUser: true,
      claim: { include: { claimingUser: true } },
    },
  });
  if (!offer) notFound();

  const isOwn = offer.offeringUserId === user.id;
  const isClaimer = offer.claim?.claimingUserId === user.id;
  const days = daysUntil(offer.scrapDate);

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← Back to dashboard
      </Link>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{offer.itemName}</h1>
            <p className="mt-1 text-sm text-gray-500">
              From <strong>{offer.offeringUser.department}</strong> ·{" "}
              {offer.offeringUser.name} · posted{" "}
              {formatRelative(offer.createdAt)}
            </p>
          </div>
          <StatusBadge status={offer.status} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Detail term="Quantity" value={String(offer.quantity)} />
          <Detail term="Condition" value={formatCondition(offer.condition)} />
          <Detail term="Location" value={offer.location} />
          <Detail
            term="Scrap deadline"
            value={`${formatDate(offer.scrapDate)} (${days > 0 ? `${days}d left` : "expired"})`}
          />
          {offer.estimatedValue > 0 && (
            <Detail
              term="Est. value"
              value={`₪${offer.estimatedValue.toLocaleString()}`}
            />
          )}
        </dl>

        {offer.description && (
          <div className="mt-4 rounded bg-gray-50 p-3 text-sm">
            {offer.description}
          </div>
        )}
      </div>

      {offer.status === "AVAILABLE" && !isOwn && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Claim this item</h2>
          <p className="mt-1 text-sm text-gray-500">
            Both you and {offer.offeringUser.department} will be notified.
          </p>
          <form action={claimOfferAction} className="mt-3 space-y-3">
            <input type="hidden" name="offerId" value={offer.id} />
            <textarea
              name="notes"
              placeholder="Optional pickup notes..."
              rows={2}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
            >
              ✅ Claim this
            </button>
          </form>
        </div>
      )}

      {offer.status === "AVAILABLE" && isOwn && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This is your offer. Waiting for someone to claim it.
        </div>
      )}

      {offer.claim && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Claim</h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Detail
              term="Claimed by"
              value={`${offer.claim.claimingUser.name} (${offer.claim.claimingUser.department})`}
            />
            <Detail term="Contact" value={offer.claim.claimingUser.email} />
            <Detail term="Status" value={offer.claim.status} />
            <Detail
              term="Claimed at"
              value={formatRelative(offer.claim.createdAt)}
            />
            {offer.claim.notes && (
              <Detail term="Notes" value={offer.claim.notes} />
            )}
          </dl>

          {offer.status === "CLAIMED" && (isOwn || isClaimer) && (
            <form action={completeClaimAction} className="mt-4">
              <input type="hidden" name="offerId" value={offer.id} />
              <button
                type="submit"
                className="rounded bg-amat-blue px-4 py-2 font-medium text-white hover:bg-amat-blue/90"
              >
                ✓ Mark picked up
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-400">{term}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-800",
    CLAIMED: "bg-amber-100 text-amber-800",
    COMPLETED: "bg-blue-100 text-blue-800",
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
