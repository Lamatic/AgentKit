import { Lamatic } from "lamatic";
import { z } from "zod";

import {
  AGENT_CONTRACT_VERSION,
  MAX_EXPERIMENTS,
  reviewerOutputSchema,
  strategistDecisionSchema,
  strategistStrategySchema,
  type ReviewerInput,
  type ReviewerOutput,
  type RunMode,
  type StrategistDecision,
  type StrategistInput,
} from "./contracts";

const MAX_UPSTREAM_LOG_MESSAGE_LENGTH = 500;

function sanitizeUpstreamMessage(value: string): string {
  return value
    .replace(/[\r\n\t]+/g, " ")
    .replace(
      /((?:authorization|api[-_ ]?key|access[-_ ]?token|token|secret|password)\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      "$1[REDACTED]",
    )
    .replace(/\b(?:SELECT|WITH|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b[\s\S]*/i, "[SQL REDACTED]")
    .trim()
    .slice(0, MAX_UPSTREAM_LOG_MESSAGE_LENGTH);
}

function upstreamErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  const record = payload as Record<string, unknown>;
  const errors = Array.isArray(record.errors) ? record.errors : [];
  const firstError = errors[0];
  if (firstError && typeof firstError === "object" && !Array.isArray(firstError)) {
    const message = (firstError as Record<string, unknown>).message;
    if (typeof message === "string") return sanitizeUpstreamMessage(message);
  }
  for (const key of ["message", "error"]) {
    if (typeof record[key] === "string") return sanitizeUpstreamMessage(record[key]);
  }
  return undefined;
}

function logUpstreamFailure(
  flowName: string,
  response: Response,
  message: string,
): void {
  console.error("[Lamatic upstream request failed]", {
    flow: flowName,
    httpStatus: response.status,
    httpStatusText: response.statusText,
    requestId: response.headers.get("x-request-id")
      ?? response.headers.get("x-lamatic-request-id")
      ?? response.headers.get("cf-ray")
      ?? undefined,
    message: sanitizeUpstreamMessage(message),
  });
}

function unwrapFlowResult(value: unknown): unknown {
  let current = value;
  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const record = current as Record<string, unknown>;
    const next = record.output ?? record.result ?? record.data;
    if (!next || next === current) break;
    current = next;
  }
  return current;
}

function getLiveClient(): Lamatic {
  const endpoint = process.env.LAMATIC_API_URL?.trim();
  const projectId = process.env.LAMATIC_PROJECT_ID?.trim();
  const apiKey = process.env.LAMATIC_API_KEY?.trim();

  if (!endpoint || !projectId || !apiKey) {
    throw new Error("Live mode needs LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY.");
  }

  let parsedEndpoint: URL;
  try {
    parsedEndpoint = new URL(endpoint);
  } catch {
    throw new Error("LAMATIC_API_URL must be a valid HTTPS URL.");
  }
  if (parsedEndpoint.protocol !== "https:") {
    throw new Error("LAMATIC_API_URL must use HTTPS before credentials can be sent.");
  }

  return new Lamatic({ endpoint: parsedEndpoint.toString(), projectId, apiKey });
}

function ensureLiveEnabled(): void {
  if (process.env.SQL_TUNER_ALLOW_LIVE !== "true") {
    throw new Error("Live Lamatic calls are disabled. Set SQL_TUNER_ALLOW_LIVE=true.");
  }
}

