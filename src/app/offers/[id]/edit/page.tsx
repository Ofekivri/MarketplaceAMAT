import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  updateOfferAction,
  deleteOfferAction,
  markOfferScrappedAction,
  removeOfferImageAction,
  setPrimaryOfferImageAction,
  completeClaimAction,
} from "@/lib/actions";
import { formatRelative } from "@/lib/format";
import { CategoryFields } from "@/components/CategoryFields";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ImageUploader from "./ImageUploader";

export const metadata = { title: "Edit Offer | SecondLife" };

export default async function EditOfferPage({
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
  if (offer.offeringUserId !== user.id) redirect(`/offers/${id}`);

  const scrapDateInput = offer.scrapDate.toISOString().slice(0, 10);
  const readOnly = offer.status === "SCRAPPED" || offer.status === "COMPLETED";
  const claimActive =
    offer.claim &&
    offer.claim.status !== "CANCELLED" &&
    offer.claim.status !== "COMPLETED";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href={`/offers/${offer.id}`}
          className="text-sm text-on-surface-variant hover:underline"
        >
          ← Back to offer
        </Link>
        <StatusBadge status={offer.status} />
      </div>

      <div>
        <h2 className="mb-2 text-4xl font-extrabold tracking-tight text-on-surface">
          Manage Asset
        </h2>
        <p className="text-lg text-on-surface-variant">
          Edit details, photos, or retire this listing. Last updated{" "}
          {formatRelative(offer.updatedAt)}.
        </p>
      </div>

      {readOnly && (
        <div className="rounded-lg border-l-4 border-outline bg-surface-container p-4 text-sm text-on-surface-variant">
          This offer is <strong>{offer.status.toLowerCase()}</strong> and can no
          longer be edited.
        </div>
      )}

      {/* Must live outside the update <form>: its add/remove/primary buttons
          each render their own <form>, and HTML does not allow nested forms. */}
      <Card>
        <CardHeader icon="photo_library" title="Asset Visuals" />
        <ImageGallery
          offerId={offer.id}
          images={offer.images}
          disabled={readOnly}
        />
      </Card>

      <form action={updateOfferAction} id="edit-offer-form">
        <input type="hidden" name="offerId" value={offer.id} />

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* LEFT: Description */}
          <div className="space-y-8 lg:col-span-7">
            <Card>
              <CardHeader icon="description" title="Details & Specifications" />
              <div className="space-y-6">
                <CategoryFields
                  defaultCategory={offer.category}
                  defaultSubCategory={offer.subCategory}
                  disabled={readOnly}
                />
                <Field label="Item Name">
                  <input
                    name="itemName"
                    defaultValue={offer.itemName}
                    required
                    disabled={readOnly}
                    className="input"
                  />
                </Field>
                <Field label="Detailed Description">
                  <textarea
                    name="description"
                    rows={6}
                    defaultValue={offer.description}
                    disabled={readOnly}
                    className="input"
                  />
                </Field>
              </div>
            </Card>
          </div>

          {/* RIGHT: Classification, Location */}
          <div className="space-y-8 lg:col-span-5">
            <Card>
              <CardHeader icon="inventory_2" title="Classification" />
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Quantity">
                    <input
                      name="quantity"
                      type="number"
                      min={1}
                      defaultValue={offer.quantity}
                      required
                      disabled={readOnly}
                      className="input"
                    />
                  </Field>
                  <Field label="Condition">
                    <select
                      name="condition"
                      defaultValue={offer.condition}
                      disabled={readOnly}
                      className="input"
                    >
                      <option value="LIKE_NEW">Like New</option>
                      <option value="GOOD">Good</option>
                      <option value="FAIR">Fair</option>
                      <option value="POOR">Poor</option>
                    </select>
                  </Field>
                </div>

                <Field label="Scrap Deadline">
                  <input
                    name="scrapDate"
                    type="date"
                    defaultValue={scrapDateInput}
                    required
                    disabled={readOnly}
                    className="input"
                  />
                  <p className="mt-2 text-xs italic text-on-surface-variant">
                    Asset will be archived if not claimed by this date.
                  </p>
                </Field>

                <Field label="Estimated value (NIS)">
                  <input
                    name="estimatedValue"
                    type="number"
                    min={0}
                    defaultValue={offer.estimatedValue}
                    disabled={readOnly}
                    className="input"
                  />
                </Field>
              </div>
            </Card>

            <Card>
              <CardHeader icon="location_on" title="Facility Location" />
              <input
                name="location"
                defaultValue={offer.location}
                required
                disabled={readOnly}
                className="input"
              />
            </Card>

            {!readOnly && (
              <div className="overflow-hidden rounded-xl bg-primary-container p-1 text-on-primary-container shadow-xl shadow-primary/20">
                <div className="bg-primary p-8 text-center">
                  <p className="mb-4 text-sm font-bold uppercase tracking-widest text-white opacity-80">
                    Save Changes
                  </p>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-3 rounded-lg bg-surface-container-lowest px-8 py-4 text-lg font-bold text-primary shadow-lg transition-all hover:scale-105 active:scale-95"
                  >
                    <span className="material-symbols-outlined">save</span>
                    Update Listing
                  </button>
                  <p className="mt-4 text-xs text-white/70">
                    {claimActive
                      ? "The claimer will be notified about the update."
                      : "Changes apply immediately across the marketplace."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>

      {offer.claim && claimActive && (
        <Card>
          <CardHeader icon="assignment_ind" title="Current Claim" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Detail
              term="Claimed by"
              value={`${offer.claim.claimingUser.name} (${offer.claim.claimingUser.department})`}
            />
            <Detail term="Contact" value={offer.claim.claimingUser.email} />
            <Detail term="Status" value={offer.claim.status} />
            <Detail
              term="Claimed"
              value={formatRelative(offer.claim.createdAt)}
            />
            {offer.claim.notes && (
              <Detail term="Notes" value={offer.claim.notes} />
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={completeClaimAction}>
              <input type="hidden" name="offerId" value={offer.id} />
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-base">
                  task_alt
                </span>
                Mark picked up
              </button>
            </form>
          </div>
        </Card>
      )}

      {!readOnly && (
        <div className="rounded-xl border-2 border-error/30 bg-error/5 p-8">
          <h3 className="mb-2 flex items-center gap-2 text-xl font-bold text-error">
            <span className="material-symbols-outlined">warning</span>
            Danger Zone
          </h3>
          <p className="mb-6 text-sm text-on-surface-variant">
            These actions cannot be undone. The offer will be removed from the
            marketplace.
          </p>
          <div className="flex flex-wrap gap-3">
            <form action={markOfferScrappedAction}>
              <input type="hidden" name="offerId" value={offer.id} />
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg border border-outline bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-base">
                  delete_sweep
                </span>
                Mark as Scrapped
              </button>
            </form>
            <form action={deleteOfferAction}>
              <input type="hidden" name="offerId" value={offer.id} />
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-bold text-white hover:bg-error/90"
              >
                <span className="material-symbols-outlined text-base">
                  delete_forever
                </span>
                Delete Offer
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          padding: 12px 16px;
          background: #e1e2ed;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.15s ease;
        }
        .input:focus {
          outline: none;
          background: #ffffff;
          box-shadow: 0 0 0 2px #004ac6;
        }
        .input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        select.input {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23434655'%3e%3cpath d='M7 10l5 5 5-5H7z'/%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 40px;
        }
      `}</style>
    </div>
  );
}

function ImageGallery({
  offerId,
  images,
  disabled,
}: {
  offerId: string;
  images: string[];
  disabled: boolean;
}) {
  const primary = images[0];
  const rest = images.slice(1);
  const canAddMore = images.length < 6;

  return (
    <div className="space-y-4">
      {primary ? (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primary}
            alt="Primary"
            className="h-full w-full object-cover"
          />
          {!disabled && (
            <form
              action={removeOfferImageAction}
              className="absolute right-3 top-3"
            >
              <input type="hidden" name="offerId" value={offerId} />
              <input type="hidden" name="index" value={0} />
              <button
                type="submit"
                aria-label="Remove primary image"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <span className="material-symbols-outlined text-lg">
                  close
                </span>
              </button>
            </form>
          )}
          <div className="absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-xs font-bold uppercase tracking-widest text-white">
            Primary
          </div>
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-lowest">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-outline">
              image
            </span>
            <p className="mt-2 text-sm text-on-surface-variant">
              No images yet
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {rest.map((img, i) => {
          const index = i + 1;
          return (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-lg bg-surface-container"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`Image ${index + 1}`}
                className="h-full w-full object-cover"
              />
              {!disabled && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <form action={setPrimaryOfferImageAction}>
                    <input type="hidden" name="offerId" value={offerId} />
                    <input type="hidden" name="index" value={index} />
                    <button
                      type="submit"
                      aria-label="Set as primary"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary hover:bg-white/90"
                    >
                      <span className="material-symbols-outlined text-base">
                        star
                      </span>
                    </button>
                  </form>
                  <form action={removeOfferImageAction}>
                    <input type="hidden" name="offerId" value={offerId} />
                    <input type="hidden" name="index" value={index} />
                    <button
                      type="submit"
                      aria-label="Remove image"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-error hover:bg-white/90"
                    >
                      <span className="material-symbols-outlined text-base">
                        close
                      </span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}

        {!disabled && canAddMore && <ImageUploader offerId={offerId} />}
      </div>

      {!disabled && (
        <p className="text-xs text-on-surface-variant">
          Up to 6 images, max 4MB each. Hover a thumbnail to set it as primary
          or remove it.
        </p>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-8 shadow-[0_10px_30px_-5px_rgba(25,27,35,0.04)]">
      {children}
    </div>
  );
}

function CardHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-xl font-bold">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        {title}
      </h3>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </label>
      {children}
    </div>
  );
}

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-on-surface-variant">
        {term}
      </dt>
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
      className={`rounded px-3 py-1 text-xs font-bold uppercase tracking-widest ${map[status] ?? "bg-gray-100"}`}
    >
      {status}
    </span>
  );
}
