// Offline eval — `npm run eval`. No network, no model, no credentials. Every
// assertion here is about the deterministic half of the kit: the emissions
// arithmetic, the classifier, the cleaner-region math, the savings pricing, and
// the defence-in-depth coercion of model output. If this passes, every number a
// report can show is reproducible from the usage export alone.

import { readFileSync } from "node:fs";
import { parseFocusCsv, FocusParseError } from "./parse-focus";
import { classifyUsage, cleanestRegionForProvider } from "./emissions-factors";
import { computeFootprintLines, buildHotspots, averageGridIntensity } from "./compute-emissions";
import { projectedReductionKg, REDUCTION_MULTIPLIER, isKnownReductionKey } from "./savings";
import { equivalencesFor } from "./equivalences";
import { coercePlan, localHeuristicPlan } from "./plan";
import { assembleReport } from "./assemble";
import { sanitizeCsvCell } from "./validate-upload";
import type { FocusUsageRow, Hotspot } from "./types";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function ok(name: string, cond: boolean): void {
  if (cond) {
    passed++;
  } else {
    failed++;
    failures.push(name);
  }
}

function near(name: string, actual: number, expected: number, tol = 0.01): void {
  ok(`${name} (got ${actual}, want ~${expected})`, Math.abs(actual - expected) <= tol);
}

function row(overrides: Partial<FocusUsageRow>): FocusUsageRow {
  return {
    provider: "aws",
    serviceName: "Amazon EC2",
    serviceCategory: "Compute",
    regionId: "us-east-1",
    subAccountId: "acct-1",
    skuId: undefined,
    resourceType: undefined,
    chargePeriodStart: "2026-07-01",
    chargePeriodEnd: "2026-07-31",
    pricingUnit: "vCPU-Hours",
    pricingQuantity: 1000,
    billedCost: 100,
    billingCurrency: "USD",
    ...overrides,
  };
}

// ── S1. Numeric integrity: emissions = energy × PUE × intensity / 1000 ──────
{
  // us-east-1 = 379 gCO2e/kWh, AWS PUE 1.135, compute 0.0021 kWh/vCPU-h.
  const [line] = computeFootprintLines([row({ pricingQuantity: 1000 })]);
  near("S1 compute energy kWh", line.energyKwh, 2.1, 0.0001);
  near("S1 compute emissions kg", line.emissionsKg, 0.903, 0.005);

  const [arm] = computeFootprintLines([row({ skuId: "c7g.2xlarge", pricingQuantity: 1000 })]);
  near("S1 ARM coefficient applied", arm.energyKwh, 1.26, 0.0001);
  ok("S1 ARM emits less than x86", arm.emissionsKg < line.emissionsKg);

  const [store] = computeFootprintLines([
    row({ serviceName: "Amazon S3", serviceCategory: "Storage", pricingUnit: "GB-Month", skuId: "StandardStorage", pricingQuantity: 1000 }),
  ]);
  near("S1 storage GB-Month energy", store.energyKwh, 0.876, 0.0005);

  const [net] = computeFootprintLines([
    row({ serviceName: "Amazon CloudFront", serviceCategory: "Networking", pricingUnit: "GB", skuId: "DataTransfer-Out", pricingQuantity: 1000 }),
  ]);
  near("S1 network GB energy", net.energyKwh, 1.0, 0.0001);
}

// ── S2. Classifier maps categories/units/SKUs correctly ─────────────────────
{
  ok("S2 compute", classifyUsage({ serviceCategory: "Compute", pricingUnit: "vCPU-Hours" }).usageClass === "compute");
  ok("S2 storage ssd", classifyUsage({ serviceCategory: "Storage", pricingUnit: "GB-Month", skuId: "StandardStorage" }).usageClass === "storage-ssd");
  ok("S2 storage cold→hdd", classifyUsage({ serviceCategory: "Storage", pricingUnit: "GB-Month", skuId: "GlacierArchive" }).usageClass === "storage-hdd");
  ok("S2 network", classifyUsage({ serviceCategory: "Networking", pricingUnit: "GB", skuId: "DataTransfer" }).usageClass === "network");
  ok("S2 ARM detection", classifyUsage({ serviceCategory: "Compute", pricingUnit: "vCPU-Hours", skuId: "m6g.large" }).coefficient < classifyUsage({ serviceCategory: "Compute", pricingUnit: "vCPU-Hours", skuId: "m6i.large" }).coefficient);
  ok("S2 unknown→other, zero energy", classifyUsage({ serviceCategory: "Other", pricingUnit: "Requests" }).coefficient === 0);
  ok("S2 GB-Mo alias → monthly storage", classifyUsage({ serviceCategory: "Storage", pricingUnit: "GB-Mo", skuId: "StandardStorage" }).normalizedUnit === "GB-Month");
  ok("S2 GB-Seconds compute → other (no vCPU conversion)", classifyUsage({ serviceCategory: "Serverless", pricingUnit: "GB-Seconds", skuId: "lambda" }).usageClass === "other");
  ok("S2 compute Hrs unit → compute", classifyUsage({ serviceCategory: "Compute", pricingUnit: "Hrs" }).usageClass === "compute");
  ok("S2 compute Requests unit → other (not mis-priced as vCPU)", classifyUsage({ serviceCategory: "Compute", pricingUnit: "Requests" }).usageClass === "other");
}

