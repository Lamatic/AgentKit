// Cloud Carbon Advisor — shared types.
//
// The vocabulary here is deliberately split into two halves:
//   1. Everything the Next.js app computes deterministically from a usage
//      export and the emissions-factor tables (FocusUsageRow → FootprintLine
//      → Hotspot). No model is involved; every number is arithmetic.
//   2. Everything the Lamatic flow contributes as *judgment* (Diagnosis,
//      Recommendation). A flow node never returns a gram of CO2e — it returns
//      a driver class and a reduction lever, and the assemble node prices it.

export type CloudProvider = "aws" | "gcp" | "azure" | "unknown";

// The subset of the FinOps FOCUS 1.x columns this kit consumes. A real export
// has ~50 columns; carbon accounting needs only usage, unit, service, region.
export type FocusUsageRow = {
  provider: CloudProvider;
  serviceName: string;
  serviceCategory: string; // Compute | Storage | Networking | Database | ...
  regionId: string;
  subAccountId: string;
  skuId?: string;
  resourceType?: string;
  chargePeriodStart: string; // ISO8601
  chargePeriodEnd: string; // ISO8601
  pricingUnit: string; // e.g. "vCPU-Hours", "GB-Month", "GB"
  pricingQuantity: number;
  billedCost?: number;
  billingCurrency?: string;
};

// How a usage line is metered, which decides its energy coefficient.
export type UsageClass =
  | "compute"
  | "memory"
  | "storage-ssd"
  | "storage-hdd"
  | "network"
  | "other";

export type CleanerRegionOption = {
  region: string;
  regionLabel: string;
  gridIntensity: number; // gCO2e/kWh
  emissionsKgIfMigrated: number;
  reductionKg: number;
  reductionPct: number; // 0..100
  crossContinent: boolean; // a latency / data-residency caveat, surfaced honestly
};

// One aggregated unit of footprint: a (provider, service, region, usageClass)
// bucket with its energy, grid intensity, and resulting emissions.
export type FootprintLine = {
  id: string;
  groupKey: string;
  provider: CloudProvider;
  service: string;
  serviceCategory: string;
  region: string;
  regionLabel: string;
  subAccount: string;
  usageClass: UsageClass;
  usageAmount: number;
  usageUnit: string;
  energyKwh: number;
  pue: number;
  gridIntensity: number; // gCO2e/kWh
  emissionsKg: number; // kgCO2e for the billing period
  cleanerRegion?: CleanerRegionOption;
};

// A hotspot is the top-level thing the user acts on: one line (or merged set of
// lines) responsible for a meaningful share of total emissions.
export type Hotspot = {
  id: string;
  groupKey: string;
  provider: CloudProvider;
  service: string;
  serviceCategory: string;
  region: string;
  regionLabel: string;
  subAccount: string;
  usageClass: UsageClass;
  usageAmount: number;
  usageUnit: string;
  energyKwh: number;
  pue: number;
  gridIntensity: number;
  emissionsKg: number;
  shareOfTotal: number; // 0..1
  cleanerRegion?: CleanerRegionOption;
};

export type Confidence = "high" | "medium" | "low";
export type Effort = "low" | "medium" | "high";
export type Risk = "low" | "medium" | "high";

// The dominant reason a hotspot emits what it does — the flow's Diagnose node.
export type CarbonDriverClass =
  | "dirty-grid" // the region's grid is carbon-intensive; the workload itself may be fine
  | "compute-heavy" // large sustained compute; efficiency/rightsizing is the lever
  | "storage-bloat" // large volumes of stored data, much of it likely cold
  | "egress-heavy" // data transfer / networking dominates
  | "over-provisioned" // capacity far exceeds need
  | "mixed"; // no single driver dominates

export type DiagnosisResult = {
  hotspotId: string;
  driverClass: CarbonDriverClass;
  confidence: Confidence;
  evidence: string[];
  reasoning: string;
  rejectedDrivers: { driver: string; whyNot: string }[];
};

// The reduction lever, as a *bucket* — never a number. The assemble node maps
// the bucket to a fixed multiplier and computes the projected saving itself.
export type ReductionKey =
  | "region-migration-major"
  | "region-migration-partial"
  | "rightsize-major"
  | "rightsize-moderate"
  | "schedule-shift"
  | "storage-tier"
  | "arm-migration"
  | "eliminate-full"
  | "none"
  | "unknown";

export type RecommendationResult = {
  hotspotId: string;
  action: string;
  rationale: string;
  effort: Effort;
  risk: Risk;
  prerequisites: string[];
  reductionKey: ReductionKey;
};

export type ReportHotspot = Hotspot & {
  diagnosis: DiagnosisResult;
  recommendation: RecommendationResult;
  projectedReductionKg: number;
  flags: string[]; // e.g. "invented-driver", "unknown-reduction-key"
};

export type Equivalences = {
  // Relatable framings for a kg-CO2e total. Every one is a fixed divisor.
  flightsLondonNewYork: number; // economy seat, one-way
  treeSeedlings10yr: number; // seedlings grown for 10 years to sequester it
  gasolineCarMiles: number; // avg passenger vehicle
  smartphoneCharges: number;
};

export type Report = {
  periodLabel: string;
  currency: string;
  providerMix: { provider: CloudProvider; emissionsKg: number }[];
  totalEmissionsKg: number;
  totalEnergyKwh: number;
  averageGridIntensity: number; // emissions-weighted gCO2e/kWh
  hotspots: ReportHotspot[];
  hotspotCount: number;
  unrankedEmissionsKg: number; // everything below the hotspot floor
  totalProjectedReductionKg: number;
  projectedReductionPct: number; // 0..100
  cleanestRegionOpportunityKg: number; // deterministic best-case migration saving
  equivalences: Equivalences;
  execSummary: string;
};