async function executeLiveFlow(
  flowName: string,
  flowId: string | undefined,
  input: object,
  signal?: AbortSignal,
): Promise<unknown> {
  ensureLiveEnabled();
  if (!flowId?.trim()) throw new Error(`Live mode needs ${flowName}.`);
  const liveClient = getLiveClient();
  // lamatic@0.3.2 does not accept an AbortSignal in executeFlow. Keep this
  // SDK-authenticated transport so cancellation reaches the network request.
  const response = await fetch(liveClient.endpoint, {
    method: "POST",
    headers: liveClient.getHeaders(),
    body: JSON.stringify({
      query: `query ExecuteWorkflow($workflowId: String!, $payload: JSON!) {
        executeWorkflow(workflowId: $workflowId, payload: $payload) {
          status
          result
        }
      }`,
      variables: { workflowId: flowId, payload: input },
    }),
    cache: "no-store",
    redirect: "error",
    signal,
  });
  const responseText = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(responseText);
  } catch {
    logUpstreamFailure(flowName, response, "Lamatic returned a non-JSON response.");
    throw new Error(`Lamatic ${flowName} request returned invalid JSON.`);
  }
  if (!response.ok) {
    logUpstreamFailure(
      flowName,
      response,
      upstreamErrorMessage(payload) ?? "Lamatic returned no structured error message.",
    );
    throw new Error(`Lamatic ${flowName} request failed with HTTP ${response.status}.`);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(`Lamatic ${flowName} request returned an invalid response.`);
  }
  const graphqlResponse = payload as {
    data?: { executeWorkflow?: unknown };
    errors?: Array<{ message?: unknown }>;
  };
  if (graphqlResponse.errors?.length) {
    const message = graphqlResponse.errors[0]?.message;
    logUpstreamFailure(
      flowName,
      response,
      typeof message === "string" ? message : "Lamatic returned an unknown GraphQL error.",
    );
    throw new Error(`Lamatic ${flowName} request failed: ${typeof message === "string" ? message : "Unknown error."}`);
  }
  const raw = graphqlResponse.data?.executeWorkflow;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const flowResponse = raw as unknown as Record<string, unknown>;
    if (flowResponse.status === "error" || flowResponse.result === null) {
      const message = typeof flowResponse.message === "string"
        ? flowResponse.message
        : "Lamatic returned an empty result.";
      logUpstreamFailure(flowName, response, message);
      throw new Error(`Lamatic ${flowName} request failed: ${message}`);
    }
  }
  return unwrapFlowResult(raw);
}

const scalarCsvSchema = z.union([z.string(), z.number()]).optional().default("");

const strategistEnvelopeSchema = z.object({
  action: z.enum(["create_index", "rewrite_query", "conclude"]),
  strategy: strategistStrategySchema,
  hypothesis: z.string().optional().default(""),
  expectedPlanChange: z.string().optional().default(""),
  sql: z.string().optional().default(""),
  indexSql: z.string().optional().default(""),
  adaptation: z.object({
    learnedFromEvidence: z.string().optional().default("No prior measured evidence was available."),
    differsFromPrevious: z.string().optional().default("This is the first proposed experiment."),
    respondsToExperiment: z.coerce.number().int().nonnegative().optional().default(0),
  }).optional().default({}),
  stopCondition: z.string().optional().default("Stop if the candidate is unsafe, changes results, or is not at least 1.10x faster."),
  conclusionCode: z.enum([
    "winner_found",
    "budget_exhausted",
    "no_safe_distinct_experiment",
    "insufficient_evidence",
  ]).optional().default("insufficient_evidence"),
  reasoning: z.string().optional().default("The strategist concluded the bounded search."),
  evidenceUsedCsv: scalarCsvSchema,
});

function parseEvidenceCsv(value: string | number): number[] {
  return String(value)
    .split(",")
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item, index, all) => Number.isInteger(item) && item > 0 && item <= MAX_EXPERIMENTS
      && all.indexOf(item) === index);
}

function parseReviewerEvidenceCsv(value: string | number): number[] {
  const csv = String(value).trim();
  if (!csv) return [];
  const entries = csv.split(",").map((item) => item.trim());
  if (entries.some((item) => !/^\d+$/.test(item))) {
    throw new Error("Lamatic reviewer returned malformed experiment citations.");
  }
  return entries
    .map(Number)
    .filter((item, index, all) => all.indexOf(item) === index);
}

function normalizeStrategistDecision(value: unknown): StrategistDecision {
  const envelope = strategistEnvelopeSchema.parse(value);
  if (envelope.action === "conclude") {
    return strategistDecisionSchema.parse({
      contractVersion: AGENT_CONTRACT_VERSION,
      action: envelope.action,
      strategy: "conclude",
      conclusionCode: envelope.conclusionCode,
      reasoning: envelope.reasoning,
      evidenceUsed: parseEvidenceCsv(envelope.evidenceUsedCsv),
    });
  }

  const respondsToExperiment = envelope.adaptation.respondsToExperiment > 0
    ? envelope.adaptation.respondsToExperiment
    : undefined;
  return strategistDecisionSchema.parse({
    contractVersion: AGENT_CONTRACT_VERSION,
    action: envelope.action,
    strategy: envelope.strategy,
    hypothesis: envelope.hypothesis,
    expectedPlanChange: envelope.expectedPlanChange,
    ...(envelope.action === "create_index" ? { indexSql: envelope.indexSql } : { sql: envelope.sql }),
    adaptation: {
      learnedFromEvidence: envelope.adaptation.learnedFromEvidence,
      differsFromPrevious: envelope.adaptation.differsFromPrevious,
      respondsToExperiment,
    },
    stopConditions: [envelope.stopCondition],
  });
}

