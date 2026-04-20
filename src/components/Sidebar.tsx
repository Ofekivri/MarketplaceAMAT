"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  href: string;
  icon: string;
  label: string;
  matchPaths?: string[];
};

const primary: Item[] = [
  { href: "/", icon: "dashboard", label: "Dashboard", matchPaths: ["/"] },
  { href: "/", icon: "storefront", label: "Marketplace" },
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
    href: "/analytics",
    icon: "analytics",
    label: "Analytics",
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="z-50 hidden h-screen w-64 flex-col border-r-0 bg-[#ededf9] text-sm font-medium tracking-wide md:flex">
      <div className="flex h-full flex-col gap-2 px-8 py-8">
        <div className="mb-8">
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
              Asset Alert
            </span>
          </div>
          <p className="text-xs font-normal text-on-surface-variant opacity-70">
            Industrial Curator
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {primary.map((item, i) => {
            const active =
              item.matchPaths?.some((p) =>
                p === "/" ? pathname === "/" : pathname.startsWith(p),
              ) ?? false;
            return (
              <Link
                key={`${item.label}-${i}`}
                href={item.href}
                className={
                  active
                    ? "flex items-center gap-3 rounded-full bg-[#2563eb] px-4 py-2.5 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 ease-in-out"
                    : "flex items-center gap-3 px-4 py-2.5 text-[#434655] transition-all duration-300 hover:bg-[#faf8ff]/50 hover:text-[#191b23]"
                }
              >
                <span
                  className="material-symbols-outlined"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 px-2">
          <Link
            href="/offers/new"
            className="block w-full rounded-xl bg-gradient-to-r from-primary to-primary-container py-4 text-center font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95"
          >
            Create Listing
          </Link>
        </div>

        <div className="mt-auto flex flex-col gap-1">
          {footer.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 text-[#434655] transition-all duration-300 hover:text-[#191b23]"
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
