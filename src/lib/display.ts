export function iconFor(itemName: string): string {
  const n = itemName.toLowerCase();
  if (n.includes("chair") || n.includes("desk") || n.includes("furniture"))
    return "chair_alt";
  if (n.includes("motor") || n.includes("pump")) return "settings";
  if (n.includes("cable") || n.includes("wire") || n.includes("electric"))
    return "bolt";
  if (n.includes("tool")) return "construction";
  if (n.includes("pallet") || n.includes("box")) return "inventory_2";
  if (n.includes("monitor") || n.includes("screen") || n.includes("computer"))
    return "monitor";
  return "category";
}

export function conditionBadge(cond: string): { label: string; bg: string } {
  switch (cond) {
    case "LIKE_NEW":
      return { label: "Excellent Condition", bg: "bg-tertiary" };
    case "GOOD":
      return { label: "Good Condition", bg: "bg-primary" };
    case "FAIR":
      return { label: "Fair / Salvage", bg: "bg-secondary" };
    default:
      return { label: "For Scrap", bg: "bg-error" };
  }
}

export function offerStatusColor(status: string): string {
  switch (status) {
    case "AVAILABLE":
      return "bg-tertiary";
    case "CLAIMED":
      return "bg-primary";
    case "COMPLETED":
      return "bg-outline";
    default:
      return "bg-error";
  }
}
