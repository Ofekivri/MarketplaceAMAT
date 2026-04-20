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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{offer.itemName}</h1>
            <p className="mt-1 text-sm text-gray-500">
              From <strong>{offer.offeringUser.department}</strong> ·{" "}
              {offer.offeringUser.name} · posted{" "}
              {formatRelative(offer.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isOwn && offer.status !== "SCRAPPED" && offer.status !== "COMPLETED" && (
              <Link
                href={`/offers/${offer.id}/edit`}
                className="flex items-center gap-1.5 rounded bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit
              </Link>
            )}
            <StatusBadge status={offer.status} />
          </div>
        </div>

        {offer.images.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={offer.images[0]}
                alt={offer.itemName}
                className="h-full w-full object-cover"
              />
            </div>
            {offer.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {offer.images.slice(1).map((src, i) => (
                  <div
                    key={i}
                    className="aspect-square overflow-hidden rounded bg-gray-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${offer.itemName} ${i + 2}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
        <>
          {/* Status stepper */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Step
                done
                icon="check_circle"
                label="Claimed"
                sub={`by ${offer.claim.claimingUser.name}`}
              />
              <div
                className={`h-0.5 flex-1 ${
                  offer.status === "COMPLETED" ? "bg-green-500" : "bg-amber-300"
                }`}
              />
              <Step
                done={offer.status === "COMPLETED"}
                active={offer.status !== "COMPLETED"}
                icon={
                  offer.status === "COMPLETED" ? "check_circle" : "pending"
                }
                label={
                  offer.status === "COMPLETED" ? "Received" : "Awaiting Receipt"
                }
                sub={
                  offer.status === "COMPLETED"
                    ? "Saved from scrap"
                    : isClaimer
                      ? "Tap when you pick it up"
                      : "Waiting on claimer"
                }
              />
            </div>
          </div>

          {/* Claim details */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Claim</h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Detail
                term="Claimed by"
                value={`${offer.claim.claimingUser.name} (${offer.claim.claimingUser.department})`}
              />
              <Detail term="Contact" value={offer.claim.claimingUser.email} />
              <Detail
                term="Claimed at"
                value={formatRelative(offer.claim.createdAt)}
              />
              {offer.claim.notes && (
                <Detail term="Notes" value={offer.claim.notes} />
              )}
            </dl>
          </div>

          {/* Big CTA */}
          {offer.status === "CLAIMED" && (isOwn || isClaimer) && (
            <form action={completeClaimAction}>
              <input type="hidden" name="offerId" value={offer.id} />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-green-600 px-8 py-5 text-lg font-bold text-white shadow-lg shadow-green-500/30 transition-all hover:bg-green-700 hover:shadow-green-500/40 active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-2xl">
                  check_circle
                </span>
                {isClaimer ? "I Received This Item" : "Confirm Handover"}
              </button>
              <p className="mt-2 text-center text-xs text-gray-500">
                {isClaimer
                  ? "Marks the item as successfully picked up and redeployed."
                  : "Confirm the claimer has picked up this item."}
              </p>
            </form>
          )}

          {offer.status === "COMPLETED" && (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
              <span className="material-symbols-outlined text-2xl">
                verified
              </span>
              <div>
                <p className="font-bold">Received — item saved from scrap.</p>
                <p className="text-xs">Thanks for redeploying this asset.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Step({
  done,
  active,
  icon,
  label,
  sub,
}: {
  done?: boolean;
  active?: boolean;
  icon: string;
  label: string;
  sub: string;
}) {
  const circleColor = done
    ? "bg-green-500 text-white"
    : active
      ? "bg-amber-400 text-white animate-pulse"
      : "bg-gray-200 text-gray-400";
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <div
        className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${circleColor}`}
      >
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <p className="text-sm font-bold">{label}</p>
      <p className="text-[10px] text-gray-500">{sub}</p>
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
