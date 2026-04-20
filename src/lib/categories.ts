export const CATEGORIES = [
  {
    id: "FOUP",
    label: "FOUP",
    icon: "inventory_2",
    subcategories: ["300mm", "200mm", "Cover / Lid", "Parts"],
  },
  {
    id: "FOSB",
    label: "FOSB",
    icon: "package_2",
    subcategories: ["300mm", "200mm", "Cover / Lid"],
  },
  {
    id: "WAFER",
    label: "Wafer / Carrier",
    icon: "album",
    subcategories: [
      "Blank Silicon (300mm)",
      "Blank Silicon (200mm)",
      "Test / Dummy",
      "Cassette",
      "Open Carrier",
    ],
  },
  {
    id: "RETICLE",
    label: "Reticle Pod",
    icon: "crop_free",
    subcategories: ["SMIF Pod (6\")", "EUV Pod", "Cover"],
  },
  {
    id: "CHAMBER",
    label: "Chamber Part",
    icon: "blur_circular",
    subcategories: [
      "Showerhead",
      "ESC / Chuck",
      "Quartzware",
      "Ceramic",
      "Liner",
      "Heater",
    ],
  },
  {
    id: "VACUUM_GAS",
    label: "Vacuum & Gas",
    icon: "speed",
    subcategories: [
      "Dry Pump",
      "Turbo Pump",
      "MFC",
      "Regulator",
      "Valve",
      "Gauge",
      "Filter",
    ],
  },
  {
    id: "CLEANROOM",
    label: "Cleanroom Supply",
    icon: "sanitizer",
    subcategories: ["Wipes", "Coveralls", "Gloves", "Swabs", "Mats"],
  },
  {
    id: "HAND_TOOL",
    label: "Hand Tool",
    icon: "construction",
    subcategories: [
      "Wrenches",
      "Drivers",
      "Pliers",
      "Measuring",
      "Cutting",
    ],
  },
  {
    id: "POWER_TOOL",
    label: "Power Tool",
    icon: "handyman",
    subcategories: ["Drill", "Grinder", "Saw", "Impact Driver"],
  },
  {
    id: "ELECTRONICS",
    label: "Electronics & IT",
    icon: "memory",
    subcategories: [
      "Monitor",
      "Computer / Laptop",
      "Network Gear",
      "Power Supply",
      "Test Equipment",
      "Controller / PLC",
      "Printer",
      "UPS",
      "Other",
    ],
  },
  {
    id: "MOTOR",
    label: "Motor & Drive",
    icon: "settings",
    subcategories: [
      "Electric Motor",
      "Servo",
      "VFD",
      "Pneumatic Cylinder",
      "Fan",
    ],
  },
  {
    id: "CABLE",
    label: "Cable & Wiring",
    icon: "cable",
    subcategories: ["Network", "Power", "Signal", "Connector"],
  },
  {
    id: "SAFETY",
    label: "Safety / PPE",
    icon: "health_and_safety",
    subcategories: [
      "Harness",
      "Helmet",
      "Fire Extinguisher",
      "Lockout Kit",
      "Eye Protection",
    ],
  },
  {
    id: "OFFICE",
    label: "Office / Furniture",
    icon: "chair_alt",
    subcategories: ["Chair", "Desk", "Cabinet", "Whiteboard", "Partition"],
  },
  {
    id: "MATERIAL_HANDLING",
    label: "Material Handling",
    icon: "forklift",
    subcategories: ["Pallet", "Jack", "Shelving", "Ladder", "Conveyor"],
  },
  {
    id: "OTHER",
    label: "Other",
    icon: "category",
    subcategories: ["General"],
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

const LOOKUP = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string) {
  return LOOKUP.get(id as CategoryId) ?? LOOKUP.get("OTHER")!;
}

export function isValidCategory(id: string): id is CategoryId {
  return LOOKUP.has(id as CategoryId);
}

export function isValidSubCategory(categoryId: string, sub: string): boolean {
  const c = LOOKUP.get(categoryId as CategoryId);
  if (!c) return false;
  return (c.subcategories as readonly string[]).includes(sub);
}
