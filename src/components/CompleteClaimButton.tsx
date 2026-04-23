"use client";

import { useFormStatus } from "react-dom";

export function CompleteClaimButton({ isClaimer }: { isClaimer: boolean }) {
  const { pending } = useFormStatus();
  const label = isClaimer ? "I Received This Item" : "Confirm Handover";
  const confirmMsg = isClaimer
    ? "Confirm you've picked up this item? This marks the handover as complete and cannot be undone."
    : "Confirm the claimer has picked this up? This marks the handover as complete and cannot be undone.";

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        if (pending) return;
        if (!window.confirm(confirmMsg)) {
          e.preventDefault();
          return;
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="flex w-full items-center justify-center gap-3 rounded-xl bg-green-600 px-8 py-5 text-lg font-bold text-white shadow-lg shadow-green-500/30 transition-all hover:bg-green-700 hover:shadow-green-500/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-green-600"
    >
      <span
        className={`material-symbols-outlined text-2xl ${
          pending ? "animate-spin" : ""
        }`}
      >
        {pending ? "progress_activity" : "check_circle"}
      </span>
      {pending ? "Confirming…" : label}
    </button>
  );
}
