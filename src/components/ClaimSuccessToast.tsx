"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function ClaimSuccessToast({
  itemName,
  department,
  location,
}: {
  itemName: string;
  department: string;
  location: string;
}) {
  const [visible, setVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => router.replace(pathname), 300);
      return () => clearTimeout(t);
    }
  }, [visible, router, pathname]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-4 overflow-hidden rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-md transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-2 opacity-0"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-white shadow-sm">
        <span className="material-symbols-outlined">check</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-green-900">
          Claim confirmed — {itemName} is yours.
        </p>
        <p className="mt-1 text-xs text-green-800">
          {department} has been notified. Pick it up at {location} before the
          deadline.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        className="rounded-full p-1 text-green-700/70 transition-colors hover:bg-green-100 hover:text-green-900"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  );
}