async function callStrategist(input: StrategistInput, signal?: AbortSignal): Promise<StrategistDecision> {
  const raw = await executeLiveFlow(
    "SQL_TUNER_STRATEGIST_FLOW_ID",
    process.env.SQL_TUNER_STRATEGIST_FLOW_ID,
    input,
    signal,
  );
  return normalizeStrategistDecision(raw);
}

function demoDecision(input: StrategistInput): StrategistDecision {
  if (input.experiments.length > 0 || input.remainingExperiments === 0) {
    const improved = input.experiments.find((experiment) => experiment.verdict === "improved");
    return {
      contractVersion: AGENT_CONTRACT_VERSION,
      action: "conclude",
      strategy: "conclude",
      conclusionCode: input.remainingExperiments === 0 ? "budget_exhausted" : "no_safe_distinct_experiment",
      reasoning: improved
        ? `The measured experiment produced a proven ${improved.speedup?.toFixed(2)}x speedup.`
        : "The bounded demo planner has no additional distinct high-confidence experiment.",
      evidenceUsed: input.experiments.map((experiment) => experiment.number),
    };
  }

  const tableMatch = input.originalQuery.match(/\bfrom\s+([A-Za-z_][A-Za-z0-9_]*)/i);
  const table = input.schema.find(
    (candidate) => candidate.name.toLowerCase() === tableMatch?.[1]?.toLowerCase(),
  );
  if (!table) return {
    contractVersion: AGENT_CONTRACT_VERSION,
    action: "conclude",
    strategy: "conclude",
    conclusionCode: "insufficient_evidence",
    reasoning: "No unambiguous base table was found.",
    evidenceUsed: [],
  };

  const whereColumn = input.originalQuery.match(/\bwhere\s+([A-Za-z_][A-Za-z0-9_.]*)\s*(?:=|>=|<=|>|<|between\b)/i)?.[1]?.split(".").pop();
  const groupColumns = input.originalQuery.match(/\bgroup\s+by\s+([^;]+)/i)?.[1]
    ?.split(/\border\s+by\b/i)[0]
    .split(",")
    .map((column) => column.trim().split(".").pop() ?? "") ?? [];
  const aggregateColumns = Array.from(
    input.originalQuery.matchAll(/\b(?:sum|avg|min|max)\s*\(\s*([A-Za-z_][A-Za-z0-9_.]*)\s*\)/gi),
  )
    .map((match) => match[1].split(".").pop() ?? "");
  const available = new Set(table.columns.map((column) => column.name.toLowerCase()));
  const columns = [whereColumn, ...groupColumns, ...aggregateColumns]
    .filter((column): column is string => Boolean(column))
    .filter((column, index, all) => all.findIndex((item) => item.toLowerCase() === column.toLowerCase()) === index)
    .filter((column) => available.has(column.toLowerCase()));

  if (!whereColumn || columns.length === 0) {
    return {
      contractVersion: AGENT_CONTRACT_VERSION,
      action: "conclude",
      strategy: "conclude",
      conclusionCode: "no_safe_distinct_experiment",
      reasoning: "The demo planner could not derive a safe index candidate.",
      evidenceUsed: [],
    };
  }

  const indexName = `idx_${table.name}_${columns.join("_")}`.replace(/[^A-Za-z0-9_]/g, "_").slice(0, 60);
  return {
    contractVersion: AGENT_CONTRACT_VERSION,
    action: "create_index",
    strategy: "filter_first_index",
    hypothesis: `Indexing ${columns.join(", ")} should replace the full scan with an index search and cover the selected values.`,
    expectedPlanChange: `SCAN ${table.name} -> SEARCH ${table.name} USING COVERING INDEX`,
    indexSql: `CREATE INDEX ${indexName} ON ${table.name}(${columns.join(", ")});`,
    adaptation: {
      learnedFromEvidence: "No prior experiment evidence exists, so this tests the most selective safe index candidate.",
      differsFromPrevious: "This is the first proposed experiment.",
    },
    stopConditions: ["Stop if results differ or the candidate is not at least 1.10x faster."],
  };
}

