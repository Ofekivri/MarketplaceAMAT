import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Asset Alert System",
  description: "Applied Materials Israel internal asset reuse marketplace",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const unreadCount = user
    ? await prisma.notification.count({
        where: { userId: user.id, readAt: null },
      })
    : 0;

  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="bg-amat-blue text-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
              <span aria-hidden>🏢</span>
              <span>Asset Alert System</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {user ? (
                <>
                  <Link href="/offers/new" className="hover:underline">
                    + Post item
                  </Link>
                  <Link href="/analytics" className="hover:underline">
                    Analytics
                  </Link>
                  <Link
                    href="/inbox"
                    className="relative rounded px-2 py-1 hover:bg-white/10"
                  >
                    Inbox
                    {unreadCount > 0 && (
                      <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/login"
                    className="rounded border border-white/30 px-2 py-1 text-xs hover:bg-white/10"
                    title="Switch user"
                  >
                    {user.name} · {user.department}
                  </Link>
                </>
              ) : (
                <Link href="/login" className="hover:underline">
                  Log in
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-gray-400">
          Applied Materials Israel · Internal MVP · Demo only
        </footer>
      </body>
    </html>
  );
}
