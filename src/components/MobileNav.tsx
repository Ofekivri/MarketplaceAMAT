import Link from "next/link";

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-outline-variant/10 bg-white px-2 py-3 shadow-[0_-10px_30px_-5px_rgba(25,27,35,0.04)] md:hidden">
      <Link href="/" className="flex flex-col items-center gap-1 text-primary">
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          dashboard
        </span>
        <span className="text-[10px] font-bold">Dash</span>
      </Link>
      <Link
        href="/offers/new"
        className="-mt-8 rounded-full bg-primary p-3 text-white shadow-lg"
      >
        <span className="material-symbols-outlined">add</span>
      </Link>
      <Link
        href="/claims"
        className="flex flex-col items-center gap-1 text-on-surface-variant"
      >
        <span className="material-symbols-outlined">shopping_cart_checkout</span>
        <span className="text-[10px] font-medium">Claims</span>
      </Link>
      <Link
        href="/login"
        className="flex flex-col items-center gap-1 text-on-surface-variant"
      >
        <span className="material-symbols-outlined">person</span>
        <span className="text-[10px] font-medium">Profile</span>
      </Link>
    </nav>
  );
}