export const reviewerEnvelopeSchema = z.object({
  outcome: z.enum(["improved", "no_proven_improvement"]),
  headline: z.string().min(1),
  evidenceSummary: z.string().min(1),
  recommendation: z.string().min(1),
  limitationsText: z.string().min(1),
  citedExperimentsCsv: scalarCsvSchema,
});

export function normalizeReviewerOutput(raw: unknown, input: ReviewerInput): ReviewerOutput {
  const envelope = reviewerEnvelopeSchema.parse(raw);
  const expectedOutcome = input.deterministicOutcome === "no-proven-improvement"
    ? "no_proven_improvement"
    : "improved";
  if (envelope.outcome !== expectedOutcome) {
    throw new Error("Lamatic reviewer contradicted the deterministic outcome.");
  }
  const citedExperiments = parseReviewerEvidenceCsv(envelope.citedExperimentsCsv);
  const availableExperiments = new Set(input.experiments.map((experiment) => experiment.number));
  if (citedExperiments.some((number) => !availableExperiments.has(number))) {
    throw new Error("Lamatic reviewer cited an experiment that was not supplied.");
  }
  if (
    input.deterministicOutcome === "improved"
    && input.winningExperimentNumber
    && !citedExperiments.includes(input.winningExperimentNumber)
  ) {
    throw new Error("Lamatic reviewer did not cite the deterministic winning experiment.");
  }
  const winner = input.experiments.find(
    (experiment) => experiment.number === input.winningExperimentNumber,
  );
  return reviewerOutputSchema.parse({
    contractVersion: AGENT_CONTRACT_VERSION,
    headline: envelope.headline,
    evidenceSummary: envelope.evidenceSummary,
    recommendation: winner
      ? `Use experiment ${winner.number}: ${winner.candidateSql}`
      : "Keep the original query.",
    limitations: [envelope.limitationsText],
    citedExperiments,
  });
}

async function callReviewer(input: ReviewerInput, signal?: AbortSignal): Promise<ReviewerOutput> {
  const payload = {
    originalQuery: input.originalQuery,
    baseline: input.baseline,
    experiments: input.experiments,
    deterministicOutcome: input.deterministicOutcome === "no-proven-improvement"
      ? "no_proven_improvement"
      : "improved",
    winningExperimentNumber: input.winningExperimentNumber ?? 0,
  };
  const raw = await executeLiveFlow(
    "SQL_TUNER_REVIEWER_FLOW_ID",
    process.env.SQL_TUNER_REVIEWER_FLOW_ID,
    payload,
    signal,
  );
  return normalizeReviewerOutput(raw, input);
}

function demoReview(input: ReviewerInput): ReviewerOutput {
  const winner = input.experiments.find((experiment) => experiment.number === input.winningExperimentNumber);
  return {
    contractVersion: AGENT_CONTRACT_VERSION,
    headline: winner
      ? `Experiment ${winner.number} produced a proven ${winner.speedup?.toFixed(2)}x speedup`
      : "No measured improvement was proven",
    evidenceSummary: winner
      ? `${winner.summary} The complete bounded result remained equivalent to the baseline.`
      : `${input.experiments.length} bounded experiment${input.experiments.length === 1 ? " was" : "s were"} evaluated without a proven winner.`,
    recommendation: winner ? `Use the measured candidate: ${winner.candidateSql}` : "Keep the original query.",
    limitations: ["Confirm local sandbox measurements on representative production data."],
    citedExperiments: input.experiments.map((experiment) => experiment.number),
  };
}

export async function chooseNextExperiment(
  mode: RunMode,
  input: StrategistInput,
  signal?: AbortSignal,
): Promise<StrategistDecision> {
  return mode === "live" ? callStrategist(input, signal) : demoDecision(input);
}

export async function reviewTuningOutcome(
  mode: RunMode,
  input: ReviewerInput,
  signal?: AbortSignal,
): Promise<ReviewerOutput> {
  return mode === "live" ? callReviewer(input, signal) : demoReview(input);
}
