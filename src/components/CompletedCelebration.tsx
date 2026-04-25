"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const DURATION_MS = 5000;

export function CompletedCelebration({
  itemName,
  estimatedValue,
}: {
  itemName: string;
  estimatedValue: number;
}) {
  const [visible, setVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (visible) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => router.replace(pathname), 300);
      return () => clearTimeout(t);
    }
  }, [visible, router, pathname]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pickup confirmed"
      onClick={() => setVisible(false)}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md overflow-hidden rounded-3xl bg-white text-center shadow-2xl transition-all duration-300 ${
          visible ? "scale-100" : "scale-95"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left: `${(i * 3.3) % 100}%`,
                animationDelay: `${(i % 8) * 0.12}s`,
                backgroundColor: [
                  "#10b981",
                  "#34d399",
                  "#fbbf24",
                  "#f472b6",
                  "#60a5fa",
                  "#a78bfa",
                ][i % 6],
              }}
            />
          ))}
        </div>

        <div className="relative z-10 px-8 pb-8 pt-10">
          <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
            <div className="absolute h-24 w-24 animate-ping rounded-full bg-green-300 opacity-75" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500 text-white shadow-xl shadow-green-500/40">
              <span className="material-symbols-outlined text-6xl">
                verified
              </span>
            </div>
          </div>

          <h2 className="text-3xl font-black text-green-900">
            Saved from scrap!
          </h2>
          <p className="mt-2 text-base text-gray-700">
            <span className="font-bold">{itemName}</span> has been redeployed.
          </p>

          {estimatedValue > 0 && (
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-900">
              <span className="material-symbols-outlined text-base">
                savings
              </span>
              ${estimatedValue.toLocaleString()} saved
            </div>
          )}

          <button
            type="button"
            onClick={() => setVisible(false)}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800"
          >
            Done
          </button>
        </div>

        <div className="celebration-progress absolute bottom-0 left-0 h-1 bg-green-500" />

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
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
          }
          .celebration-progress {
            animation: celebration-progress ${DURATION_MS}ms linear forwards;
          }
          @keyframes celebration-progress {
            0% { width: 100%; }
            100% { width: 0%; }
          }
        `}</style>
      </div>
    </div>
  );
}
