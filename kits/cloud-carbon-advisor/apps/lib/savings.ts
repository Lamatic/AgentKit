// Reduction-lever pricing. The Lamatic flow's Recommend node returns a
// `reductionKey` *bucket* — never a number. This table turns that bucket into a
// projected kgCO2e saving, deterministically. Keeping the arithmetic here (and
// mirrored in scripts/carbon-advisor_assemble.ts, the code node that runs the
// same logic inside the flow) is what lets the flow honestly claim it never
// invents a figure.

import type { Hotspot, ReductionKey } from "./types";

// Fraction of a hotspot's emissions the lever can plausibly remove. Deliberately
// conservative — these are planning estimates, not guarantees.
export const REDUCTION_MULTIPLIER: Record<ReductionKey, number> = {
  "region-migration-major": 0.9,
  "region-migration-partial": 0.5,
  "rightsize-major": 0.6,
  "rightsize-moderate": 0.3,
  "schedule-shift": 0.15,
  "storage-tier": 0.4,
  "arm-migration": 0.35,
  "eliminate-full": 1.0,
  none: 0.0,
  unknown: 0.0,
};

export function isKnownReductionKey(key: string): key is ReductionKey {
  return Object.prototype.hasOwnProperty.call(REDUCTION_MULTIPLIER, key);
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// Projected saving for a hotspot given a reduction lever.
//
// Region-migration levers are special: the exact post-migration figure is
// already known deterministically (the cleaner-region option computed from the
// grid-intensity table), so we use that measured delta rather than a generic
// multiplier. `major` takes the full computed delta, `partial` takes half.
// Every other lever falls back to `emissions × multiplier`.
export function projectedReductionKg(hotspot: Hotspot, key: ReductionKey): number {
  if ((key === "region-migration-major" || key === "region-migration-partial") && hotspot.cleanerRegion) {
    const factor = key === "region-migration-major" ? 1 : 0.5;
    return round(hotspot.cleanerRegion.reductionKg * factor);
  }
  const multiplier = REDUCTION_MULTIPLIER[key] ?? 0;
  return round(hotspot.emissionsKg * multiplier);
}
