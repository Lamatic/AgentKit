// Turning judgment into a validated plan. Two entry points:
//   - coercePlan(): defence-in-depth over whatever the flow's LLM nodes return
//     — drop hallucinated hotspot ids, force enums into range, and guarantee
//     every hotspot has exactly one diagnosis + recommendation.
//   - localHeuristicPlan(): a fully deterministic plan used when no Lamatic flow
//     is configured yet, so the dashboard (and the offline eval) work with zero
//     credentials. The flow, once wired, replaces this with real reasoning.

import type {
  CarbonDriverClass,
  Confidence,
  DiagnosisResult,
  Effort,
  Hotspot,
  RecommendationResult,
  ReductionKey,
  Risk,
} from "./types";
import { isKnownReductionKey } from "./savings";

const DRIVER_CLASSES: CarbonDriverClass[] = [
  "dirty-grid",
  "compute-heavy",
  "storage-bloat",
  "egress-heavy",
  "over-provisioned",
  "mixed",
];
const CONFIDENCES: Confidence[] = ["high", "medium", "low"];
const EFFORTS: Effort[] = ["low", "medium", "high"];
const RISKS: Risk[] = ["low", "medium", "high"];

export type Plan = {
  diagnoses: DiagnosisResult[];
  recommendations: RecommendationResult[];
  flagsByHotspot: Record<string, string[]>;
};

function oneOf<T extends string>(value: unknown, allowed: T[], fallback: T): { value: T; coerced: boolean } {
  return typeof value === "string" && (allowed as string[]).includes(value)
    ? { value: value as T, coerced: false }
    : { value: fallback, coerced: true };
}

function defaultDiagnosis(id: string): DiagnosisResult {
  return {
    hotspotId: id,
    driverClass: "mixed",
    confidence: "low",
    evidence: [],
    reasoning: "No diagnosis was returned for this hotspot.",
    rejectedDrivers: [],
  };
}

function defaultRecommendation(id: string): RecommendationResult {
  return {
    hotspotId: id,
    action: "No recommendation was returned for this hotspot.",
    rationale: "",
    effort: "medium",
    risk: "medium",
    prerequisites: [],
    reductionKey: "unknown",
  };
}

// Validate raw LLM output against the known hotspots. Never trusts an id or an
// enum value from the model.
export function coercePlan(
  rawDiagnoses: unknown,
  rawRecommendations: unknown,
  hotspots: Hotspot[],
): Plan {
  const validIds = new Set(hotspots.map((h) => h.id));
  const flagsByHotspot: Record<string, string[]> = {};
  const addFlag = (id: string, flag: string) => {
    (flagsByHotspot[id] ??= []).push(flag);
  };

  const diagByHotspot = new Map<string, DiagnosisResult>();
  for (const raw of Array.isArray(rawDiagnoses) ? rawDiagnoses : []) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const r = raw as Record<string, unknown>;
    const id = String(r.hotspotId ?? "");
    if (!validIds.has(id) || diagByHotspot.has(id)) continue;
    const driver = oneOf<CarbonDriverClass>(r.driverClass, DRIVER_CLASSES, "mixed");
    if (driver.coerced) addFlag(id, "invented-driver");
    diagByHotspot.set(id, {
      hotspotId: id,
      driverClass: driver.value,
      confidence: oneOf<Confidence>(r.confidence, CONFIDENCES, "low").value,
      evidence: Array.isArray(r.evidence) ? r.evidence.map(String).slice(0, 4) : [],
      reasoning: typeof r.reasoning === "string" ? r.reasoning : "",
      rejectedDrivers: Array.isArray(r.rejectedDrivers)
        ? (r.rejectedDrivers as Record<string, unknown>[])
            .map((rd) => ({ driver: String(rd.driver ?? ""), whyNot: String(rd.whyNot ?? "") }))
            .slice(0, 5)
        : [],
    });
  }

  const recByHotspot = new Map<string, RecommendationResult>();
  for (const raw of Array.isArray(rawRecommendations) ? rawRecommendations : []) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const r = raw as Record<string, unknown>;
    const id = String(r.hotspotId ?? "");
    if (!validIds.has(id) || recByHotspot.has(id)) continue;
    let reductionKey = String(r.reductionKey ?? "unknown") as ReductionKey;
    if (!isKnownReductionKey(reductionKey)) {
      reductionKey = "unknown";
      addFlag(id, "unknown-reduction-key");
    }
    recByHotspot.set(id, {
      hotspotId: id,
      action: typeof r.action === "string" ? r.action : "No recommendation suggested.",
      rationale: typeof r.rationale === "string" ? r.rationale : "",
      effort: oneOf<Effort>(r.effort, EFFORTS, "medium").value,
      risk: oneOf<Risk>(r.risk, RISKS, "medium").value,
      prerequisites: Array.isArray(r.prerequisites) ? r.prerequisites.map(String).slice(0, 6) : [],
      reductionKey,
    });
  }

  // Guarantee one diagnosis + recommendation per hotspot, in hotspot order.
  const diagnoses = hotspots.map((h) => diagByHotspot.get(h.id) ?? defaultDiagnosis(h.id));
  const recommendations = hotspots.map((h) => recByHotspot.get(h.id) ?? defaultRecommendation(h.id));

  return { diagnoses, recommendations, flagsByHotspot };
}

