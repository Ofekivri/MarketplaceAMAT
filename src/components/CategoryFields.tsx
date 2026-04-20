"use client";

import { useState } from "react";
import { CATEGORIES, getCategory } from "@/lib/categories";

export function CategoryFields({
  defaultCategory = "OTHER",
  defaultSubCategory = "",
  disabled = false,
}: {
  defaultCategory?: string;
  defaultSubCategory?: string;
  disabled?: boolean;
}) {
  const [category, setCategory] = useState(defaultCategory);
  const subs = getCategory(category).subcategories;
  const initialSub = (subs as readonly string[]).includes(defaultSubCategory)
    ? defaultSubCategory
    : subs[0];
  const [subCategory, setSubCategory] = useState(initialSub);

  return (
    <>
      <Field
        label="Category"
        htmlFor="category"
        hint="Choose the closest match — used for search & filtering."
      >
        <select
          id="category"
          name="category"
          value={category}
          onChange={(e) => {
            const newCat = e.target.value;
            setCategory(newCat);
            const newSubs = getCategory(newCat).subcategories;
            setSubCategory(newSubs[0]);
          }}
          required
          disabled={disabled}
          className="input"
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Subcategory" htmlFor="subCategory">
        <select
          id="subCategory"
          name="subCategory"
          value={subCategory}
          onChange={(e) => setSubCategory(e.target.value)}
          required
          disabled={disabled}
          className="input"
        >
          {subs.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
    </>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-bold uppercase tracking-widest text-on-surface-variant"
      >
        {label}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs text-on-surface-variant">{hint}</p>}
    </div>
  );
}
