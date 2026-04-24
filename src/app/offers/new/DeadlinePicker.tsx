"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";

type Preset = { key: string; label: string; days: number };

const PRESETS: Preset[] = [
  { key: "2", label: "2 days", days: 2 },
  { key: "5", label: "End of week", days: 5 },
  { key: "14", label: "End of month", days: 14 },
  { key: "30", label: "Flexible", days: 30 },
];

export function DeadlinePicker() {
  const [mode, setMode] = useState<string>("5");
  const today = new Date().toISOString().slice(0, 10);
  const [customDate, setCustomDate] = useState<string>("");

  const preset = PRESETS.find((p) => p.key === mode);
  const previewDate = preset
    ? new Date(Date.now() + preset.days * 86400000)
    : customDate
      ? new Date(customDate)
      : null;

  const chipBase =
    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors";
  const chipOff = "bg-surface-container text-on-surface hover:bg-surface-container-high";
  const chipOn = "bg-primary text-white";

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setMode(p.key)}
            className={`${chipBase} ${mode === p.key ? chipOn : chipOff}`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`${chipBase} inline-flex items-center gap-1 ${
            mode === "custom" ? chipOn : chipOff
          }`}
        >
          <span className="material-symbols-outlined text-sm">event</span>
          Pick date
        </button>
      </div>

      {mode === "custom" ? (
        <input
          type="date"
          name="scrapDate"
          min={today}
          required
          value={customDate}
          onChange={(e) => setCustomDate(e.target.value)}
          className="input mt-3"
        />
      ) : (
        <input type="hidden" name="daysUntilScrap" value={preset?.days ?? 5} />
      )}

      <p className="mt-2 text-xs italic text-on-surface-variant">
        {previewDate && !Number.isNaN(previewDate.getTime())
          ? `Deadline: ${formatDate(previewDate)} — item archived if not claimed.`
          : "Pick a date for the scrap deadline."}
      </p>
    </div>
  );
}