// ── S3. Cleaner-region math + ceiling is the cleanest same-provider region ──
{
  const [line] = computeFootprintLines([row({ regionId: "us-east-1", pricingQuantity: 1000 })]);
  const cleaner = line.cleanerRegion;
  ok("S3 cleaner region exists", Boolean(cleaner));
  ok("S3 cleaner region is aws cleanest (eu-north-1)", cleaner?.region === "eu-north-1");
  ok("S3 cleaner flagged cross-continent", cleaner?.crossContinent === true);
  ok("S3 reduction ~98%", (cleaner?.reductionPct ?? 0) > 97 && (cleaner?.reductionPct ?? 0) < 99);
  ok("S3 cleanest aws == eu-north-1", cleanestRegionForProvider("aws")?.code === "eu-north-1");
  ok("S3 already-clean region has no cleaner option", computeFootprintLines([row({ regionId: "eu-north-1" })])[0].cleanerRegion === undefined);
}

// ── S4. Determinism ─────────────────────────────────────────────────────────
{
  const rows = [row({ regionId: "ap-south-1" }), row({ regionId: "us-east-1", serviceName: "Amazon S3", serviceCategory: "Storage", pricingUnit: "GB-Month" })];
  const a = JSON.stringify(computeFootprintLines(rows));
  const b = JSON.stringify(computeFootprintLines(rows));
  ok("S4 footprint is deterministic", a === b);
}

// ── S5. Savings pricing: buckets → numbers; region-migration uses real delta ─
{
  const h = { id: "h1", emissionsKg: 200, cleanerRegion: { reductionKg: 150 } } as unknown as Hotspot;
  near("S5 region-migration-major uses computed delta", projectedReductionKg(h, "region-migration-major"), 150);
  near("S5 region-migration-partial halves it", projectedReductionKg(h, "region-migration-partial"), 75);
  near("S5 rightsize-moderate uses multiplier", projectedReductionKg(h, "rightsize-moderate"), 200 * REDUCTION_MULTIPLIER["rightsize-moderate"]);
  near("S5 none saves nothing", projectedReductionKg(h, "none"), 0);
  ok("S5 known key recognised", isKnownReductionKey("storage-tier"));
  ok("S5 unknown key rejected", !isKnownReductionKey("teleport-datacenter"));
}

// ── S6. Coercion is defence-in-depth over model output ──────────────────────
{
  const hotspots = [{ id: "a" }, { id: "b" }] as unknown as Hotspot[];
  const plan = coercePlan(
    [
      { hotspotId: "a", driverClass: "not-a-real-driver", confidence: "high" },
      { hotspotId: "ghost", driverClass: "dirty-grid" },
    ],
    [{ hotspotId: "a", reductionKey: "teleport", action: "x" }],
    hotspots,
  );
  ok("S6 one diagnosis per hotspot", plan.diagnoses.length === 2);
  ok("S6 invented driver coerced to mixed", plan.diagnoses.find((d) => d.hotspotId === "a")?.driverClass === "mixed");
  ok("S6 invented driver flagged", (plan.flagsByHotspot["a"] ?? []).includes("invented-driver"));
  ok("S6 hallucinated hotspot id dropped", !plan.diagnoses.some((d) => d.hotspotId === "ghost"));
  ok("S6 unknown reduction key coerced", plan.recommendations.find((r) => r.hotspotId === "a")?.reductionKey === "unknown");
  ok("S6 unknown key flagged", (plan.flagsByHotspot["a"] ?? []).includes("unknown-reduction-key"));
  ok("S6 missing hotspot gets default recommendation", plan.recommendations.find((r) => r.hotspotId === "b")?.reductionKey === "unknown");

  // Non-object entries in model output must be skipped, not crash coercePlan.
  ok(
    "S6 non-object model entries skipped without throwing",
    (() => {
      try {
        const p = coercePlan([null, "x", 5, ["a"], { hotspotId: "a" }], [], [{ id: "a" }] as unknown as Hotspot[]);
        return p.diagnoses.length === 1 && p.diagnoses[0].hotspotId === "a";
      } catch {
        return false;
      }
    })(),
  );
}

