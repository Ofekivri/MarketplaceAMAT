import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { deleteSearchSubscriptionAction } from "@/lib/actions";
import { formatRelative } from "@/lib/format";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function WatchlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const subs = await prisma.searchSubscription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Watchlist</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Saved searches. You&apos;ll get an inbox notification every time a new
          offer matches one of these.
        </p>
      </div>

      {subs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No saved searches yet. Search something on the{" "}
          <Link href="/" className="text-amat-blue hover:underline">
            dashboard
          </Link>
          &nbsp;— if nothing matches, you&apos;ll see a &quot;Notify me&quot;
          button.
        </div>
      ) : (
        <ul className="space-y-2">
          {subs.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-primary">
                      notifications_active
                    </span>
                    <p className="font-medium">&quot;{s.query}&quot;</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Saved {formatRelative(s.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-right">
                  <Link
                    href={`/?q=${encodeURIComponent(s.query)}`}
                    className="text-sm text-amat-blue hover:underline"
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
