"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function PostedCelebration({ itemName }: { itemName: string }) {
  const [visible, setVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 10000);
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
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-white shadow-2xl shadow-green-500/40 transition-all duration-300 ${
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none -translate-y-2 scale-95 opacity-0"
      }`}
    >
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${(i * 4.3) % 100}%`,
              animationDelay: `${(i % 6) * 0.15}s`,
              backgroundColor: [
                "#fbbf24",
                "#fcd34d",
                "#f472b6",
                "#60a5fa",
                "#a78bfa",
                "#ffffff",
              ][i % 6],
            }}
          />
        ))}
      </div>

      {/* Close */}
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        className="absolute right-4 top-4 rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <span className="material-symbols-outlined">close</span>
      </button>

      <div className="relative z-10 flex items-start gap-5">
        {/* Checkmark */}
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-white/30" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-emerald-600 shadow-lg">
            <span className="material-symbols-outlined text-4xl font-black">
              check
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">
            Published
          </p>
          <h2 className="mt-1 text-2xl font-black leading-tight">
            {itemName} is now live
          </h2>
          <p className="mt-2 text-sm text-white/90">
            One more asset kept out of scrap. Other departments will be notified
            right now.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/offers/new"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-emerald-700 shadow-md transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined text-base">
                add_box
              </span>
              Post another
            </Link>
            <button
              onClick={() => setVisible(false)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/40 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              View listing
              <span className="material-symbols-outlined text-base">
                arrow_downward
              </span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .confetti-piece {
          position: absolute;
          top: -20px;
          width: 8px;
          height: 14px;
          opacity: 0.9;
          border-radius: 2px;
          animation: confetti-fall 2.4s ease-in forwards;
        }
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(240px) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
