export type Level = "low" | "medium" | "high";
export type EvidenceStatus = "supported" | "uncertain" | "unsupported";
export type RecommendationStatus = "proceed" | "pilot" | "revise" | "stop";

export interface PremortemInput {
  decision: string;
  context: string;
  constraints: string;
  timeHorizon: string;
}

export interface PremortemResult {
  decisionSummary: string;
  assumptions: Array<{
    assumption: string;
    evidenceStatus: EvidenceStatus;
    rationale: string;
    fastestTest: string;
  }>;
  failureModes: Array<{
    failureMode: string;
    likelihood: Level;
    impact: Level;
    warningSignals: string[];
    mitigation: string;
    ownerRole: string;
  }>;
  experiments: Array<{
    hypothesis: string;
    method: string;
    successMetric: string;
    stopCondition: string;
    estimatedEffort: string;
    timebox: string;
  }>;
  recommendation: {
    status: RecommendationStatus;
    rationale: string;
    confidence: Level;
  };
  nextActions: string[];
}
