import type {
  AnalysisReport,
  FlowMapping,
  FlowPatchOperation,
  OptimizationCandidate,
  OptimizationManifest,
} from "./types";

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

const targetNode = (candidate: OptimizationCandidate, mapping?: FlowMapping | null) => {
  if (!mapping) return null;
  const exact = mapping.nodes.find((node) => node.traceNodeName === candidate.target);
  if (exact) return exact;
  const targetParts = candidate.target.split(" → ");
  return mapping.nodes.find((node) => targetParts.includes(node.traceNodeName ?? node.name)) ?? null;
};

const operationFor = (
  candidate: OptimizationCandidate,
  mapping?: FlowMapping | null,
): FlowPatchOperation => {
  const node = targetNode(candidate, mapping);
  const incomingEdgeIds = mapping?.edges
    .filter((edge) => edge.target === node?.id)
    .map((edge) => edge.id) ?? [];
  if (candidate.type === "exact-cache") {
    return {
      op: "insert-before",
      targetNodeId: node?.id ?? null,
      targetNodeName: candidate.target,
      incomingEdgeIds,
      description: "Insert a review-only cache boundary before the target and preserve the original node as a miss/fallback path.",
      artifactPath: `scripts/${slug(candidate.target)}-cache-boundary.ts`,
    };
  }
  if (candidate.type === "model-rightsize") {
    return {
      op: "add-shadow-branch",
      targetNodeId: node?.id ?? null,
      targetNodeName: candidate.target,
      incomingEdgeIds,
      description: "Add a shadow model branch for offline/canary comparison without changing the production response path.",
      artifactPath: null,
    };
  }
  if (candidate.type === "deterministic-code") {
    return {
      op: "insert-before",
      targetNodeId: node?.id ?? null,
      targetNodeName: candidate.target,
      incomingEdgeIds,
      description: "Insert a deterministic Code Node with the current model retained as fallback for unknown cases.",
      artifactPath: `scripts/${slug(candidate.target)}-deterministic-boundary.ts`,
    };
  }
  return {
    op: "extract-subflow",
    targetNodeId: node?.id ?? null,
    targetNodeName: candidate.target,
    incomingEdgeIds,
    description: "Extract the repeated path behind an explicit input/output boundary and verify equivalent error propagation.",
    artifactPath: `flows/${slug(candidate.target)}-subflow.ts`,
  };
};

export function buildOptimizationManifest(
  report: AnalysisReport,
  candidate: OptimizationCandidate,
  mapping?: FlowMapping | null,
  generatedAt = new Date().toISOString(),
): OptimizationManifest {
  const node = targetNode(candidate, mapping);
  return {
    schemaVersion: "1.0",
    generatedAt,
    source: {
      workflow: report.source.workflowNames.join(", "),
      flowFingerprint: mapping?.graph.sourceFingerprint ?? null,
      requests: report.source.requests,
      successfulRuns: report.metrics.successfulRuns,
      windowStart: report.dataQuality.windowStart,
      windowEnd: report.dataQuality.windowEnd,
    },
    candidate: {
      id: candidate.id,
      type: candidate.type,
      target: candidate.target,
      targetNodeId: node?.id ?? null,
      confidence: candidate.confidenceDetail,
    },
    evidence: candidate.evidence,
    backtest: candidate.backtest ?? null,
    operations: [operationFor(candidate, mapping)],
    validationPlan: candidate.validationPlan,
    rollbackCondition:
      candidate.type === "exact-cache"
        ? "Disable the cache on any output mismatch, stale-data report, or latency regression above 5%."
        : "Restore the original graph on any correctness, schema, latency, or error-propagation regression.",
    importReady: false,
    approvalRequired: true,
  };
}

export function buildProposedFlowDiff(manifest: OptimizationManifest): string {
  const operation = manifest.operations[0];
  const targetId = operation.targetNodeId ?? "UNMAPPED_NODE_REQUIRES_REVIEW";
  const backtest = manifest.backtest;
  const lines = [
    `--- flow/current.ts`,
    `+++ flow/proposed.review-only.ts`,
    `@@ ${operation.targetNodeName} (${targetId}) @@`,
    `+ proposal.operation = ${JSON.stringify(operation.op)}`,
    `+ proposal.targetNodeId = ${JSON.stringify(operation.targetNodeId)}`,
    `+ proposal.incomingEdgeIds = ${JSON.stringify(operation.incomingEdgeIds)}`,
    `+ proposal.description = ${JSON.stringify(operation.description)}`,
  ];
  if (operation.artifactPath) lines.push(`+ proposal.artifact = ${JSON.stringify(operation.artifactPath)}`);
  if (backtest) {
    lines.push(
      `+ evidence.cacheHits = ${backtest.cacheHits}`,
      `+ evidence.outputMismatches = ${backtest.outputMismatches}`,
      `+ evidence.measuredReplayLatencySavedSeconds = ${backtest.latencySavedSeconds}`,
      `+ evidence.measuredReplayCostSaved = ${backtest.costSaved}`,
    );
  }
  lines.push(
    `! This is a proposed patch manifest, not an automatically importable or deployed flow.`,
    `! Human review and the listed validation gates are mandatory.`,
  );
  return lines.join("\n");
}

export function buildCacheBoundaryScript(manifest: OptimizationManifest): string | null {
  if (manifest.candidate.type !== "exact-cache" || !manifest.backtest) return null;
  return `type CacheEntry<T> = { value: T; expiresAt: number };

const cache = new Map<string, CacheEntry<unknown>>();

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return \`[\${value.map(canonical).join(",")}]\`;
  if (value && typeof value === "object") {
    return \`{\${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => \`\${JSON.stringify(key)}:\${canonical(item)}\`)
      .join(",")}}\`;
  }
  return JSON.stringify(value);
};

export async function reviewOnlyCacheBoundary<T>(
  input: unknown,
  invokeOriginal: () => Promise<T>,
  ttlMs = 60_000,
): Promise<{ value: T; cacheStatus: "hit" | "miss" }> {
  const key = canonical(input);
  const existing = cache.get(key) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAt > Date.now()) {
    return { value: existing.value, cacheStatus: "hit" };
  }
  const value = await invokeOriginal();
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return { value, cacheStatus: "miss" };
}
`;
}
