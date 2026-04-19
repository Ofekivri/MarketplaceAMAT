import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  markAllReadAction,
  markNotificationReadAction,
} from "@/lib/actions";
import { formatRelative } from "@/lib/format";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function InboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const hasUnread = notifications.some((n) => n.readAt === null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Inbox</h1>
        {hasUnread && (
          <form action={markAllReadAction}>
            <button className="text-sm text-amat-blue hover:underline">
              Mark all read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No notifications yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-lg border bg-white p-4 shadow-sm ${
                n.readAt === null
                  ? "border-amat-accent/40 bg-amat-accent/5"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {n.readAt === null && (
                      <span className="h-2 w-2 rounded-full bg-amat-accent" />
                    )}
                    <p className="font-medium">{n.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{n.body}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatRelative(n.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-right">
                  {n.link && (
                    <Link
                      href={n.link}
                      className="text-sm text-amat-blue hover:underline"
                    >
                      View →
                    </Link>
                  )}
                  {n.readAt === null && (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="id" value={n.id} />
                      <button className="text-xs text-gray-400 hover:underline">
                        Mark read
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
