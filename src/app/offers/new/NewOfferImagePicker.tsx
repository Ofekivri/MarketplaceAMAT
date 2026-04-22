"use client";

import { useEffect, useRef, useState } from "react";

const MAX_IMAGES = 6;
const MAX_BYTES = 4 * 1024 * 1024;

export default function NewOfferImagePicker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function syncInput(next: File[]) {
    if (!inputRef.current) return;
    const dt = new DataTransfer();
    next.forEach((f) => dt.items.add(f));
    inputRef.current.files = dt.files;
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const merged = [...files];
    let err: string | null = null;
    for (const f of picked) {
      if (merged.length >= MAX_IMAGES) {
        err = `You can attach up to ${MAX_IMAGES} photos.`;
        break;
      }
      if (!f.type.startsWith("image/")) {
        err = `${f.name} is not an image.`;
        continue;
      }
      if (f.size > MAX_BYTES) {
        err = `${f.name} is over 4MB.`;
        continue;
      }
      merged.push(f);
    }
    setFiles(merged);
    syncInput(merged);
    setError(err);
  }

  function remove(i: number) {
    const next = files.filter((_, j) => j !== i);
    setFiles(next);
    syncInput(next);
    setError(null);
  }

  const atCap = files.length >= MAX_IMAGES;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name="images"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPick}
      />

      {files.length === 0 ? (
        <label
          className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-12 transition-colors hover:border-primary ${
            atCap ? "cursor-not-allowed opacity-70" : "cursor-pointer"
          }`}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed">
            <span className="material-symbols-outlined text-3xl text-primary">
              add_a_photo
            </span>
          </div>
          <p className="mb-1 font-semibold text-on-surface">
            Drop photos here or click to choose
          </p>
          <p className="text-sm text-on-surface-variant">
            Up to 6 photos · 4MB each · JPG/PNG/WEBP
          </p>
          <button
            type="button"
            disabled={atCap}
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Choose photos"
          />
        </label>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {previews.map((src, i) => (
            <div
              key={src}
              className="group relative aspect-square overflow-hidden rounded-lg bg-surface-container"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Photo ${i + 1}`}
                className="h-full w-full object-cover"
              />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                  Primary
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))}
          {!atCap && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary"
            >
              <span className="material-symbols-outlined text-2xl">add</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Add more
              </span>
            </button>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs">
        <p className={error ? "text-error" : "text-on-surface-variant"}>
          {error ?? `${files.length} / ${MAX_IMAGES} photos selected`}
        </p>
        <p className="text-on-surface-variant">
          First photo is the primary thumbnail.
        </p>
      </div>
    </div>
  );
}
