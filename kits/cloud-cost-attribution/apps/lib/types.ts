// FOCUS 1.4 subset this kit consumes.
export type FocusRow = {
  ChargePeriodStart: string; // ISO8601
  ChargePeriodEnd: string; // ISO8601
  BillingCurrency: string;
  EffectiveCost: number;
  BilledCost: number;
  ChargeCategory: "Usage" | "Purchase" | "Tax" | "Credit" | (string & {});
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
  Tags?: string; // JSON string
};

export type ChangeEvent = {
  id: string;
  timestamp: string; // ISO8601Z
  type: "deploy" | "config" | "scale" | "infra";
  title: string;
  diffSummary: string;
  filesTouched: string[];
  author?: string;
  refs?: string[];
};

export type HourlyPoint = { ts: string; cost: number; qty: number };

export type AnomalyEpisode = {
  id: string;
  groupKey: string; // service|region|chargeDescription|subAccount
  service: string;
  region: string;
  subAccount: string;
  skuId?: string;
  resourceType?: string;
  method: "spike" | "drift";
  currentCost: number;
  baselineCost: number;
  deltaAbs: number;
  deltaPct: number;
  shareOfTotalDelta: number;
  robustZ: number;
  firstInflectionAt: string; // ISO8601Z
  quantityDeltaPct: number;
  driver: "usage" | "rate";
  hourlySeries: HourlyPoint[];
};

export type Confidence = "high" | "medium" | "low";

export type AttributionResult = {
  anomalyId: string;
  causeEventId: string | null;
  confidence: Confidence;
  evidence: string[];
  reasoning: string;
  rejectedCandidates: { eventId: string; whyNot: string }[];
};

export type Effort = "low" | "medium" | "high";
export type Risk = "low" | "medium" | "high";

export type SavingsKey =
  | "eliminate-full"
  | "reduce-major"
  | "reduce-partial"
  | "reduce-minor"
  | "one-time-only"
  | "unknown";

export type RemediationResult = {
  anomalyId: string;
  action: string;
  rationale: string;
  effort: Effort;
  risk: Risk;
  prerequisites: string[];
  savingsKey: SavingsKey;
};

export type ReportAnomaly = AnomalyEpisode & {
  attribution: AttributionResult;
  remediation: RemediationResult;
  estimatedMonthlySavings: number;
  flags: string[];
};

export type Report = {
  periodLabel: string;
  currency: string;
  totalCurrent: number;
  totalBaseline: number;
  totalDeltaAbs: number;
  totalDeltaPct: number;
  anomalies: ReportAnomaly[];
  totalEstimatedSavings: number;
  unattributedCount: number;
  execSummary: string;
};
