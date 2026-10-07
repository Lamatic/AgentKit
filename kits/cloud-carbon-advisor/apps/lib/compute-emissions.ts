// Deterministic footprint engine. Everything here is arithmetic over the usage
// export and the emissions-factor tables — no model, no network. This is the
// half of the kit whose numbers must be reproducible and unit-tested; the
// Lamatic flow only ever adds *judgment* on top of what this file produces.

import type {
  CleanerRegionOption,
  CloudProvider,
  FocusUsageRow,
  FootprintLine,
  Hotspot,
} from "./types";
import {
  classifyUsage,
  cleanestRegionForProvider,
  gridIntensityFor,
  lookupRegion,
  pueFor,
} from "./emissions-factors";

// A hotspot must clear both floors to be worth a recommendation: a hard
// minimum, and a share of the total. Everything below rolls into
// `unrankedEmissionsKg` so the totals still reconcile.
export const HOTSPOT_MIN_KG = 0.1;
export const HOTSPOT_MIN_SHARE = 0.005; // 0.5% of total emissions
export const MAX_HOTSPOTS = 12;

function round(n: number, dp = 3): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function energyKwhFor(usageAmount: number, coefficient: number): number {
  return usageAmount * coefficient;
}

function emissionsKgFor(energyKwh: number, pue: number, gridIntensity: number): number {
  // energy (kWh) × PUE × intensity (g/kWh) = grams; /1000 → kg.
  return (energyKwh * pue * gridIntensity) / 1000;
}

// The cleanest same-provider region a given energy load could move to — the
// migration *ceiling*. Cross-provider moves are a different kind of project, so
// this stays within one provider; a cross-continent target is returned with the
// `crossContinent` flag set so the flow and UI can weigh the data-residency and
// latency cost honestly rather than pretending it away.
export function cleanerRegionOption(
  provider: CloudProvider,
  region: string,
  energyKwh: number,
  pue: number,
  currentEmissionsKg: number,
): CleanerRegionOption | undefined {
  const here = lookupRegion(region);
  const target = cleanestRegionForProvider(provider);
  const currentIntensity = gridIntensityFor(region);
  if (!target || target.code === region || target.gridIntensity >= currentIntensity) {
    return undefined;
  }

  const emissionsKgIfMigrated = emissionsKgFor(energyKwh, pue, target.gridIntensity);
  const reductionKg = currentEmissionsKg - emissionsKgIfMigrated;
  if (reductionKg <= 0) return undefined;

  return {
    region: target.code,
    regionLabel: target.label,
    gridIntensity: target.gridIntensity,
    emissionsKgIfMigrated: round(emissionsKgIfMigrated),
    reductionKg: round(reductionKg),
    reductionPct: currentEmissionsKg > 0 ? round((reductionKg / currentEmissionsKg) * 100, 1) : 0,
    crossContinent: here ? target.continent !== here.continent : false,
  };
}

// Rows → aggregated footprint lines, one per (provider, service, region,
// subAccount, usageClass) bucket.
export function computeFootprintLines(rows: FocusUsageRow[]): FootprintLine[] {
  const buckets = new Map<string, FootprintLine>();

  for (const row of rows) {
    const { usageClass, coefficient, normalizedUnit } = classifyUsage({
      serviceCategory: row.serviceCategory,
      pricingUnit: row.pricingUnit,
      skuId: row.skuId,
      serviceName: row.serviceName,
    });

    const provider = row.provider;
    const region = row.regionId;
    const groupKey = `${provider}|${row.serviceName}|${region}|${row.subAccountId}|${usageClass}`;
    const energyKwh = energyKwhFor(row.pricingQuantity, coefficient);

    const existing = buckets.get(groupKey);
    if (existing) {
      existing.usageAmount += row.pricingQuantity;
      existing.energyKwh += energyKwh;
    } else {
      buckets.set(groupKey, {
        id: groupKey,
        groupKey,
        provider,
        service: row.serviceName,
        serviceCategory: row.serviceCategory,
        region,
        regionLabel: lookupRegion(region)?.label ?? region,
        subAccount: row.subAccountId,
        usageClass,
        usageAmount: row.pricingQuantity,
        usageUnit: normalizedUnit,
        energyKwh,
        pue: pueFor(provider),
        gridIntensity: gridIntensityFor(region),
        emissionsKg: 0, // filled below once energy is fully accumulated
      });
    }
  }

  const lines: FootprintLine[] = [];
  for (const line of buckets.values()) {
    line.energyKwh = round(line.energyKwh, 4);
    line.emissionsKg = round(emissionsKgFor(line.energyKwh, line.pue, line.gridIntensity));
    line.usageAmount = round(line.usageAmount, 2);
    line.cleanerRegion = cleanerRegionOption(line.provider, line.region, line.energyKwh, line.pue, line.emissionsKg);
    lines.push(line);
  }
  return lines;
}

