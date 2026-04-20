export const CATEGORIES = [
  { id: "FOUP", label: "FOUP", icon: "inventory_2" },
  { id: "FOSB", label: "FOSB", icon: "package_2" },
  { id: "WAFER", label: "Wafer / Carrier", icon: "album" },
  { id: "RETICLE", label: "Reticle Pod", icon: "crop_free" },
  { id: "CHAMBER", label: "Chamber Part", icon: "blur_circular" },
  { id: "VACUUM_GAS", label: "Vacuum & Gas", icon: "speed" },
  { id: "CLEANROOM", label: "Cleanroom Supply", icon: "sanitizer" },
  { id: "HAND_TOOL", label: "Hand Tool", icon: "construction" },
  { id: "POWER_TOOL", label: "Power Tool", icon: "handyman" },
  { id: "ELECTRONICS", label: "Electronics & IT", icon: "memory" },
  { id: "MOTOR", label: "Motor & Drive", icon: "settings" },
  { id: "CABLE", label: "Cable & Wiring", icon: "cable" },
  { id: "SAFETY", label: "Safety / PPE", icon: "health_and_safety" },
  { id: "OFFICE", label: "Office / Furniture", icon: "chair_alt" },
  { id: "MATERIAL_HANDLING", label: "Material Handling", icon: "forklift" },
  { id: "OTHER", label: "Other", icon: "category" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

const LOOKUP = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string) {
  return LOOKUP.get(id as CategoryId) ?? LOOKUP.get("OTHER")!;
}

export function isValidCategory(id: string): id is CategoryId {
  return LOOKUP.has(id as CategoryId);
}