// ── S7. Equivalences are fixed, cited divisors ──────────────────────────────
{
  const eq = equivalencesFor(1000);
  near("S7 flights = kg/500", eq.flightsLondonNewYork, 2, 0.001);
  ok("S7 tree seedlings = round(kg/60)", eq.treeSeedlings10yr === Math.round(1000 / 60));
  ok("S7 car miles = round(kg/0.398)", eq.gasolineCarMiles === Math.round(1000 / 0.398));
  ok("S7 zero → zero", equivalencesFor(0).flightsLondonNewYork === 0);
}

// ── S8. Security: CSV-injection payloads are neutralised ─────────────────────
{
  ok("S8 formula prefix neutralised", sanitizeCsvCell("=SUM(A1)").startsWith("'"));
  ok("S8 at-prefix neutralised", sanitizeCsvCell("@cmd").startsWith("'"));
  ok("S8 benign cell untouched", sanitizeCsvCell("Amazon EC2") === "Amazon EC2");
}

// ── S9. Full pipeline over the shipped fixture reconciles + ranks ────────────
{
  const csv = readFileSync(new URL("../public/sample-usage.csv", import.meta.url), "utf8");
  const rows = parseFocusCsv(csv);
  ok("S9 fixture parsed", rows.length >= 12);

  const lines = computeFootprintLines(rows);
  const { hotspots, totalEmissionsKg, unrankedEmissionsKg } = buildHotspots(lines);
  ok("S9 hotspots found", hotspots.length > 0);
  ok("S9 Mumbai compute is the top hotspot", hotspots[0].region === "ap-south-1");
  ok("S9 top hotspot is dirty-grid region", hotspots[0].gridIntensity >= 400);

  const rankedKg = hotspots.reduce((s, h) => s + h.emissionsKg, 0);
  near("S9 totals reconcile (ranked + unranked = total)", rankedKg + unrankedEmissionsKg, totalEmissionsKg, 0.5);
  ok("S9 weighted grid intensity is sane", averageGridIntensity(lines) > 0 && averageGridIntensity(lines) < 1000);

  // Both plan sources assemble into a valid report of the same shape.
  for (const [label, plan] of [
    ["heuristic", localHeuristicPlan(hotspots)],
    ["coerced-empty", coercePlan([], [], hotspots)],
  ] as const) {
    const report = assembleReport({
      hotspots,
      plan,
      totals: {
        totalEmissionsKg,
        totalEnergyKwh: lines.reduce((s, l) => s + l.energyKwh, 0),
        averageGridIntensity: averageGridIntensity(lines),
        unrankedEmissionsKg,
        providerMix: [],
      },
      periodLabel: "July 2026",
      currency: "USD",
    });
    ok(`S9 ${label} report has one plan entry per hotspot`, report.hotspots.every((h) => h.diagnosis && h.recommendation));
    ok(`S9 ${label} projected reduction ≤ total`, report.totalProjectedReductionKg <= report.totalEmissionsKg + 0.001);
    ok(`S9 ${label} exec summary written`, report.execSummary.length > 20);
  }
}

// ── S10. Parser rejects garbage clearly ─────────────────────────────────────
{
  let threw = false;
  try {
    parseFocusCsv("not,a,valid\nfile,with,noheaders");
  } catch (e) {
    threw = e instanceof FocusParseError;
  }
  ok("S10 missing required columns → FocusParseError", threw);

  const plusRows = parseFocusCsv("ServiceName,RegionId,PricingUnit,PricingQuantity\nEC2,us-east-1,vCPU-Hours,+10");
  ok("S10 leading-plus quantity parses to number (not sanitized to NaN)", plusRows.length === 1 && plusRows[0].pricingQuantity === 10);
}

// ── Report ──────────────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\nCloud Carbon Advisor — offline eval`);
console.log(`${passed}/${total} assertions passed.`);
if (failed > 0) {
  console.log(`\nFAILED:`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`All checks passed — every number a report shows is reproducible from usage data alone.\n`);