// Footprint lines → ranked hotspots. Lines are merged across usage classes into
// a per-(provider, service, region, subAccount) hotspot, then ranked by
// emissions with the floors applied.
export function buildHotspots(lines: FootprintLine[]): {
  hotspots: Hotspot[];
  totalEmissionsKg: number;
  totalEnergyKwh: number;
  unrankedEmissionsKg: number;
} {
  const totalEmissionsKg = round(lines.reduce((s, l) => s + l.emissionsKg, 0));
  const totalEnergyKwh = round(lines.reduce((s, l) => s + l.energyKwh, 0), 4);

  const merged = new Map<string, Hotspot>();
  for (const line of lines) {
    const key = `${line.provider}|${line.service}|${line.region}|${line.subAccount}`;
    const existing = merged.get(key);
    if (existing) {
      existing.energyKwh = round(existing.energyKwh + line.energyKwh, 4);
      existing.emissionsKg = round(existing.emissionsKg + line.emissionsKg);
      // Dominant usage class is resolved separately, from the raw lines below.
    } else {
      merged.set(key, {
        id: key,
        groupKey: key,
        provider: line.provider,
        service: line.service,
        serviceCategory: line.serviceCategory,
        region: line.region,
        regionLabel: line.regionLabel,
        subAccount: line.subAccount,
        usageClass: line.usageClass,
        usageAmount: line.usageAmount,
        usageUnit: line.usageUnit,
        energyKwh: line.energyKwh,
        pue: line.pue,
        gridIntensity: line.gridIntensity,
        emissionsKg: line.emissionsKg,
        shareOfTotal: 0,
      });
    }
  }

  // Resolve the dominant usage class per hotspot from its underlying lines.
  const dominantByKey = new Map<string, { usageClass: string; kg: number; unit: string; amt: number }>();
  for (const line of lines) {
    const key = `${line.provider}|${line.service}|${line.region}|${line.subAccount}`;
    const cur = dominantByKey.get(key);
    if (!cur || line.emissionsKg > cur.kg) {
      dominantByKey.set(key, { usageClass: line.usageClass, kg: line.emissionsKg, unit: line.usageUnit, amt: line.usageAmount });
    }
  }

  const all = [...merged.values()].map((h) => {
    const dom = dominantByKey.get(h.id);
    if (dom) {
      h.usageClass = dom.usageClass as Hotspot["usageClass"];
      h.usageUnit = dom.unit;
      h.usageAmount = dom.amt;
    }
    h.shareOfTotal = totalEmissionsKg > 0 ? round(h.emissionsKg / totalEmissionsKg, 4) : 0;
    h.cleanerRegion = cleanerRegionOption(h.provider, h.region, h.energyKwh, h.pue, h.emissionsKg);
    return h;
  });

  const ranked = all
    .filter((h) => h.emissionsKg >= HOTSPOT_MIN_KG && h.shareOfTotal >= HOTSPOT_MIN_SHARE)
    .sort((a, b) => b.emissionsKg - a.emissionsKg)
    .slice(0, MAX_HOTSPOTS);

  const rankedKg = round(ranked.reduce((s, h) => s + h.emissionsKg, 0));
  const unrankedEmissionsKg = round(Math.max(0, totalEmissionsKg - rankedKg));

  return { hotspots: ranked, totalEmissionsKg, totalEnergyKwh, unrankedEmissionsKg };
}

// Emissions-weighted average grid intensity across all lines — a single number
// that captures "how dirty is this footprint's electricity on average".
export function averageGridIntensity(lines: FootprintLine[]): number {
  const energy = lines.reduce((s, l) => s + l.energyKwh, 0);
  if (energy === 0) return 0;
  const weighted = lines.reduce((s, l) => s + l.gridIntensity * l.energyKwh, 0);
  return Math.round(weighted / energy);
}

export function providerMix(lines: FootprintLine[]): { provider: CloudProvider; emissionsKg: number }[] {
  const m = new Map<CloudProvider, number>();
  for (const l of lines) m.set(l.provider, (m.get(l.provider) ?? 0) + l.emissionsKg);
  return [...m.entries()]
    .map(([provider, emissionsKg]) => ({ provider, emissionsKg: round(emissionsKg) }))
    .sort((a, b) => b.emissionsKg - a.emissionsKg);
}

// The deterministic best-case: if every hotspot moved to the cleanest
// same-provider region, how much CO2e would that alone remove. This is the
// headline "opportunity" number, computed entirely in code.
export function cleanestRegionOpportunity(hotspots: Hotspot[]): number {
  return round(hotspots.reduce((s, h) => s + (h.cleanerRegion?.reductionKg ?? 0), 0));
}
