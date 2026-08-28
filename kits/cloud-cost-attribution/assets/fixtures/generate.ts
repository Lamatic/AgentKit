import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SEED = 424242;
const OUT_DIR = join(__dirname);
const PERIOD_LABEL = "2024-09-01 to 2024-09-28";
const CURRENCY = "USD";

// --- seeded PRNG (mulberry32) — deterministic, no external dependency ---
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const PERIOD_START = Date.UTC(2024, 8, 1, 0, 0, 0); // Sept 1 2024 00:00 UTC
const TOTAL_HOURS = 28 * 24; // 672
const ANALYSIS_START_HOUR = (28 - 7) * 24; // hour index 504 = Sept 22 00:00 UTC

type Profile = {
  key: string;
  serviceName: string;
  serviceCategory: string;
  regionId: string;
  chargeDescription: string;
  resourceType?: string;
  resourceId?: string;
  skuId: string;
  subAccountId: string;
  pricingUnit: string;
  unitPrice: number; // $ per PricingQuantity unit
  baseHourlyCost: number; // weekday-daytime target
};

const PROFILES: Profile[] = [
  {
    key: "s3-get",
    serviceName: "Amazon Simple Storage Service",
    serviceCategory: "Storage",
    regionId: "us-east-1",
    chargeDescription: "$0.004 per 10,000 GET and all other requests",
    resourceType: "bucket",
    resourceId: "arn:aws:s3:::prod-image-layers",
    skuId: "ZWQ6Q48CRJXX4FXE",
    subAccountId: "11353890204",
    pricingUnit: "Requests",
    unitPrice: 0.0000004,
    baseHourlyCost: 18,
  },
  {
    key: "rds-vcpu",
    serviceName: "Amazon Relational Database Service",
    serviceCategory: "Databases",
    regionId: "us-west-2",
    chargeDescription: "USD 0.10 per hour per vCPU running RDS Extended Support for MySQL 5.7 in Year 1, Year 2",
    skuId: "TB3JHXC6ZCYSVN98",
    subAccountId: "46124420288",
    pricingUnit: "vCPU-Hours",
    unitPrice: 0.1,
    baseHourlyCost: 14,
  },
  {
    key: "ddb-rru",
    serviceName: "Amazon DynamoDB",
    serviceCategory: "Databases",
    regionId: "us-west-2",
    chargeDescription: "$0.25 per million read request units (Oregon)",
    skuId: "K6UMRY3TVDVCBP56",
    subAccountId: "69918885631",
    pricingUnit: "ReadRequestUnits",
    unitPrice: 0.00000025,
    baseHourlyCost: 9,
  },
  {
    key: "lambda-compute",
    serviceName: "AWS Lambda",
    serviceCategory: "Compute",
    regionId: "us-east-1",
    chargeDescription: "AWS Lambda - Total Compute - US East (Northern Virginia)-Tier-1",
    skuId: "TG3M4CAGBA3NYQBH",
    subAccountId: "31027794154",
    pricingUnit: "Seconds",
    unitPrice: 0.0000166667,
    baseHourlyCost: 6,
  },
];

type Row = {
  ChargePeriodStart: string;
  ChargePeriodEnd: string;
  BillingCurrency: string;
  EffectiveCost: number;
  BilledCost: number;
  ChargeCategory: string;
  ChargeDescription: string;
  ServiceName: string;
  ServiceCategory: string;
  RegionId: string;
  SubAccountId: string;
  ResourceId?: string;
  ResourceType?: string;
  SkuId?: string;
  PricingQuantity: number;
  PricingUnit: string;
};

function diurnalMultiplier(hourIndex: number, rng: () => number): number {
  const hourOfDay = hourIndex % 24;
  const dayIndex = Math.floor(hourIndex / 24);
  const date = new Date(PERIOD_START + dayIndex * DAY_MS);
  const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
  let base: number;
  if (isWeekend) base = 0.5;
  else base = hourOfDay >= 8 && hourOfDay < 20 ? 1.3 : 0.7;
  const noise = 1 + (rng() - 0.5) * 1.0; // +-50%
  return base * noise;
}

function buildBaseline(): Row[] {
  const rng = mulberry32(SEED);
  const rows: Row[] = [];
  for (const profile of PROFILES) {
    for (let h = 0; h < TOTAL_HOURS; h++) {
      const mult = diurnalMultiplier(h, rng);
      const cost = round(profile.baseHourlyCost * mult);
      const qty = round(cost / profile.unitPrice);
      rows.push(makeRow(profile, h, cost, qty));
    }
  }
  return rows;
}

