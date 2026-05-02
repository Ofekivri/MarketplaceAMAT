"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  href: string;
  icon: string;
  label: string;
  matchPaths?: string[];
  badgeKey?: "watchlist";
};

const primary: Item[] = [
  { href: "/", icon: "dashboard", label: "Dashboard", matchPaths: ["/"] },
  {
    href: "/claims",
    icon: "shopping_cart_checkout",
    label: "My Claims",
    matchPaths: ["/claims"],
  },
  {
    href: "/my-offers",
    icon: "inventory",
    label: "My Offers",
    matchPaths: ["/my-offers"],
  },
  {
    href: "/watchlist",
    icon: "notifications_active",
    label: "Watchlist",
    matchPaths: ["/watchlist"],
    badgeKey: "watchlist",
  },
  {
    href: "/analytics",
    icon: "insights",
    label: "My Impact",
    matchPaths: ["/analytics"],
  },
  {
    href: "/offers/new",
    icon: "add_box",
    label: "Post Item",
    matchPaths: ["/offers/new", "/offers"],
  },
];

const footer: Item[] = [
  { href: "/inbox", icon: "contact_support", label: "Support" },
  { href: "/login", icon: "switch_account", label: "Switch user" },
];

export function Sidebar({ watchlistCount = 0 }: { watchlistCount?: number }) {
  const pathname = usePathname();
  const badges: Record<NonNullable<Item["badgeKey"]>, number> = {
    watchlist: watchlistCount,
  };

  return (
    <aside className="z-50 hidden h-screen w-64 flex-col border-r-0 bg-[#ededf9] text-sm font-medium tracking-wide md:flex">
      <div className="flex h-full flex-col gap-2 px-8 py-8">
        <Link
          href="/"
          aria-label="Go to dashboard"
          className="mb-8 block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#ededf9]"
        >
          <div className="mb-1 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                package_2
              </span>
            </div>
            <span className="text-lg font-bold text-[#191b23]">
              SecondLife
            </span>
          </div>
          <p className="text-xs font-normal text-on-surface-variant opacity-70">
            Industrial Curator
          </p>
        </Link>

        <nav className="flex flex-col gap-1">
          {primary.map((item, i) => {
            const active =
              item.matchPaths?.some((p) =>
                p === "/" ? pathname === "/" : pathname.startsWith(p),
              ) ?? false;
            const badge = item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <Link
                key={`${item.label}-${i}`}
                href={item.href}
                className={
                  active
                    ? "flex items-center gap-3 rounded-full bg-[#2563eb] px-4 py-2.5 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#ededf9]"
                    : "flex items-center gap-3 rounded-full px-4 py-2.5 text-[#434655] transition-all duration-300 hover:bg-[#faf8ff]/50 hover:text-[#191b23] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#ededf9]"
                }
              >
                <span
                  className="material-symbols-outlined"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span
                    className={`inline-flex min-w-[20px] items-center justify-center rounded-full bg-error px-1.5 text-[10px] font-bold text-white ${
                      active ? "ring-2 ring-white/40" : ""
                    }`}
                    aria-label={`${badge} new`}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 px-2">
          <Link
            href="/offers/new"
            className="block w-full rounded-xl bg-gradient-to-r from-primary to-primary-container py-4 text-center font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#ededf9]"
          >
            Create Listing
          </Link>
        </div>

        <div className="mt-auto flex flex-col gap-1">
          {footer.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-full px-4 py-2 text-[#434655] transition-all duration-300 hover:text-[#191b23] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#ededf9]"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
