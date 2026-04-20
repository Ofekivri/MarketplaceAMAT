"use client";

import { addOfferImageAction } from "@/lib/actions";

export default function ImageUploader({ offerId }: { offerId: string }) {
  return (
    <form action={addOfferImageAction} className="aspect-square">
      <input type="hidden" name="offerId" value={offerId} />
      <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary">
        <span className="material-symbols-outlined text-2xl">
          add_a_photo
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Upload
        </span>
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
