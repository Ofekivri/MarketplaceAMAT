import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { MobileNav } from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "SecondLife | Dashboard",
  description: "Applied Materials Israel internal asset reuse marketplace",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, allUsers] = await Promise.all([
    getCurrentUser(),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);
  const [unreadCount, watchlistCount] = user
    ? await Promise.all([
        prisma.notification.count({
          where: { userId: user.id, readAt: null },
        }),
        prisma.searchSubscriptionMatch.count({
          where: {
            dismissedAt: null,
            subscription: { userId: user.id },
          },
        }),
      ])
    : [0, 0];

  return (
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen overflow-hidden bg-surface text-on-surface">
        <Sidebar watchlistCount={watchlistCount} />
        <main className="flex h-screen flex-1 flex-col overflow-y-auto">
          <TopBar user={user} users={allUsers} unreadCount={unreadCount} />
          <div className="mx-auto w-full max-w-[1440px] flex-1 px-8 py-6 pb-24 md:pb-6">
            {children}
          </div>
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
