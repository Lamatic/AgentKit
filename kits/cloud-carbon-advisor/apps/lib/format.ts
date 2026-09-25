// Presentation helpers shared by the UI. Pure and framework-free.

import type { CarbonDriverClass, CloudProvider, UsageClass } from "./types";

export function formatMass(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} tCO₂e`;
  if (kg >= 1) return `${kg.toFixed(1)} kgCO₂e`;
  return `${(kg * 1000).toFixed(0)} gCO₂e`;
}

export function formatKg(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(2)} t` : `${kg.toFixed(1)} kg`;
}

export function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function providerLabel(p: CloudProvider): string {
  return { aws: "AWS", gcp: "GCP", azure: "Azure", unknown: "Unknown" }[p];
}

const DRIVER_LABELS: Record<CarbonDriverClass, string> = {
  "dirty-grid": "Dirty grid",
  "compute-heavy": "Compute-heavy",
  "storage-bloat": "Storage bloat",
  "egress-heavy": "Egress-heavy",
  "over-provisioned": "Over-provisioned",
  mixed: "Mixed",
};

export function driverLabel(d: CarbonDriverClass): string {
  return DRIVER_LABELS[d] ?? "Mixed";
}

const USAGE_LABELS: Record<UsageClass, string> = {
  compute: "Compute",
  memory: "Memory",
  "storage-ssd": "Storage (SSD)",
  "storage-hdd": "Storage (cold)",
  network: "Networking",
  other: "Other",
};

export function usageClassLabel(u: UsageClass): string {
  return USAGE_LABELS[u] ?? "Other";
}

// Colour tone tokens (map to CSS classes defined in globals.css).
export function severityTone(level: "low" | "medium" | "high"): string {
  return level;
}
