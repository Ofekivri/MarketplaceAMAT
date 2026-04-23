import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  claimOfferAction,
  completeClaimAction,
} from "@/lib/actions";
import { getCategory } from "@/lib/categories";
import { formatCondition, formatDate, daysUntil, formatRelative } from "@/lib/format";
import { PostedCelebration } from "@/components/PostedCelebration";
import { ClaimSuccessToast } from "@/components/ClaimSuccessToast";
import { CompletedCelebration } from "@/components/CompletedCelebration";
import { CompleteClaimButton } from "@/components/CompleteClaimButton";
import { OfferImages } from "./OfferImages";
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
      claim: { include: { claimingUser: true } },
    },
  });
  if (!offer) notFound();

  const isOwn = offer.offeringUserId === user.id;
  const isClaimer = offer.claim?.claimingUserId === user.id;
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
              ₪{offer.estimatedValue.toLocaleString()} saved from the scrap
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

            {offer.estimatedValue > 0 && (
              <p className="mt-3 text-3xl font-black text-gray-900">
                ₪{offer.estimatedValue.toLocaleString()}
              </p>
            )}

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
              />
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

            {offer.status === "AVAILABLE" && !isOwn && (
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
                  ✅ Claim this
                </button>
                <p className="text-xs text-gray-500">
                  Both you and {offer.offeringUser.department} will be
                  notified.
                </p>
              </form>
            )}

            {offer.status === "AVAILABLE" && isOwn && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                This is your offer. Waiting for someone to claim it.
              </div>
            )}
          </div>
        </div>
      </div>

      {offer.claim && (
        <>
          {/* Status stepper */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
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
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
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
              <CompleteClaimButton isClaimer={isClaimer} />
              <p className="mt-2 text-center text-xs text-gray-500">
                {isClaimer
                  ? "Marks the item as successfully picked up and redeployed."
                  : "Confirm the claimer has picked up this item."}
              </p>
            </form>
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

function InfoRow({
  icon,
  label,
  value,
  urgent,
}: {
  icon: string;
  label: string;
  value: string;
  urgent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2 text-sm">
      <span className="material-symbols-outlined text-base text-gray-400">
        {icon}
      </span>
      <dt className="w-28 shrink-0 text-xs uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      <dd
        className={`min-w-0 flex-1 truncate font-medium ${
          urgent ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value}
      </dd>
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
