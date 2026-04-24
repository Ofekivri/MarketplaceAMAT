"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  addOfferImageAction,
  removeOfferImageAction,
  setPrimaryOfferImageAction,
} from "@/lib/actions";

const MAX_BYTES = 4 * 1024 * 1024;

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function ImageUploader({
  offerId,
  variant = "tile",
}: {
  offerId: string;
  variant?: "tile" | "big";
}) {
  const big = variant === "big";
  const [isPending, startTransition] = useTransition();

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("That file is not an image");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 4MB");
      return;
    }

    const fd = new FormData();
    fd.set("offerId", offerId);
    fd.set("image", file);

    startTransition(async () => {
      try {
        await addOfferImageAction(fd);
        toast.success("Photo uploaded");
      } catch (err) {
        toast.error(errorMessage(err, "Upload failed"));
      }
    });
  }

  return (
    <label
      className={
        big
          ? `group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-12 transition-colors hover:border-primary ${
              isPending ? "cursor-wait opacity-70" : "cursor-pointer"
            }`
          : `flex aspect-square h-full w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary ${
              isPending ? "cursor-wait opacity-70" : "cursor-pointer"
            }`
      }
    >
      {big ? (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed">
            <span className="material-symbols-outlined text-3xl text-primary">
              {isPending ? "progress_activity" : "add_a_photo"}
            </span>
          </div>
          <p className="mb-1 font-semibold text-on-surface">
            {isPending ? "Uploading…" : "Drop a photo here or click to choose"}
          </p>
          <p className="text-sm text-on-surface-variant">
            Up to 6 photos · 4MB each · JPG/PNG/WEBP
          </p>
        </>
      ) : (
        <>
          <span className="material-symbols-outlined text-2xl">
            {isPending ? "progress_activity" : "add"}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {isPending ? "Uploading…" : "Add more"}
          </span>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={isPending}
        onChange={onPick}
      />
    </label>
  );
}

export function RemoveImageButton({
  offerId,
  index,
  className,
  ariaLabel,
  children,
}: {
  offerId: string;
  index: number;
  className: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    const fd = new FormData();
    fd.set("offerId", offerId);
    fd.set("index", String(index));
    startTransition(async () => {
      try {
        await removeOfferImageAction(fd);
        toast.success("Photo removed");
      } catch (err) {
        toast.error(errorMessage(err, "Couldn't remove photo"));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={className}
    >
      {children}
    </button>
  );
}

export function SetPrimaryImageButton({
  offerId,
  index,
  className,
  ariaLabel,
  children,
}: {
  offerId: string;
  index: number;
  className: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    const fd = new FormData();
    fd.set("offerId", offerId);
    fd.set("index", String(index));
    startTransition(async () => {
      try {
        await setPrimaryOfferImageAction(fd);
        toast.success("Primary photo updated");
      } catch (err) {
        toast.error(errorMessage(err, "Couldn't set as primary"));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={className}
    >
      {children}
    </button>
  );
}
