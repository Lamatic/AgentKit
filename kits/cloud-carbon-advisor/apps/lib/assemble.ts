// Final report assembly. Prices each hotspot's recommended lever
// deterministically (savings.ts), reconciles totals, attaches relatable
// equivalences, and writes the executive summary. This is where "judgment
// buckets" become numbers — and it is the same code the offline eval asserts
// against, so every figure in a report is reproducible.

import type {
  CloudProvider,
  Hotspot,
  Report,
  ReportHotspot,
} from "./types";
import type { Plan } from "./plan";
import { projectedReductionKg } from "./savings";
import { equivalencesFor } from "./equivalences";

function round(n: number, dp = 3): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export type AssembleInput = {
  hotspots: Hotspot[];
  plan: Plan;
  totals: {
    totalEmissionsKg: number;
    totalEnergyKwh: number;
    averageGridIntensity: number;
    unrankedEmissionsKg: number;
    providerMix: { provider: CloudProvider; emissionsKg: number }[];
  };
  periodLabel: string;
  currency: string;
};

export function assembleReport(input: AssembleInput): Report {
  const { hotspots, plan, totals, periodLabel, currency } = input;

  const diagById = new Map(plan.diagnoses.map((d) => [d.hotspotId, d]));
  const recById = new Map(plan.recommendations.map((r) => [r.hotspotId, r]));

  const reportHotspots: ReportHotspot[] = hotspots.map((h) => {
    const diagnosis = diagById.get(h.id) ?? plan.diagnoses[0];
    const recommendation = recById.get(h.id) ?? plan.recommendations[0];
    const projected = projectedReductionKg(h, recommendation.reductionKey);
    return {
      ...h,
      diagnosis,
      recommendation,
      projectedReductionKg: projected,
      flags: plan.flagsByHotspot[h.id] ?? [],
    };
  });

  // Rank by absolute emissions so the biggest wins sit on top.
  reportHotspots.sort((a, b) => b.emissionsKg - a.emissionsKg);

  const totalProjectedReductionKg = round(
    reportHotspots.reduce((s, h) => s + h.projectedReductionKg, 0),
  );
  const projectedReductionPct =
    totals.totalEmissionsKg > 0
      ? round((totalProjectedReductionKg / totals.totalEmissionsKg) * 100, 1)
      : 0;
  const cleanestRegionOpportunityKg = round(
    reportHotspots.reduce((s, h) => s + (h.cleanerRegion?.reductionKg ?? 0), 0),
  );

  const execSummary = buildExecSummary({
    totalEmissionsKg: totals.totalEmissionsKg,
    averageGridIntensity: totals.averageGridIntensity,
    hotspotCount: reportHotspots.length,
    totalProjectedReductionKg,
    projectedReductionPct,
    topHotspot: reportHotspots[0],
  });

  return {
    periodLabel,
    currency,
    providerMix: totals.providerMix,
    totalEmissionsKg: round(totals.totalEmissionsKg),
    totalEnergyKwh: round(totals.totalEnergyKwh, 2),
    averageGridIntensity: Math.round(totals.averageGridIntensity),
    hotspots: reportHotspots,
    hotspotCount: reportHotspots.length,
    unrankedEmissionsKg: round(totals.unrankedEmissionsKg),
    totalProjectedReductionKg,
    projectedReductionPct,
    cleanestRegionOpportunityKg,
    equivalences: equivalencesFor(totals.totalEmissionsKg),
    execSummary,
  };
}

function buildExecSummary(x: {
  totalEmissionsKg: number;
  averageGridIntensity: number;
  hotspotCount: number;
  totalProjectedReductionKg: number;
  projectedReductionPct: number;
  topHotspot: ReportHotspot | undefined;
}): string {
  if (x.hotspotCount === 0) {
    return "No hotspots cleared the significance floor for this period — the footprint is either small or evenly spread.";
  }
  const tonnes = x.totalEmissionsKg / 1000;
  const total =
    tonnes >= 1 ? `${tonnes.toFixed(2)} tCO2e` : `${x.totalEmissionsKg.toFixed(1)} kgCO2e`;
  const top = x.topHotspot;
  const topClause = top
    ? ` The largest single hotspot is ${top.service} in ${top.regionLabel} (${top.emissionsKg.toFixed(1)} kgCO2e, ${(top.shareOfTotal * 100).toFixed(0)}% of total).`
    : "";
  return (
    `This footprint is ${total} at an emissions-weighted grid intensity of ` +
    `~${Math.round(x.averageGridIntensity)} gCO2e/kWh across ${x.hotspotCount} hotspot` +
    `${x.hotspotCount === 1 ? "" : "s"}.${topClause} ` +
    `The recommended plan projects a reduction of ${x.totalProjectedReductionKg.toFixed(1)} kgCO2e ` +
    `(${x.projectedReductionPct.toFixed(1)}%).`
  );
}
