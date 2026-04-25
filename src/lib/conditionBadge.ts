export function conditionBadge(cond: string) {
  switch (cond) {
    case "LIKE_NEW":
      return { label: "Excellent", cls: "excellent" };
    case "GOOD":
      return { label: "Good", cls: "good" };
    case "FAIR":
      return { label: "Fair", cls: "fair" };
    default:
      return { label: "Salvage", cls: "salvage" };
  }
}