function makeRow(profile: Profile, hourIndex: number, cost: number, qty: number): Row {
  const start = new Date(PERIOD_START + hourIndex * HOUR_MS);
  const end = new Date(start.getTime() + HOUR_MS);
  return {
    ChargePeriodStart: start.toISOString(),
    ChargePeriodEnd: end.toISOString(),
    BillingCurrency: CURRENCY,
    EffectiveCost: cost,
    BilledCost: round(cost * 1.0),
    ChargeCategory: "Usage",
    ChargeDescription: profile.chargeDescription,
    ServiceName: profile.serviceName,
    ServiceCategory: profile.serviceCategory,
    RegionId: profile.regionId,
    SubAccountId: profile.subAccountId,
    ResourceId: profile.resourceId,
    ResourceType: profile.resourceType,
    SkuId: profile.skuId,
    PricingQuantity: qty,
    PricingUnit: profile.pricingUnit,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function cloneRows(rows: Row[]): Row[] {
  return rows.map((r) => ({ ...r }));
}

function hourIndexOf(iso: string): number {
  return Math.round((new Date(iso).getTime() - PERIOD_START) / HOUR_MS);
}

/** Injects a sharp multi-hour spike into the named profile's rows, scaling qty with cost (usage driver). */
function injectSpike(rows: Row[], profileKey: string, startHourIndex: number, hours: number, multiplier: number): void {
  const profile = PROFILES.find((p) => p.key === profileKey)!;
  for (const row of rows) {
    if (row.ServiceName !== profile.serviceName || row.ChargeDescription !== profile.chargeDescription) continue;
    const hi = hourIndexOf(row.ChargePeriodStart);
    if (hi >= startHourIndex && hi < startHourIndex + hours) {
      row.EffectiveCost = round(row.EffectiveCost * multiplier);
      row.BilledCost = round(row.BilledCost * multiplier);
      row.PricingQuantity = round(row.PricingQuantity * multiplier);
    }
  }
}

/** Injects a sharp multi-hour cost spike WITHOUT scaling qty (rate driver). */
function injectRateSpike(rows: Row[], profileKey: string, startHourIndex: number, hours: number, multiplier: number): void {
  const profile = PROFILES.find((p) => p.key === profileKey)!;
  for (const row of rows) {
    if (row.ServiceName !== profile.serviceName || row.ChargeDescription !== profile.chargeDescription) continue;
    const hi = hourIndexOf(row.ChargePeriodStart);
    if (hi >= startHourIndex && hi < startHourIndex + hours) {
      row.EffectiveCost = round(row.EffectiveCost * multiplier);
      row.BilledCost = round(row.BilledCost * multiplier);
      // PricingQuantity intentionally unchanged — same usage, higher effective rate.
    }
  }
}

/** Injects a sustained, flat level shift across the analysis window (no sharp inflection) — drift. */
function injectDrift(rows: Row[], profileKey: string, windowStartHourIndex: number, windowHours: number, multiplier: number): void {
  const profile = PROFILES.find((p) => p.key === profileKey)!;
  for (const row of rows) {
    if (row.ServiceName !== profile.serviceName || row.ChargeDescription !== profile.chargeDescription) continue;
    const hi = hourIndexOf(row.ChargePeriodStart);
    if (hi >= windowStartHourIndex && hi < windowStartHourIndex + windowHours) {
      row.EffectiveCost = round(row.EffectiveCost * multiplier);
      row.BilledCost = round(row.BilledCost * multiplier);
      row.PricingQuantity = round(row.PricingQuantity * multiplier);
    }
  }
}

const CSV_COLUMNS: (keyof Row)[] = [
  "ChargePeriodStart",
  "ChargePeriodEnd",
  "BillingCurrency",
  "EffectiveCost",
  "BilledCost",
  "ChargeCategory",
  "ChargeDescription",
  "ServiceName",
  "ServiceCategory",
  "RegionId",
  "SubAccountId",
  "ResourceId",
  "ResourceType",
  "SkuId",
  "PricingQuantity",
  "PricingUnit",
];

function csvEscape(v: unknown): string {
  const s = v === undefined || v === null ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: Row[]): string {
  const header = CSV_COLUMNS.join(",");
  const lines = rows.map((r) => CSV_COLUMNS.map((c) => csvEscape(r[c])).join(","));
  return [header, ...lines].join("\n") + "\n";
}

// detector's actual analysisStart = last hour of the period minus 7d (see note above).
const ANALYSIS_START_MS = PERIOD_START + (TOTAL_HOURS - 1) * HOUR_MS - 7 * DAY_MS;

// --- change events: true causes + decoys per taxonomy D1-D4 (SPEC.md §I) ---
const changeEvents = [
  {
    id: "evt-true-dp",
    timestamp: new Date(PERIOD_START + (ANALYSIS_START_HOUR + 3 * 24 + 8) * HOUR_MS).toISOString(),
    type: "deploy",
    title: "migrate image pulls to public registry",
    diffSummary:
      "Switched image pull path in prod-us-east-1 from authenticated ECR pull-through cache to direct public registry pulls; removed local layer cache warmup step.",
    filesTouched: ["infra/ecr/pull-through-cache.tf", "deploy/prod/image-source.yaml"],
    author: "j.chen",
    refs: ["PR-4821"],
  },
  {
    id: "evt-d1-temporal",
    timestamp: new Date(PERIOD_START + (ANALYSIS_START_HOUR + 3 * 24 + 11) * HOUR_MS + 15 * 60_000).toISOString(),
    type: "scale",
    title: "scale checkout-service replicas 4 to 8",
    diffSummary: "Increased checkout-service HPA max replicas due to traffic forecast; no change to storage or registry config.",
    filesTouched: ["k8s/checkout/hpa.yaml"],
    author: "ops-bot",
  },
  {
    id: "evt-d2-direction",
    timestamp: new Date(PERIOD_START + (ANALYSIS_START_HOUR + 3 * 24 + 6) * HOUR_MS).toISOString(),
    type: "config",
    title: "add CloudFront cache headers to static asset responses",
    diffSummary: "Set Cache-Control: max-age=86400 on /assets/* responses to reduce origin GET volume.",
    filesTouched: ["cdn/cloudfront-behaviors.tf"],
    author: "j.chen",
  },
  {
    id: "evt-d3-wrongsvc",
    timestamp: new Date(PERIOD_START + (ANALYSIS_START_HOUR + 3 * 24 + 9) * HOUR_MS + 30 * 60_000).toISOString(),
    type: "infra",
    title: "migrate DynamoDB nightly backups to public S3 bucket",
    diffSummary: "Moved dynamodb-backups export target from a private bucket to a publicly-readable bucket for the analytics team.",
    filesTouched: ["infra/backup/dynamodb-export.tf"],
    author: "s.patel",
  },
  {
    id: "evt-true-drift",
    timestamp: new Date(ANALYSIS_START_MS - 1 * HOUR_MS).toISOString(),
    type: "deploy",
    title: "ship recommendation widget querying full table scan on orders",
    diffSummary:
      "New 'related purchases' widget issues an unindexed scan-heavy query against the orders read replica on every product page view.",
    filesTouched: ["services/reco/widget.go", "services/reco/query.sql"],
    author: "s.patel",
    refs: ["PR-4790"],
  },
  {
    id: "evt-d1d-temporal",
    timestamp: new Date(ANALYSIS_START_MS + 40 * 60_000).toISOString(),
    type: "config",
    title: "rotate RDS parameter group log_statement to all",
    diffSummary: "Enabled verbose statement logging for a debugging session; reverted after 2 hours.",
    filesTouched: ["infra/rds/parameter-group.tf"],
    author: "ops-bot",
  },
  {
    id: "evt-d3d-wrongsvc",
    timestamp: new Date(ANALYSIS_START_MS - 3 * HOUR_MS).toISOString(),
    type: "infra",
    title: "migrate read-replica backups to public S3 bucket",
    diffSummary: "Backup export target changed for the read replica; unrelated to query load.",
    filesTouched: ["infra/backup/rds-export.tf"],
    author: "j.chen",
  },
  {
    id: "evt-d4-abstain-a",
    timestamp: new Date(PERIOD_START + (ANALYSIS_START_HOUR + 4 * 24 + 7) * HOUR_MS + 30 * 60_000).toISOString(),
    type: "config",
    title: "bump DynamoDB table read capacity autoscaling target",
    diffSummary: "Adjusted target utilization for autoscaling on orders-table from 70% to 60%; no measured change in read volume.",
    filesTouched: ["infra/dynamodb/autoscaling.tf"],
    author: "ops-bot",
  },
  {
    id: "evt-d4-abstain-b",
    timestamp: new Date(PERIOD_START + (ANALYSIS_START_HOUR + 4 * 24 + 9) * HOUR_MS + 45 * 60_000).toISOString(),
    type: "deploy",
    title: "roll out client-side pagination for order history",
    diffSummary: "Reduced page size client-side; expected to lower read units, opposite of the observed spike.",
    filesTouched: ["apps/web/order-history.tsx"],
    author: "s.patel",
  },
];

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });

  const baseline = buildBaseline();
  writeFileSync(join(OUT_DIR, "focus-baseline.csv"), toCsv(baseline));

  const clean = cloneRows(baseline);
  writeFileSync(join(OUT_DIR, "case-clean.csv"), toCsv(clean));

  const dataplane = cloneRows(baseline);
  const dpStart = ANALYSIS_START_HOUR + 3 * 24 + 12; // Sept 25 12:00 UTC
  injectSpike(dataplane, "s3-get", dpStart, 4, 22);
  writeFileSync(join(OUT_DIR, "case-dataplane.csv"), toCsv(dataplane));

  const drift = cloneRows(baseline);
  injectDrift(drift, "rds-vcpu", ANALYSIS_START_HOUR, 168, 1.3);
  writeFileSync(join(OUT_DIR, "case-drift.csv"), toCsv(drift));

  const rate = cloneRows(baseline);
  const rateStart = ANALYSIS_START_HOUR + 4 * 24 + 8; // Sept 26 08:00 UTC
  injectRateSpike(rate, "ddb-rru", rateStart, 6, 15);
  writeFileSync(join(OUT_DIR, "case-rate.csv"), toCsv(rate));

  writeFileSync(join(OUT_DIR, "change-events.json"), JSON.stringify(changeEvents, null, 2) + "\n");

  const expected = {
    dataplane: {
      groupKey: "Amazon Simple Storage Service|us-east-1|$0.004 per 10,000 GET and all other requests",
      method: "spike",
      driver: "usage",
      firstInflectionAt: new Date(PERIOD_START + dpStart * HOUR_MS).toISOString(),
      causeEventId: "evt-true-dp",
      decoys: ["evt-d1-temporal", "evt-d2-direction", "evt-d3-wrongsvc"],
    },
    drift: {
      groupKey: "Amazon Relational Database Service|us-west-2|USD 0.10 per hour per vCPU running RDS Extended Support for MySQL 5.7 in Year 1, Year 2",
      method: "drift",
      // detector's analysisStart = maxTs - 7d, where maxTs = last hour of period (23:00 on the
      // final day) — one hour earlier than the round ANALYSIS_START_HOUR boundary used for injection.
      firstInflectionAt: new Date(PERIOD_START + (TOTAL_HOURS - 1) * HOUR_MS - 7 * DAY_MS).toISOString(),
      causeEventId: "evt-true-drift",
      decoys: ["evt-d1d-temporal", "evt-d3d-wrongsvc"],
    },
    rate: {
      groupKey: "Amazon DynamoDB|us-west-2|$0.25 per million read request units (Oregon)",
      method: "spike",
      driver: "rate",
      firstInflectionAt: new Date(PERIOD_START + rateStart * HOUR_MS).toISOString(),
      causeEventId: null,
      decoys: ["evt-d4-abstain-a", "evt-d4-abstain-b"],
    },
    clean: {
      expectedAnomalyCount: 0,
    },
  };
  writeFileSync(join(OUT_DIR, "expected-dataplane.json"), JSON.stringify(expected.dataplane, null, 2) + "\n");
  writeFileSync(join(OUT_DIR, "expected-drift.json"), JSON.stringify(expected.drift, null, 2) + "\n");
  writeFileSync(join(OUT_DIR, "expected-rate.json"), JSON.stringify(expected.rate, null, 2) + "\n");
  writeFileSync(join(OUT_DIR, "expected-clean.json"), JSON.stringify(expected.clean, null, 2) + "\n");

  writeFileSync(join(OUT_DIR, "period-label.json"), JSON.stringify({ periodLabel: PERIOD_LABEL, currency: CURRENCY }, null, 2) + "\n");

  // eslint-disable-next-line no-console
  console.log(`generated fixtures: ${baseline.length} baseline rows x 4 case files, ${changeEvents.length} change events`);
}

main();
