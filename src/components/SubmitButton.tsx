"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  icon,
  label,
  pendingLabel,
  className = "",
  onClickConfirm,
}: {
  icon: string;
  label: string;
  pendingLabel?: string;
  className?: string;
  onClickConfirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={
        onClickConfirm
          ? (e) => {
              if (!window.confirm(onClickConfirm)) e.preventDefault();
            }
          : undefined
      }
      className={`${className} disabled:cursor-not-allowed disabled:opacity-70`}
      aria-busy={pending}
    >
      <span
        className={`material-symbols-outlined ${pending ? "animate-spin" : ""}`}
      >
        {pending ? "progress_activity" : icon}
      </span>
      {pending ? (pendingLabel ?? "Working…") : label}
    </button>
  );
}
