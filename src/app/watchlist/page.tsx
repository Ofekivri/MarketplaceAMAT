import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  deleteSearchSubscriptionAction,
  dismissSearchMatchAction,
} from "@/lib/actions";
import { formatRelative, daysUntil } from "@/lib/format";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WatchlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const subs = await prisma.searchSubscription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      matches: {
        where: { dismissedAt: null },
        orderBy: { createdAt: "desc" },
        include: { offer: { include: { offeringUser: true } } },
      },
    },
  });

  const totalNew = subs.reduce((sum, s) => sum + s.matches.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Watchlist</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Saved searches and the items we found for you. Dismiss anything that
            isn&apos;t what you were looking for.
          </p>
        </div>
        {totalNew > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-error/10 px-3 py-1 text-xs font-bold text-error">
            <span className="h-2 w-2 rounded-full bg-error" />
            {totalNew} new {totalNew === 1 ? "match" : "matches"}
          </span>
        )}
      </div>

      {subs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No saved searches yet. Search something on the{" "}
          <Link href="/" className="text-primary hover:underline">
            dashboard
          </Link>
          &nbsp;— if nothing matches, you&apos;ll see a &quot;Notify me&quot;
          button.
        </div>
      ) : (
        <ul className="space-y-3">
          {subs.map((s) => (
            <li
              key={s.id}
              className={`rounded-lg border bg-white p-4 shadow-sm ${
                s.matches.length > 0
                  ? "border-error/40"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-primary">
                      notifications_active
                    </span>
                    <p className="font-medium">&quot;{s.query}&quot;</p>
                    {s.matches.length > 0 && (
                      <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-error px-1.5 text-[10px] font-bold text-white">
                        {s.matches.length}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Saved {formatRelative(s.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-right">
                  <Link
                    href={`/?q=${encodeURIComponent(s.query)}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Search now →
                  </Link>
                  <form action={deleteSearchSubscriptionAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="text-xs text-gray-400 hover:text-error hover:underline">
                      Stop watching
                    </button>
                  </form>
                </div>
              </div>

              {s.matches.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                  {s.matches.map((m) => {
                    const days = daysUntil(m.offer.scrapDate);
                    return (
                      <li
                        key={m.id}
                        className="flex items-start justify-between gap-4 rounded-md bg-error/5 p-3"
                      >
                        <div className="flex-1">
                          <Link
                            href={`/offers/${m.offer.id}`}
                            className="font-semibold text-on-surface hover:underline"
                          >
                            {m.offer.itemName}
                          </Link>
                          <p className="mt-0.5 text-xs text-on-surface-variant">
                            {m.offer.offeringUser.department} · {m.offer.location} ·{" "}
                            {days > 0 ? `${days}d left` : "expired"}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            Found {formatRelative(m.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <Link
                            href={`/offers/${m.offer.id}`}
                            className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white hover:bg-primary-container"
                          >
                            View offer
                          </Link>
                          <form action={dismissSearchMatchAction}>
                            <input type="hidden" name="id" value={m.id} />
                            <button className="text-[11px] text-gray-500 hover:text-error hover:underline">
                              Not what I searched for
                            </button>
                          </form>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
