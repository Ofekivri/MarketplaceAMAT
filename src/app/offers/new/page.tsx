import { getCurrentUser } from "@/lib/session";
import { createOfferAction } from "@/lib/actions";
import { CategoryFields } from "@/components/CategoryFields";
import { SubmitButton } from "@/components/SubmitButton";
import { redirect } from "next/navigation";

export const metadata = { title: "Post New Item | SecondLife" };

export default async function NewOfferPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <form action={createOfferAction}>
      <div className="mb-12">
        <h2 className="mb-2 text-4xl font-extrabold tracking-tight text-on-surface">
          Curate New Asset
        </h2>
        <p className="text-lg text-on-surface-variant">
          Detailed entry for high-value enterprise surplus and industrial
          inventory. Posting as <strong>{user.name}</strong> ·{" "}
          {user.department}.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* LEFT: Visuals & Description */}
        <div className="space-y-8 lg:col-span-7">
          <Card>
            <CardHeader
              icon="add_a_photo"
              title="Asset Visuals"
              right={
                <span className="rounded bg-surface-container px-2 py-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Coming next
                </span>
              }
            />
            <div className="group relative flex cursor-not-allowed flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-12 opacity-70">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed">
                <span className="material-symbols-outlined text-3xl text-primary">
                  upload_file
                </span>
              </div>
              <p className="mb-1 font-semibold text-on-surface">
                Photo upload arrives in the next iteration
              </p>
              <p className="text-sm text-on-surface-variant">
                For now, describe the asset visually in the description below.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-outline-variant bg-surface-container"
                >
                  <span className="material-symbols-outlined text-outline">
                    add
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader icon="description" title="Details & Specifications" />
            <div className="space-y-6">
              <CategoryFields />
              <Field label="Item Name" htmlFor="itemName">
                <input
                  id="itemName"
                  name="itemName"
                  required
                  className="input"
                  placeholder="e.g. 3x Office Chairs (Like New)"
                />
              </Field>
              <Field label="Detailed Description" htmlFor="description">
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  className="input"
                  placeholder="Describe the current condition, specific components included, and original usage period..."
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* RIGHT: Classification, Location, Submit */}
        <div className="space-y-8 lg:col-span-5">
          <Card>
            <CardHeader icon="inventory_2" title="Classification" />
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Quantity" htmlFor="quantity">
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min={1}
                    defaultValue={1}
                    required
                    className="input"
                  />
                </Field>
                <Field label="Condition" htmlFor="condition">
                  <select
                    id="condition"
                    name="condition"
                    defaultValue="GOOD"
                    className="input"
                  >
                    <option value="LIKE_NEW">Like New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </select>
                </Field>
              </div>

              <Field label="Scrap Deadline" htmlFor="daysUntilScrap">
                <div className="relative">
                  <select
                    id="daysUntilScrap"
                    name="daysUntilScrap"
                    defaultValue={5}
                    className="input appearance-none pr-10"
                  >
                    <option value={2}>Immediate (within 48 hours)</option>
                    <option value={5}>End of week (5 days)</option>
                    <option value={14}>End of month (~2 weeks)</option>
                    <option value={30}>Flexible (1 month)</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 top-3.5 text-on-surface-variant">
                    calendar_month
                  </span>
                </div>
                <p className="mt-2 text-xs italic text-on-surface-variant">
                  Asset will be archived if not claimed by this date.
                </p>
              </Field>

              <Field
                label="Estimated value (NIS)"
                htmlFor="estimatedValue"
                hint="Optional, drives the analytics dashboard."
              >
                <input
                  id="estimatedValue"
                  name="estimatedValue"
                  type="number"
                  min={0}
                  defaultValue={0}
                  className="input"
                />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader icon="location_on" title="Facility Location" />
            <div className="space-y-4">
              <Field label="Location description" htmlFor="location">
                <input
                  id="location"
                  name="location"
                  required
                  className="input"
                  placeholder="e.g. Building 2, 3rd Floor"
                />
              </Field>
              <div className="relative h-48 overflow-hidden rounded-lg bg-gradient-to-br from-surface-container-high via-surface-container to-primary-fixed/40">
                <div className="absolute inset-0 bg-primary/10" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary opacity-25" />
                    <span
                      className="material-symbols-outlined text-4xl text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      location_on
                    </span>
                  </div>
                </div>
                <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Map preview · coming next
                </p>
              </div>
            </div>
          </Card>

          <div className="overflow-hidden rounded-xl bg-primary-container p-1 text-on-primary-container shadow-xl shadow-primary/20">
            <div className="bg-primary p-8 text-center">
              <p className="mb-4 text-sm font-bold uppercase tracking-widest text-white opacity-80">
                Final Review
              </p>
              <SubmitButton
                icon="publish"
                label="Publish Asset Listing"
                pendingLabel="Publishing…"
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-surface-container-lowest px-8 py-4 text-lg font-bold text-primary shadow-lg transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100"
              />
              <p className="mt-4 text-xs text-white/70">
                This will notify all departments via the in-app inbox.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex items-center gap-4 rounded-lg border-l-4 border-tertiary bg-tertiary/10 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary text-white">
          <span className="material-symbols-outlined">verified</span>
        </div>
        <div>
          <h4 className="font-bold text-tertiary">Real-time validation active</h4>
          <p className="text-sm text-on-surface-variant">
            Listings with a clear name, location, and realistic deadline get
            claimed faster — aim for under 5 days when possible.
          </p>
        </div>
      </div>

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
        select.input {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23434655'%3e%3cpath d='M7 10l5 5 5-5H7z'/%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 40px;
        }
        select.input.appearance-none {
          background-image: none;
        }
      `}</style>
    </form>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-8 shadow-[0_10px_30px_-5px_rgba(25,27,35,0.04)]">
      {children}
    </div>
  );
}

function CardHeader({
  icon,
  title,
  right,
}: {
  icon: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-xl font-bold">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        {title}
      </h3>
      {right}
    </div>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-bold uppercase tracking-widest text-on-surface-variant"
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-2 text-xs text-on-surface-variant">{hint}</p>
      )}
    </div>
  );
}
