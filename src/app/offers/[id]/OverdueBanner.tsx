import Link from "next/link";
import {
  extendOfferDeadlineAction,
  markOfferScrappedAction,
} from "@/lib/actions";
import { formatRelative } from "@/lib/format";

type Props = {
  offerId: string;
  scrapDate: Date;
  editHref: string;
};

export function OverdueBanner({ offerId, scrapDate, editHref }: Props) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
          <span className="material-symbols-outlined">schedule</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-amber-900">
            Scrap deadline passed {formatRelative(scrapDate)}
          </h3>
          <p className="mt-1 text-sm text-amber-800">
            Still available, or has it been scrapped? Let others know so the
            listing stays accurate.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <form action={extendOfferDeadlineAction}>
              <input type="hidden" name="offerId" value={offerId} />
              <input type="hidden" name="days" value={5} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-sm ring-1 ring-amber-300 transition-colors hover:bg-amber-100"
              >
                <span className="material-symbols-outlined text-sm">
                  event_available
                </span>
                Still here — +5 days
              </button>
            </form>
            <form action={extendOfferDeadlineAction}>
              <input type="hidden" name="offerId" value={offerId} />
              <input type="hidden" name="days" value={14} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-sm ring-1 ring-amber-300 transition-colors hover:bg-amber-100"
              >
                +14 days
              </button>
            </form>
            <form action={markOfferScrappedAction}>
              <input type="hidden" name="offerId" value={offerId} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-gray-800"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Yes, scrapped
              </button>
            </form>
            <Link
              href={editHref}
              className="text-xs font-semibold text-amber-900 underline-offset-2 hover:underline"
            >
              Edit offer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
