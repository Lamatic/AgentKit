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
  hasInput: boolean;
  hasOutput: boolean;
  hasTimestamp: boolean;
  hasDuration: boolean;
  hasTokenUsage: boolean;
  hasCost: boolean;
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
  confidenceDetail: ConfidenceDetail;
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
  backtest?: CacheBacktest;
};

export type ConfidenceDetail = {
  level: "high" | "medium" | "low";
  score: number;
  sampleSize: number;
  sampleScore: number;
  recurrenceScore: number;
  stabilityScore: number;
  coverageScore: number;
  recurrenceLowerBound: number;
  stabilityLowerBound: number | null;
  blockers: string[];
  reasons: string[];
};

export type CacheBacktest = {
  target: string;
  calls: number;
  distinctKeys: number;
  repeatedKeys: number;
  eligibleKeys: number;
  cacheHits: number;
  cacheMisses: number;
  outputMismatches: number;
  hitRate: number;
  mismatchRate: number;
  baselineLatencySeconds: number;
  replayLatencySeconds: number;
  latencySavedSeconds: number;
  baselineCost: number;
  replayCost: number;
  costSaved: number;
  lookupLatencySeconds: number;
  passed: boolean;
  gates: string[];
};

export type DataQuality = {
  windowStart: string | null;
  windowEnd: string | null;
  windowHours: number;
  inputCoverage: number;
  outputCoverage: number;
  durationCoverage: number;
  tokenCoverage: number;
  costCoverage: number;
};

export type AnalysisReport = {
  source: {
    rows: number;
    requests: number;
    workflowNames: string[];
    invalidRows: number;
    duplicateRows: number;
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
  dataQuality: DataQuality;
  warnings: string[];
};

export type FlowGraphNode = {
  id: string;
  type: string;
  nodeId: string;
  name: string;
  position: { x: number; y: number };
  values: Record<string, unknown>;
};

export type FlowGraphEdge = {
  id: string;
  source: string;
  target: string;
  type: string;
};

export type FlowGraph = {
  name: string;
  sourceFingerprint: string;
  nodes: FlowGraphNode[];
  edges: FlowGraphEdge[];
};

export type MappedFlowNode = FlowGraphNode & {
  traceNodeName: string | null;
  match: "exact-name" | "normalized-name" | "unmapped";
  calls: number;
  totalSeconds: number;
  totalCost: number;
  latencyShare: number;
  costShare: number;
};

export type MappedFlowEdge = FlowGraphEdge & {
  observedRuns: number;
  shareOfSuccessfulRuns: number;
};

export type FlowMapping = {
  graph: FlowGraph;
  nodes: MappedFlowNode[];
  edges: MappedFlowEdge[];
  mappedNodes: number;
  unmappedFlowNodes: string[];
  unmappedTraceNodes: string[];
};

export type DriftMetric = {
  name: string;
  baseline: number;
  current: number;
  absoluteDelta: number;
  percentDelta: number | null;
  direction: "improved" | "regressed" | "unchanged";
};

export type DriftSignal = {
  id: string;
  severity: "high" | "medium" | "low";
  kind: "latency" | "cost" | "success" | "path" | "node" | "coverage";
  title: string;
  detail: string;
};

export type DriftReport = {
  metrics: DriftMetric[];
  signals: DriftSignal[];
  newPaths: string[];
  removedPaths: string[];
  pathShareChanges: Array<{
    signature: string;
    baselineShare: number;
    currentShare: number;
    delta: number;
  }>;
};

export type FlowPatchOperation = {
  op: "insert-before" | "replace-config" | "extract-subflow" | "add-shadow-branch";
  targetNodeId: string | null;
  targetNodeName: string;
  incomingEdgeIds: string[];
  description: string;
  artifactPath: string | null;
};

export type OptimizationManifest = {
  schemaVersion: "1.0";
  generatedAt: string;
  source: {
    workflow: string;
    flowFingerprint: string | null;
    requests: number;
    successfulRuns: number;
    windowStart: string | null;
    windowEnd: string | null;
  };
  candidate: {
    id: string;
    type: CandidateType;
    target: string;
    targetNodeId: string | null;
    confidence: ConfidenceDetail;
  };
  evidence: string[];
  backtest: CacheBacktest | null;
  operations: FlowPatchOperation[];
  validationPlan: string[];
  rollbackCondition: string;
  importReady: false;
  approvalRequired: true;
};

export type WorkloadBenchmark = {
  name: string;
  uniqueInputs: number;
  totalRequests: number;
  baselineCalls: number;
  optimizedCalls: number;
  cacheHits: number;
  outputAgreement: number;
  baselineMilliseconds: number;
  optimizedMilliseconds: number;
  speedup: number;
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
