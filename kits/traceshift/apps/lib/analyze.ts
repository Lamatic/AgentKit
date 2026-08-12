import Papa from "papaparse";
import type {
  AnalysisReport,
  CsvRow,
  Execution,
  NodeAggregate,
  OptimizationCandidate,
  PathAggregate,
  TraceNode,
} from "./types";

const MAX_ROWS = 100_000;
const EMPTY_FINGERPRINT = "none";

const field = (row: CsvRow, ...names: string[]): string => {
  const lookup = new Map(
    Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value ?? ""]),
  );
  for (const name of names) {
    const value = lookup.get(name.toLowerCase());
    if (value !== undefined) return String(value).trim();
  }
  return "";
};

const numberFrom = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const parseJson = (value: string): unknown => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  }
  return value;
};

const stableString = (value: unknown): string => JSON.stringify(stableValue(value));

const fingerprint = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return EMPTY_FINGERPRINT;
  const text = stableString(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fp_${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

const shape = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.length ? [shape(value[0])] : [];
  if (value === null) return "null";
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, shape(item)]),
    );
  }
  return typeof value;
};

const getNumericKey = (value: unknown, keys: string[]): number | null => {
  if (!value || typeof value !== "object") return null;
  const entries = Object.entries(value as Record<string, unknown>);
  for (const [key, item] of entries) {
    if (keys.includes(key.toLowerCase()) && typeof item === "number" && Number.isFinite(item)) {
      return item;
    }
  }
  for (const [, item] of entries) {
    const nested = getNumericKey(item, keys);
    if (nested !== null) return nested;
  }
  return null;
};

const tokensFrom = (value: string): number => {
  const parsed = parseJson(value);
  const total = getNumericKey(parsed, ["total_tokens", "totaltokens", "tokens"]);
  if (total !== null) return total;
  const prompt = getNumericKey(parsed, ["prompt_tokens", "input_tokens", "inputtokens"]) ?? 0;
  const completion =
    getNumericKey(parsed, ["completion_tokens", "output_tokens", "outputtokens"]) ?? 0;
  return prompt + completion;
};

const costFrom = (value: string): number => {
  const parsed = parseJson(value);
  return (
    getNumericKey(parsed, ["total_cost", "totalcost", "cost", "model_cost", "modelcost"]) ?? 0
  );
};

const quantile = (values: number[], percentile: number): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

const rounded = (value: number, digits = 3): number => Number(value.toFixed(digits));

const eventType = (row: CsvRow): "started" | "node" | "finished" | "unknown" => {
  const value = field(row, "execution_type", "executionType", "event_message", "eventMessage").toLowerCase();
  if (value.includes("finishedexecution")) return "finished";
  if (value.includes("startedexecution")) return "started";
  if (value.includes("nodeexecution")) return "node";
  return "unknown";
};

const executionStatus = (rows: CsvRow[]): "success" | "failed" => {
  for (const row of rows) {
    const statusText = field(row, "status").toLowerCase();
    const severity = field(row, "severity_text", "severityText").toLowerCase();
    const statusNumber = Number(statusText);
    if (
      severity === "error" ||
      severity === "fatal" ||
      statusText === "failed" ||
      statusText === "failure" ||
      (Number.isFinite(statusNumber) && statusNumber >= 400)
    ) {
      return "failed";
    }
  }
  return "success";
};

const toNode = (row: CsvRow, requestId: string, index: number): TraceNode => {
  const input = parseJson(field(row, "input", "body"));
  const output = parseJson(field(row, "output", "results"));
  const rawTimestamp = Date.parse(field(row, "timestamp"));
  return {
    requestId,
    name: field(row, "nodeName", "node_name") || field(row, "nodeSlug", "node_slug") || "Unnamed node",
    slug: field(row, "nodeSlug", "node_slug"),
    nodeType: field(row, "nodeId", "node_id") || "unknown",
    timestamp: Number.isFinite(rawTimestamp) ? rawTimestamp : index,
    durationSeconds: numberFrom(field(row, "timeTakenSeconds", "time_taken_seconds")),
    tokens: tokensFrom(field(row, "model_usage", "modelUsage")),
    cost: costFrom(field(row, "model_cost", "modelCost")),
    inputFingerprint: fingerprint(input),
    inputShape: fingerprint(shape(input)),
    outputFingerprint: fingerprint(output),
  };
};

