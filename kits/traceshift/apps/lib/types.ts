export type CsvRow = Record<string, string>;

export type TraceNode = {
  requestId: string;
  name: string;
  slug: string;
  nodeType: string;
  timestamp: number;
  durationSeconds: number;
  tokens: number;
  cost: number;
  inputFingerprint: string;
  inputShape: string;
  outputFingerprint: string;
};

export type Execution = {
  requestId: string;
  workflowName: string;
  status: "success" | "failed";
  durationSeconds: number;
  tokens: number;
  cost: number;
  path: string[];
  pathSignature: string;
  nodes: TraceNode[];
};

export type PathAggregate = {
  signature: string;
  nodes: string[];
  runs: number;
  successRuns: number;
  successRate: number;
  shareOfSuccessfulRuns: number;
  p50Seconds: number;
  p95Seconds: number;
  totalCost: number;
};

export type NodeAggregate = {
  name: string;
  nodeType: string;
  calls: number;
  runs: number;
  totalSeconds: number;
  averageSeconds: number;
  latencyShare: number;
  tokens: number;
  cost: number;
  costShare: number;
  uniqueInputs: number;
  uniqueInputShapes: number;
  uniqueOutputs: number;
  outputStability: number;
};

export type CandidateType =
  | "exact-cache"
  | "deterministic-code"
  | "model-rightsize"
  | "reusable-subflow";

export type OptimizationCandidate = {
  id: string;
  type: CandidateType;
  title: string;
  target: string;
  summary: string;
  confidence: "high" | "medium" | "low";
  score: number;
  affectedRuns: number;
  recurrenceRate: number;
  outputStability: number | null;
  measuredLatencySeconds: number;
  measuredCost: number;
  estimatedWindowLatencySavingsSeconds: number;
  estimatedWindowCostSavings: number;
  evidence: string[];
  assumptions: string[];
  validationPlan: string[];
  risk: string;
};

export type AnalysisReport = {
  source: {
    rows: number;
    requests: number;
    workflowNames: string[];
    invalidRows: number;
  };
  metrics: {
    successfulRuns: number;
    failedRuns: number;
    successRate: number;
    p50Seconds: number;
    p95Seconds: number;
    totalTokens: number;
    totalCost: number;
  };
  executions: Execution[];
  paths: PathAggregate[];
  nodes: NodeAggregate[];
  candidates: OptimizationCandidate[];
  warnings: string[];
};

export type AdvisorProposal = {
  title: string;
  recommendation: string;
  rationale: string;
  evidence: string[];
  risks: string[];
  validationPlan: string[];
  rollbackCondition: string;
  confidence: "low" | "medium" | "high";
  approvalRequired: boolean;
};