// Deterministic fallback plan — used when no flow is configured. Rule-based, so
// it's honest about being a heuristic, not a model's reasoning.
export function localHeuristicPlan(hotspots: Hotspot[]): Plan {
  const diagnoses: DiagnosisResult[] = [];
  const recommendations: RecommendationResult[] = [];

  for (const h of hotspots) {
    const dirtyGrid = h.gridIntensity >= 400;
    let driverClass: CarbonDriverClass;
    if (dirtyGrid) driverClass = "dirty-grid";
    else if (h.usageClass === "compute") driverClass = "compute-heavy";
    else if (h.usageClass === "storage-ssd" || h.usageClass === "storage-hdd") driverClass = "storage-bloat";
    else if (h.usageClass === "network") driverClass = "egress-heavy";
    else driverClass = "mixed";

    diagnoses.push({
      hotspotId: h.id,
      driverClass,
      confidence: "medium",
      evidence: [
        `Region ${h.regionLabel} draws ~${h.gridIntensity} gCO2e/kWh.`,
        `Dominant usage is ${h.usageClass} (${h.usageAmount} ${h.usageUnit}).`,
      ],
      reasoning: "Rule-based diagnosis (no Lamatic flow connected).",
      rejectedDrivers: [],
    });

    let reductionKey: ReductionKey;
    let action: string;
    let effort: Effort;
    let risk: Risk;
    const cleaner = h.cleanerRegion;
    if (cleaner && cleaner.reductionPct >= 60) {
      reductionKey = "region-migration-major";
      action = `Migrate this workload to ${cleaner.regionLabel} (~${cleaner.gridIntensity} gCO2e/kWh).`;
      effort = "high";
      risk = cleaner.crossContinent ? "high" : "medium";
    } else if (cleaner && cleaner.reductionPct >= 20) {
      reductionKey = "region-migration-partial";
      action = `Shift new deployments toward ${cleaner.regionLabel} where latency and residency allow.`;
      effort = "medium";
      risk = "medium";
    } else if (h.usageClass === "compute") {
      reductionKey = "arm-migration";
      action = "Move compute to ARM/Graviton instances and rightsize under-utilised capacity.";
      effort = "medium";
      risk = "low";
    } else if (h.usageClass === "storage-ssd" || h.usageClass === "storage-hdd") {
      reductionKey = "storage-tier";
      action = "Tier cold objects to archival storage and expire stale data with lifecycle rules.";
      effort = "low";
      risk = "low";
    } else {
      reductionKey = "rightsize-moderate";
      action = "Add caching and reduce cross-region/egress transfer.";
      effort = "medium";
      risk = "low";
    }

    recommendations.push({
      hotspotId: h.id,
      action,
      rationale: "Selected by rule from the dominant driver and cleaner-region delta.",
      effort,
      risk,
      prerequisites: [],
      reductionKey,
    });
  }

  return { diagnoses, recommendations, flagsByHotspot: {} };
}