const buildExecutions = (rows: CsvRow[]): Execution[] => {
  const grouped = new Map<string, CsvRow[]>();
  rows.forEach((row, index) => {
    const requestId = field(row, "requestId", "request_id") || `missing-${index}`;
    grouped.set(requestId, [...(grouped.get(requestId) ?? []), row]);
  });

  return [...grouped.entries()].map(([requestId, requestRows]) => {
    const nodeRows = requestRows.filter((row) => {
      const event = eventType(row);
      return event === "node" || (event === "unknown" && Boolean(field(row, "nodeName", "nodeSlug")));
    });
    const nodes = nodeRows
      .map((row, index) => toNode(row, requestId, index))
      .sort((a, b) => a.timestamp - b.timestamp);
    const finishRow = requestRows.find((row) => eventType(row) === "finished");
    const durationSeconds = finishRow
      ? numberFrom(field(finishRow, "timeTakenSeconds", "time_taken_seconds"))
      : nodes.reduce((sum, node) => sum + node.durationSeconds, 0);
    const path = nodes.map((node) => node.name);
    return {
      requestId,
      workflowName: field(requestRows[0], "workflowName", "workflow_name") || "Unknown workflow",
      status: executionStatus(requestRows),
      durationSeconds: rounded(durationSeconds),
      tokens: nodes.reduce((sum, node) => sum + node.tokens, 0),
      cost: rounded(nodes.reduce((sum, node) => sum + node.cost, 0), 6),
      path,
      pathSignature: path.length ? path.join(" → ") : "No node spans",
      nodes,
    };
  });
};

const aggregatePaths = (executions: Execution[]): PathAggregate[] => {
  const successfulRuns = executions.filter((run) => run.status === "success").length;
  const grouped = new Map<string, Execution[]>();
  executions.forEach((run) => grouped.set(run.pathSignature, [...(grouped.get(run.pathSignature) ?? []), run]));
  return [...grouped.entries()]
    .map(([signature, runs]) => {
      const successful = runs.filter((run) => run.status === "success");
      return {
        signature,
        nodes: runs[0].path,
        runs: runs.length,
        successRuns: successful.length,
        successRate: runs.length ? successful.length / runs.length : 0,
        shareOfSuccessfulRuns: successfulRuns ? successful.length / successfulRuns : 0,
        p50Seconds: rounded(quantile(successful.map((run) => run.durationSeconds), 0.5)),
        p95Seconds: rounded(quantile(successful.map((run) => run.durationSeconds), 0.95)),
        totalCost: rounded(successful.reduce((sum, run) => sum + run.cost, 0), 6),
      };
    })
    .sort((a, b) => b.successRuns - a.successRuns || b.runs - a.runs);
};

const aggregateNodes = (successful: Execution[]): NodeAggregate[] => {
  const allNodes = successful.flatMap((run) => run.nodes);
  const totalSeconds = allNodes.reduce((sum, node) => sum + node.durationSeconds, 0);
  const totalCost = allNodes.reduce((sum, node) => sum + node.cost, 0);
  const grouped = new Map<string, TraceNode[]>();
  allNodes.forEach((node) => grouped.set(node.name, [...(grouped.get(node.name) ?? []), node]));

  return [...grouped.entries()]
    .map(([name, nodes]) => {
      const seconds = nodes.reduce((sum, node) => sum + node.durationSeconds, 0);
      const cost = nodes.reduce((sum, node) => sum + node.cost, 0);
      const uniqueOutputs = new Set(nodes.map((node) => node.outputFingerprint)).size;
      const stability = nodes.length <= 1 ? 0 : 1 - (uniqueOutputs - 1) / (nodes.length - 1);
      return {
        name,
        nodeType: nodes[0].nodeType,
        calls: nodes.length,
        runs: new Set(nodes.map((node) => node.requestId)).size,
        totalSeconds: rounded(seconds),
        averageSeconds: rounded(seconds / nodes.length),
        latencyShare: totalSeconds ? seconds / totalSeconds : 0,
        tokens: nodes.reduce((sum, node) => sum + node.tokens, 0),
        cost: rounded(cost, 6),
        costShare: totalCost ? cost / totalCost : 0,
        uniqueInputs: new Set(nodes.map((node) => node.inputFingerprint)).size,
        uniqueInputShapes: new Set(nodes.map((node) => node.inputShape)).size,
        uniqueOutputs,
        outputStability: Math.max(0, stability),
      };
    })
    .sort((a, b) => b.totalSeconds - a.totalSeconds);
};

