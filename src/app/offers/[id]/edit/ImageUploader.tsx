"use client";

import { addOfferImageAction } from "@/lib/actions";

export default function ImageUploader({
  offerId,
  variant = "tile",
}: {
  offerId: string;
  variant?: "tile" | "big";
}) {
  const big = variant === "big";

  return (
    <form action={addOfferImageAction} className={big ? "" : "aspect-square"}>
      <input type="hidden" name="offerId" value={offerId} />
      <label
        className={
          big
            ? "group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-12 transition-colors hover:border-primary"
            : "flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary"
        }
      >
        {big ? (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed">
              <span className="material-symbols-outlined text-3xl text-primary">
                add_a_photo
              </span>
            </div>
            <p className="mb-1 font-semibold text-on-surface">
              Drop a photo here or click to choose
            </p>
            <p className="text-sm text-on-surface-variant">
              Up to 6 photos · 4MB each · JPG/PNG/WEBP
            </p>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-2xl">add</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Add more
            </span>
          </>
        )}
        <input
          type="file"
          name="image"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.currentTarget.files?.length) {
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
      </label>
    </form>
  );
}
