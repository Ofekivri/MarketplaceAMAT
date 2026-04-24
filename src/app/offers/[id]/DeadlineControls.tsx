"use client";

import { useState } from "react";
import { extendOfferDeadlineAction } from "@/lib/actions";

type Props = {
  offerId: string;
};

export function DeadlineControls({ offerId }: Props) {
  const [pickingDate, setPickingDate] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {[3, 7, 14].map((days) => (
        <form key={days} action={extendOfferDeadlineAction}>
          <input type="hidden" name="offerId" value={offerId} />
          <input type="hidden" name="days" value={days} />
          <button
            type="submit"
            className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700 transition-colors hover:bg-gray-200"
          >
            +{days}d
          </button>
        </form>
      ))}

      {!pickingDate ? (
        <button
          type="button"
          onClick={() => setPickingDate(true)}
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700 transition-colors hover:bg-gray-200"
        >
          <span className="material-symbols-outlined text-[13px]">
            event
          </span>
          Pick date
        </button>
      ) : (
        <form
          action={extendOfferDeadlineAction}
          className="flex flex-wrap items-center gap-1.5"
        >
          <input type="hidden" name="offerId" value={offerId} />
          <input
            type="date"
            name="date"
            min={today}
            required
            className="rounded border border-gray-300 px-2 py-0.5 text-[11px]"
          />
          <button
            type="submit"
            className="rounded-full bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-gray-800"
          >
            Set
          </button>
          <button
            type="button"
            onClick={() => setPickingDate(false)}
            className="text-[11px] text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