const confidenceFor = (evidenceCount: number, totalRuns: number): "high" | "medium" | "low" => {
  if (evidenceCount >= 8 && totalRuns >= 20) return "high";
  if (evidenceCount >= 4 && totalRuns >= 10) return "medium";
  return "low";
};

const buildCandidates = (
  successful: Execution[],
  nodes: NodeAggregate[],
  paths: PathAggregate[],
): OptimizationCandidate[] => {
  const candidates: OptimizationCandidate[] = [];
  const totalRuns = successful.length;
  const nodeCalls = successful.flatMap((run) => run.nodes);

  for (const aggregate of nodes) {
    if (/graphql|response/i.test(aggregate.nodeType) || /api request|api response/i.test(aggregate.name)) continue;
    const calls = nodeCalls.filter((node) => node.name === aggregate.name);
    const byInput = new Map<string, TraceNode[]>();
    calls.forEach((call) => {
      if (call.inputFingerprint !== EMPTY_FINGERPRINT) {
        byInput.set(call.inputFingerprint, [...(byInput.get(call.inputFingerprint) ?? []), call]);
      }
    });
    const repeatedGroups = [...byInput.values()].filter((group) => group.length >= 2);
    const stableRepeatedGroups = repeatedGroups.filter(
      (group) => new Set(group.map((call) => call.outputFingerprint)).size === 1,
    );
    const stableCalls = stableRepeatedGroups.reduce((sum, group) => sum + group.length, 0);
    const redundantCalls = stableRepeatedGroups.reduce((sum, group) => sum + group.length - 1, 0);
    const conditionalStability = repeatedGroups.length
      ? stableCalls / repeatedGroups.reduce((sum, group) => sum + group.length, 0)
      : 0;

    if (redundantCalls >= 3 && conditionalStability >= 0.98) {
      const redundantLatency = aggregate.averageSeconds * redundantCalls;
      const redundantCost = aggregate.calls ? (aggregate.cost / aggregate.calls) * redundantCalls : 0;
      candidates.push({
        id: `cache-${fingerprint(aggregate.name)}`,
        type: "exact-cache",
        title: `Cache exact repeats at ${aggregate.name}`,
        target: aggregate.name,
        summary:
          "Add a cache keyed only by the normalized exact node input. The observed repeated inputs produced identical output fingerprints.",
        confidence: confidenceFor(redundantCalls, totalRuns),
        score: rounded(
          Math.min(100, 36 + redundantCalls * 2 + aggregate.latencyShare * 35 + aggregate.costShare * 25),
          0,
        ),
        affectedRuns: new Set(stableRepeatedGroups.flat().map((call) => call.requestId)).size,
        recurrenceRate: totalRuns ? stableCalls / totalRuns : 0,
        outputStability: conditionalStability,
        measuredLatencySeconds: rounded(redundantLatency),
        measuredCost: rounded(redundantCost, 6),
        estimatedWindowLatencySavingsSeconds: rounded(redundantLatency * 0.9),
        estimatedWindowCostSavings: rounded(redundantCost * 0.95, 6),
        evidence: [
          `${stableCalls} calls belonged to exact-input repeat groups across ${stableRepeatedGroups.length} cache keys.`,
          `The repeated groups had ${(conditionalStability * 100).toFixed(0)}% identical output fingerprints.`,
          `Redundant calls consumed ${redundantLatency.toFixed(2)} measured seconds and $${redundantCost.toFixed(4)} in the uploaded window.`,
        ],
        assumptions: [
          "Cache keys use the complete normalized input, never input shape alone.",
          "The scenario estimate assumes a 90% latency reduction and 95% model-cost reduction on cache hits.",
          "Cache invalidation must include every external dependency or version that can change the output.",
        ],
        validationPlan: [
          "Replay every observed cache key and verify byte-equivalent normalized outputs.",
          "Run the cache in shadow mode and compare hit outputs with live outputs.",
          "Enable a kill switch and roll back on the first output mismatch.",
        ],
        risk: "A missing cache-key dependency could serve stale or contextually wrong output.",
      });
    }

    const looksLikeLlm = /llm|instructor/i.test(aggregate.nodeType);
    if (
      looksLikeLlm &&
      aggregate.calls >= 10 &&
      aggregate.uniqueInputs >= 4 &&
      aggregate.outputStability >= 0.7
    ) {
      candidates.push({
        id: `code-${fingerprint(aggregate.name)}`,
        type: "deterministic-code",
        title: `Test a deterministic boundary for ${aggregate.name}`,
        target: aggregate.name,
        summary:
          "The model node maps varied inputs into a small repeated output set. Prototype explicit rules in a Code Node, with the current model kept as fallback.",
        confidence: confidenceFor(aggregate.calls, totalRuns),
        score: rounded(
          Math.min(100, 24 + aggregate.outputStability * 32 + aggregate.latencyShare * 25 + aggregate.costShare * 25),
          0,
        ),
        affectedRuns: aggregate.runs,
        recurrenceRate: totalRuns ? aggregate.runs / totalRuns : 0,
        outputStability: aggregate.outputStability,
        measuredLatencySeconds: aggregate.totalSeconds,
        measuredCost: aggregate.cost,
        estimatedWindowLatencySavingsSeconds: rounded(aggregate.totalSeconds * 0.8),
        estimatedWindowCostSavings: rounded(aggregate.cost * 0.95, 6),
        evidence: [
          `${aggregate.calls} calls used ${aggregate.uniqueInputs} unique inputs but only ${aggregate.uniqueOutputs} output fingerprints.`,
          `The node represented ${(aggregate.latencyShare * 100).toFixed(1)}% of measured node time.`,
          `The node consumed ${aggregate.tokens.toLocaleString()} tokens and $${aggregate.cost.toFixed(4)} in the uploaded window.`,
        ],
        assumptions: [
          "Repeated output fingerprints represent a finite routing or classification contract.",
          "The scenario estimate assumes deterministic code removes 80% of node latency and 95% of model cost.",
          "The existing model remains a fallback for unknown or ambiguous cases.",
        ],
        validationPlan: [
          "Derive rules from a training subset and freeze them before evaluation.",
          "Compare rule and model outputs on a held-out trace subset.",
          "Ship in shadow mode and require a pre-agreed equivalence threshold before routing traffic.",
        ],
        risk: "Low output diversity can hide semantic differences; fingerprint repetition alone does not prove rule equivalence.",
      });
    }

    if (looksLikeLlm && aggregate.calls >= 5 && (aggregate.costShare >= 0.25 || aggregate.latencyShare >= 0.25)) {
      candidates.push({
        id: `model-${fingerprint(aggregate.name)}`,
        type: "model-rightsize",
        title: `Benchmark a smaller model at ${aggregate.name}`,
        target: aggregate.name,
        summary:
          "This node dominates observed latency or model cost. Run an offline quality comparison against a cheaper/faster model before changing production.",
        confidence: confidenceFor(aggregate.calls, totalRuns),
        score: rounded(Math.min(100, 18 + aggregate.latencyShare * 35 + aggregate.costShare * 30), 0),
        affectedRuns: aggregate.runs,
        recurrenceRate: totalRuns ? aggregate.runs / totalRuns : 0,
        outputStability: aggregate.outputStability,
        measuredLatencySeconds: aggregate.totalSeconds,
        measuredCost: aggregate.cost,
        estimatedWindowLatencySavingsSeconds: rounded(aggregate.totalSeconds * 0.15),
        estimatedWindowCostSavings: rounded(aggregate.cost * 0.25, 6),
        evidence: [
          `${aggregate.name} accounted for ${(aggregate.latencyShare * 100).toFixed(1)}% of measured node time.`,
          `${aggregate.name} accounted for ${(aggregate.costShare * 100).toFixed(1)}% of recorded model cost.`,
          `${aggregate.calls} observed calls used ${aggregate.tokens.toLocaleString()} tokens.`,
        ],
        assumptions: [
          "The estimate is a conservative scenario of 15% lower latency and 25% lower cost, not a measured result.",
          "Candidate models must support the same output contract and context requirements.",
        ],
        validationPlan: [
          "Build a representative trace-derived evaluation set with payloads redacted.",
          "Compare correctness, structured-output validity, p95 latency, and cost.",
          "Canary the candidate model and roll back on any quality or schema regression.",
        ],
        risk: "A smaller model can degrade correctness even when aggregate latency and cost improve.",
      });
    }
  }

  for (const path of paths) {
    const internalNodes = path.nodes.filter((name) => !/api request|api response/i.test(name));
    if (path.successRuns >= 5 && internalNodes.length >= 3 && path.shareOfSuccessfulRuns >= 0.25) {
      candidates.push({
        id: `subflow-${fingerprint(path.signature)}`,
        type: "reusable-subflow",
        title: "Extract the dominant path as a reusable subflow",
        target: internalNodes.join(" → "),
        summary:
          "The same multi-node sequence dominates successful production runs. Extracting it can make the contract, ownership, and future optimization boundary explicit.",
        confidence: confidenceFor(path.successRuns, totalRuns),
        score: rounded(Math.min(100, 22 + path.shareOfSuccessfulRuns * 45 + internalNodes.length * 3), 0),
        affectedRuns: path.successRuns,
        recurrenceRate: path.shareOfSuccessfulRuns,
        outputStability: null,
        measuredLatencySeconds: rounded(path.p50Seconds * path.successRuns),
        measuredCost: path.totalCost,
        estimatedWindowLatencySavingsSeconds: 0,
        estimatedWindowCostSavings: 0,
        evidence: [
          `${path.successRuns} successful runs (${(path.shareOfSuccessfulRuns * 100).toFixed(1)}%) followed this exact path.`,
          `The path's measured p50 latency was ${path.p50Seconds.toFixed(2)}s and p95 was ${path.p95Seconds.toFixed(2)}s.`,
          `The repeated path contains ${internalNodes.length} internal nodes.`,
        ],
        assumptions: [
          "Subflow extraction is a maintainability proposal; no latency or cost savings are claimed.",
          "Inputs, outputs, error behavior, and observability must remain equivalent.",
        ],
        validationPlan: [
          "Define the subflow input/output contract from the observed boundary.",
          "Replay the current path and extracted subflow against the same fixtures.",
          "Confirm trace correlation and error propagation before replacing the path.",
        ],
        risk: "An incomplete boundary contract can change error handling or hide useful node-level observability.",
      });
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
};

export function analyzeTraceCsv(csv: string): AnalysisReport {
  if (!csv.trim()) throw new Error("The trace export is empty.");
  const parsed = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });
  if (parsed.data.length > MAX_ROWS) {
    throw new Error(`This export has more than ${MAX_ROWS.toLocaleString()} rows. Split it into a smaller window.`);
  }
  const fields = new Set((parsed.meta.fields ?? []).map((name) => name.toLowerCase()));
  if (!fields.has("requestid") && !fields.has("request_id")) {
    throw new Error("Missing requestId column. Export traces from Lamatic Logs → Traces → Export CSV.");
  }
  if (!fields.has("event_message") && !fields.has("eventmessage")) {
    throw new Error("Missing event_message column. This does not look like a Lamatic trace export.");
  }

  const rows = parsed.data.filter((row) => Object.values(row).some((value) => String(value).trim()));
  const executions = buildExecutions(rows);
  const successful = executions.filter((run) => run.status === "success");
  const failed = executions.filter((run) => run.status === "failed");
  const paths = aggregatePaths(executions);
  const nodes = aggregateNodes(successful);
  const totalTokens = successful.reduce((sum, run) => sum + run.tokens, 0);
  const totalCost = successful.reduce((sum, run) => sum + run.cost, 0);
  const warnings: string[] = [];
  if (!totalTokens) warnings.push("No model token usage was recorded in this export.");
  if (!totalCost) warnings.push("No model cost was recorded; cost-based estimates are unavailable.");
  if (failed.length) warnings.push(`${failed.length} failed request(s) were excluded from optimization mining.`);
  if (parsed.errors.length) warnings.push(`${parsed.errors.length} malformed CSV row(s) were ignored or repaired by the parser.`);
  if (successful.length < 10) warnings.push("Fewer than 10 successful runs: treat every proposal as preliminary.");

  return {
    source: {
      rows: rows.length,
      requests: executions.length,
      workflowNames: [...new Set(executions.map((run) => run.workflowName))],
      invalidRows: parsed.errors.length,
    },
    metrics: {
      successfulRuns: successful.length,
      failedRuns: failed.length,
      successRate: executions.length ? successful.length / executions.length : 0,
      p50Seconds: rounded(quantile(successful.map((run) => run.durationSeconds), 0.5)),
      p95Seconds: rounded(quantile(successful.map((run) => run.durationSeconds), 0.95)),
      totalTokens,
      totalCost: rounded(totalCost, 6),
    },
    executions,
    paths,
    nodes,
    candidates: buildCandidates(successful, nodes, paths),
    warnings,
  };
}
