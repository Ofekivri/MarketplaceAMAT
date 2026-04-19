import { getCurrentUser } from "@/lib/session";
import { createOfferAction } from "@/lib/actions";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NewOfferPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Post item for scrap</h1>
      <p className="mt-1 text-sm text-gray-500">
        Posting as <strong>{user.name}</strong> · {user.department}
      </p>

      <form action={createOfferAction} className="mt-4 space-y-4">
        <Field label="Item name" hint="e.g., Office Chairs, Motors, Wood">
          <input
            name="itemName"
            required
            className="input"
            placeholder="3x Office Chairs"
          />
        </Field>

        <Field label="Description">
          <textarea
            name="description"
            rows={3}
            className="input"
            placeholder="More details here..."
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity">
            <input
              name="quantity"
              type="number"
              min={1}
              defaultValue={1}
              required
              className="input"
            />
          </Field>
          <Field label="Condition">
            <select name="condition" defaultValue="GOOD" className="input">
              <option value="LIKE_NEW">Like New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
            </select>
          </Field>
        </div>

        <Field label="Location">
          <input
            name="location"
            required
            className="input"
            placeholder="Building 2, 3rd Floor"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="When are you scrapping?">
            <select
              name="daysUntilScrap"
              defaultValue={5}
              className="input"
            >
              <option value={1}>1 day</option>
              <option value={2}>2 days</option>
              <option value={3}>3 days</option>
              <option value={5}>5 days</option>
              <option value={7}>1 week</option>
              <option value={14}>2 weeks</option>
            </select>
          </Field>
          <Field label="Estimated value (NIS)" hint="optional, for analytics">
            <input
              name="estimatedValue"
              type="number"
              min={0}
              defaultValue={0}
              className="input"
            />
          </Field>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded bg-amat-blue px-4 py-2 font-medium text-white hover:bg-amat-blue/90"
          >
            Post item
          </button>
        </div>
        <p className="pt-2 text-xs text-gray-400">
          This will notify all departments via the in-app inbox.
        </p>
      </form>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 14px;
        }
        .input:focus {
          outline: 2px solid #00a6e3;
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
