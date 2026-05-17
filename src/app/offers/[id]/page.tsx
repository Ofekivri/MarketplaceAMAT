import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  claimOfferAction,
  completeClaimAction,
  cancelClaimAction,
  undoCompleteClaimAction,
} from "@/lib/actions";
import { getCategory } from "@/lib/categories";
import { formatCondition, formatDate, daysUntil, formatRelative } from "@/lib/format";
import { PostedCelebration } from "@/components/PostedCelebration";
import { ClaimSuccessToast } from "@/components/ClaimSuccessToast";
import { CompletedCelebration } from "@/components/CompletedCelebration";
import { CompleteClaimButton } from "@/components/CompleteClaimButton";
import { OfferImages } from "./OfferImages";
import { ActivityTimeline } from "./ActivityTimeline";
import { DeadlineControls } from "./DeadlineControls";
import { OverdueBanner } from "./OverdueBanner";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function OfferDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ posted?: string; claimed?: string; completed?: string }>;
}) {
  const { id } = await params;
  const { posted, claimed, completed } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      offeringUser: true,
      claims: {
        where: { status: { not: "CANCELLED" } },
        include: { claimingUser: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!offer) notFound();

  const activeClaim = offer.claims[0] ?? null;
  const isOwn = offer.offeringUserId === user.id;
  const userClaim = offer.claims.find((c) => c.claimingUserId === user.id) ?? null;
  const isClaimer = !!userClaim;
  const queuePosition = isClaimer ? offer.claims.findIndex((c) => c.claimingUserId === user.id) : -1;
  const days = daysUntil(offer.scrapDate);
  const category = getCategory(offer.category);

  return (
    <div className="space-y-3">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← Back to dashboard
      </Link>

      {posted === "1" && isOwn && offer.status === "AVAILABLE" && (
        <PostedCelebration itemName={offer.itemName} />
      )}

      {claimed === "1" && isClaimer && (
        <ClaimSuccessToast
          itemName={offer.itemName}
          department={offer.offeringUser.department}
          location={offer.location}
        />
      )}

      {isOwn && offer.status === "AVAILABLE" && days <= 0 && (
        <OverdueBanner
          offerId={offer.id}
          scrapDate={offer.scrapDate}
          editHref={`/offers/${offer.id}/edit`}
        />
      )}

      {completed === "1" && offer.status === "COMPLETED" && (
        <CompletedCelebration
          itemName={offer.itemName}
          estimatedValue={offer.estimatedValue}
        />
      )}

      {offer.status === "COMPLETED" && (
        <div className="relative overflow-hidden rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-600 text-white shadow-lg ring-8 ring-green-100">
            <span className="material-symbols-outlined text-5xl">
              verified
            </span>
          </div>
          <h2 className="text-3xl font-black text-green-900">
            Saved from scrap!
          </h2>
          <p className="mt-2 text-base text-green-800">
            <span className="font-bold">{offer.itemName}</span> has been
            redeployed — another win for the circular factory.
          </p>
          {offer.estimatedValue > 0 && (
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-green-900 shadow-sm backdrop-blur">
              <span className="material-symbols-outlined text-base">
                savings
              </span>
              ${offer.estimatedValue.toLocaleString()} saved from the scrap
              bin
            </div>
          )}
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-full bg-green-700 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-green-800"
            >
              Browse more offers
              <span className="material-symbols-outlined text-base">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="md:grid md:grid-cols-[3fr_2fr] md:gap-6">
          <div>
            {offer.images.length > 0 ? (
              <OfferImages images={offer.images} alt={offer.itemName} />
            ) : (
              <div className="flex h-72 items-center justify-center rounded-lg bg-gray-100 text-gray-400 md:h-[460px] lg:h-[540px]">
                <span className="material-symbols-outlined text-6xl">
                  {category.icon}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col md:mt-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold leading-tight">
                  {offer.itemName}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Posted by <strong>{offer.offeringUser.name}</strong> ·{" "}
                  {offer.offeringUser.department} ·{" "}
                  {formatRelative(offer.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isOwn &&
                  offer.status !== "SCRAPPED" &&
                  offer.status !== "COMPLETED" && (
                    <Link
                      href={`/offers/${offer.id}/edit`}
                      className="flex items-center gap-1.5 rounded bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                    >
                      <span className="material-symbols-outlined text-sm">
                        edit
                      </span>
                      Edit
                    </Link>
                  )}
                <StatusBadge status={offer.status} />
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                <span className="material-symbols-outlined text-sm">
                  {category.icon}
                </span>
                {category.label}
              </span>
              {offer.subCategory && (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  {offer.subCategory}
                </span>
              )}
            </div>

            <dl className="mt-3 divide-y divide-gray-100 border-y border-gray-100">
              <InfoRow
                icon="inventory_2"
                label="Quantity"
                value={String(offer.quantity)}
              />
              <InfoRow
                icon="verified"
                label="Condition"
                value={formatCondition(offer.condition)}
              />
              <InfoRow
                icon="location_on"
                label="Location"
                value={offer.location}
              />
              <InfoRow
                icon="schedule"
                label="Scrap deadline"
                value={`${formatDate(offer.scrapDate)} (${days > 0 ? `${days}d left` : "expired"})`}
                urgent={days <= 1}
                extra={
                  isOwn &&
                  offer.status !== "SCRAPPED" &&
                  offer.status !== "COMPLETED" ? (
                    <DeadlineControls offerId={offer.id} />
                  ) : null
                }
              />
              {offer.estimatedValue > 0 && (
                <InfoRow
                  icon="savings"
                  label="Est. value"
                  value={`$${offer.estimatedValue.toLocaleString()}`}
                />
              )}
              <InfoRow
                icon="mail"
                label="Contact"
                value={offer.offeringUser.email}
              />
            </dl>

            {offer.description && (
              <div className="mt-3 rounded bg-gray-50 p-3 text-sm">
                {offer.description}
              </div>
            )}

            {(offer.status === "AVAILABLE" || offer.status === "CLAIMED") && !isOwn && !isClaimer && (
              <form action={claimOfferAction} className="mt-4 space-y-2">
                <input type="hidden" name="offerId" value={offer.id} />
                <textarea
                  name="notes"
                  placeholder="Optional pickup notes..."
                  rows={2}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="w-full rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
                >
                  {offer.status === "CLAIMED" ? "🙋 Join Queue" : "✅ Claim this"}
                </button>
                <p className="text-xs text-gray-500">
                  {offer.status === "CLAIMED"
                    ? `${offer.claims.length} ${offer.claims.length === 1 ? "person" : "people"} ahead of you. You and ${offer.offeringUser.department} will be notified.`
                    : `Both you and ${offer.offeringUser.department} will be notified.`}
                </p>
              </form>
            )}

            {isClaimer && offer.status === "CLAIMED" && !isOwn && (
              <div className="mt-4 space-y-2">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  <p className="font-semibold">
                    You are #{queuePosition + 1} in the queue
                    {queuePosition === 0 && " — you're next!"}
                  </p>
                  {userClaim?.notes && (
                    <p className="mt-1 text-xs italic">&ldquo;{userClaim.notes}&rdquo;</p>
                  )}
                </div>
                <form action={cancelClaimAction}>
                  <input type="hidden" name="offerId" value={offer.id} />
                  <button
                    type="submit"
                    className="text-xs text-gray-500 hover:text-error hover:underline"
                  >
                    Leave queue
                  </button>
                </form>
              </div>
            )}

            {isOwn && offer.status === "CLAIMED" && offer.claims.length > 0 && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-bold text-blue-900">
                  {offer.claims.length} {offer.claims.length === 1 ? "person" : "people"} in queue
                </p>
                <ol className="mt-2 space-y-1">
                  {offer.claims.map((c, i) => (
                    <li key={c.id} className="flex items-center gap-2 text-xs text-blue-800">
                      <span className="font-bold">#{i + 1}</span>
                      {c.claimingUser.name} · {c.claimingUser.department}
                      {i === 0 && (
                        <span className="rounded bg-blue-200 px-1.5 py-0.5 text-[10px] font-bold">NEXT</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {offer.status === "AVAILABLE" && isOwn && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                This is your offer. Waiting for someone to claim it.
              </div>
            )}
          </div>
        </div>
      </div>

      {(activeClaim || offer.status === "SCRAPPED") && (
        <ActivityTimeline
          postedAt={offer.createdAt}
          postedBy={{
            name: offer.offeringUser.name,
            department: offer.offeringUser.department,
          }}
          claim={
            activeClaim
              ? {
                  createdAt: activeClaim.createdAt,
                  completedAt: activeClaim.completedAt,
                  updatedAt: activeClaim.updatedAt,
                  status: activeClaim.status,
                  notes: activeClaim.notes,
                  claimingUser: {
                    name: activeClaim.claimingUser.name,
                    department: activeClaim.claimingUser.department,
                  },
                }
              : null
          }
          offerStatus={offer.status}
          scrappedAt={offer.scrappedAt}
          offerUpdatedAt={offer.updatedAt}
          estimatedValue={offer.estimatedValue}
        />
      )}

      {activeClaim && offer.status === "CLAIMED" && (isOwn || isClaimer) && (
        <form action={completeClaimAction}>
          <input type="hidden" name="offerId" value={offer.id} />
          <CompleteClaimButton isClaimer={isClaimer} />
          <p className="mt-2 text-center text-xs text-gray-500">
            {isClaimer
              ? "Marks the item as successfully picked up and redeployed."
              : "Confirm the claimer has picked up this item."}
          </p>
        </form>
      )}

      {offer.status === "COMPLETED" && userClaim?.status === "COMPLETED" && (() => {
        const completedAt = userClaim.completedAt ?? userClaim.updatedAt;
        const hoursSince = (Date.now() - completedAt.getTime()) / (1000 * 60 * 60);
        return hoursSince <= 24 ? (
          <form action={undoCompleteClaimAction} className="text-center">
            <input type="hidden" name="claimId" value={userClaim.id} />
            <button type="submit" className="text-xs text-gray-400 hover:text-error hover:underline">
              I didn&apos;t actually take this — undo (available for {Math.max(0, Math.floor(24 - hoursSince))}h)
            </button>
          </form>
        ) : null;
      })()}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  urgent,
  extra,
}: {
  icon: string;
  label: string;
  value: string;
  urgent?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2 text-sm">
      <span className="material-symbols-outlined pt-0.5 text-base text-gray-400">
        {icon}
      </span>
      <dt className="w-28 shrink-0 pt-0.5 text-xs uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      <dd className="min-w-0 flex-1">
        <span
          className={`block truncate font-medium ${
            urgent ? "text-red-600" : "text-gray-900"
          }`}
        >
          {value}
        </span>
        {extra}
      </dd>
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
