import "server-only";

import type {
  ConfidenceLevel,
  MigrationPipelineResult,
  ReleaseStatus,
  RiskLevel,
  StrategyType,
} from "@/types/migrationPipeline";

// The deployed Lamatic flow is triggered from the Chat Widget and expects
// the user's text under the `chatMessage` field. Forward the editor SQL
// as `chatMessage` so the flow receives the same logical input as the
// Lamatic chatbot.
export const LAMATIC_FLOW_INPUT_FIELD = "chatMessage" as const;

type LamaticWorkflowResponse = {
  data?: {
    executeWorkflow?: {
      result?: unknown;
      status?: string;
    };
  };
  errors?: Array<{ message?: string }>;
};

const riskLevels = new Set<RiskLevel>(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]);
const confidenceLevels = new Set<ConfidenceLevel>(["LOW", "MEDIUM", "HIGH"]);
const releaseStatuses = new Set<ReleaseStatus>([
  "APPROVE",
  "APPROVE_WITH_CAUTION",
  "REJECT",
]);
const strategyTypes = new Set<StrategyType>([
  "DIRECT_MIGRATION",
  "ONLINE_MIGRATION",
  "PHASED_ROLLOUT",
  "EXPAND_CONTRACT",
]);
const downtimeLevels = new Set<RiskLevel>(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const stripped = value.replace(/^\$/, "").trim();

  if (!stripped.startsWith("{") && !stripped.startsWith("[")) {
    return stripped;
  }

  try {
    return JSON.parse(stripped);
  } catch {
    return stripped;
  }
}

function normalizeValue(value: unknown): unknown {
  const parsed = parseMaybeJson(value);

  if (Array.isArray(parsed)) {
    return parsed.map((item) => normalizeValue(item));
  }

  if (isRecord(parsed)) {
    return Object.fromEntries(
      Object.entries(parsed).map(([key, entry]) => [key, normalizeValue(entry)]),
    );
  }

  return parsed;
}

function coerceString(value: unknown, path: string): string {
  const normalized = normalizeValue(value);

  if (typeof normalized === "string") {
    return normalized;
  }

  throw new Error(`Lamatic response is missing a string at ${path}.`);
}

function coerceBoolean(value: unknown, path: string): boolean {
  const normalized = normalizeValue(value);

  if (typeof normalized === "boolean") {
    return normalized;
  }

  if (typeof normalized === "string") {
    const lower = normalized.toLowerCase();

    if (lower === "true") {
      return true;
    }

    if (lower === "false") {
      return false;
    }
  }

  throw new Error(`Lamatic response is missing a boolean at ${path}.`);
}

function coerceBooleanOrUnknown(value: unknown, path: string): boolean | "UNKNOWN" {
  const normalized = normalizeValue(value);

  if (typeof normalized === "string" && normalized.toUpperCase() === "UNKNOWN") {
    return "UNKNOWN";
  }

  return coerceBoolean(value, path);
}

function coerceEnum<T extends string>(
  value: unknown,
  allowed: Set<T>,
  path: string,
): T {
  const normalized = coerceString(value, path) as T;

  if (allowed.has(normalized)) {
    return normalized;
  }

  throw new Error(`Lamatic response has an invalid value at ${path}: ${normalized}`);
}

function coerceStringArray(value: unknown, path: string): string[] {
  const normalized = normalizeValue(value);

  // The flow's LLM output collapses a single-item list to a bare string
  // (e.g. "operations": "ADD COLUMN" instead of ["ADD COLUMN"]).
  if (typeof normalized === "string") {
    return [normalized];
  }

  if (!Array.isArray(normalized) || !normalized.every((item) => typeof item === "string")) {
    throw new Error(`Lamatic response is missing a string array at ${path}.`);
  }

  return normalized;
}

function coerceNestedStringArrays(value: unknown, path: string): string[][] {
  const normalized = normalizeValue(value);

  // The flow's LLM output collapses a single table's column list to a flat
  // array (e.g. "target_columns": ["age"] instead of [["age"]]).
  if (typeof normalized === "string") {
    return [[normalized]];
  }

  if (Array.isArray(normalized) && normalized.every((item) => typeof item === "string")) {
    return [normalized];
  }

  if (
    !Array.isArray(normalized) ||
    !normalized.every(
      (item) => Array.isArray(item) && item.every((entry) => typeof entry === "string"),
    )
  ) {
    throw new Error(`Lamatic response is missing a nested string array at ${path}.`);
  }

  return normalized;
}

function extractWorkflowResult(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  return (
    value.result ??
    value.output ??
    value.data ??
    value.answer ??
    value.executeWorkflow ??
    value
  );
}

function extractJsonObjectsFromText(value: string): unknown[] {
  const objects: unknown[] = [];
  let depth = 0;
  let startIndex = -1;
  let inString = false;
  let escaping = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (inString) {
      if (escaping) {
        escaping = false;
        continue;
      }

      if (char === "\\") {
        escaping = true;
        continue;
      }

      if (char === "\"") {
        inString = false;
      }

      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        startIndex = index;
      }

      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0 && startIndex >= 0) {
        const candidate = value.slice(startIndex, index + 1);

        try {
          objects.push(JSON.parse(candidate));
        } catch {
          // Ignore invalid fragments and keep scanning.
        }

        startIndex = -1;
      }
    }
  }

  return objects;
}

function mergeJsonObjects(objects: unknown[]): unknown {
  let merged: Record<string, unknown> | undefined;

  for (const object of objects) {
    if (!isRecord(object)) {
      continue;
    }

    merged = { ...merged, ...object };
  }

  return merged ?? objects[objects.length - 1];
}

function resolveResultPayload(result: unknown): unknown {
  const extracted = extractWorkflowResult(result);

  if (isRecord(extracted) && typeof extracted.content === "string") {
    const objects = extractJsonObjectsFromText(extracted.content);

    // The flow streams its answer as a sequence of top-level JSON objects in
    // `content`. Usually each one is a cumulative superset of the last, but
    // some runs instead emit a smaller delta-style final object (e.g. just
    // the newly-added section). Taking only the last object would silently
    // drop earlier fields (like `is_destructive`) in that case, so merge all
    // of them in order instead — a no-op for the cumulative pattern, and
    // correct for the delta pattern.
    if (objects.length > 0) {
      return mergeJsonObjects(objects);
    }
  }

  return extracted;
}

function cleanEnvValue(value: string | undefined): string {
  return value?.trim().replace(/^['"]+|['"]+$/g, "") ?? "";
}

const EXECUTE_WORKFLOW_QUERY = `
  query ExecuteWorkflow($workflowId: String!, $payload: JSON!) {
    executeWorkflow(workflowId: $workflowId, payload: $payload) {
      status
      result
    }
  }
`;

async function invokeLamaticEndpoint(
  endpoint: string,
  flowId: string,
  sql: string,
  apiKey: string,
  projectId: string,
): Promise<unknown> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "x-project-id": projectId,
    },
    body: JSON.stringify({
      query: EXECUTE_WORKFLOW_QUERY,
      variables: {
        workflowId: flowId,
        payload: { [LAMATIC_FLOW_INPUT_FIELD]: sql },
      },
    }),
  });

  const rawText = await response.text();
  const trimmedText = rawText.trim();

  let parsed: LamaticWorkflowResponse | null = null;

  if (trimmedText) {
    try {
      parsed = JSON.parse(trimmedText) as LamaticWorkflowResponse;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const upstreamMessage =
      parsed?.errors?.map((error) => error?.message).filter(Boolean).join("; ") ||
      (trimmedText.startsWith("<")
        ? "Lamatic returned HTML instead of JSON."
        : trimmedText || "Lamatic returned an unsuccessful response.");

    throw new Error(`Lamatic request failed (${response.status}) at ${endpoint}: ${upstreamMessage}`);
  }

  if (!parsed) {
    throw new Error(`Lamatic returned an invalid non-JSON response from ${endpoint}.`);
  }

  if (Array.isArray(parsed.errors) && parsed.errors.length > 0) {
    throw new Error(
      parsed.errors.map((entry) => entry?.message).filter(Boolean).join("; ") ||
        "Lamatic returned GraphQL errors.",
    );
  }

  if (parsed.data?.executeWorkflow?.status === "error") {
    throw new Error("Lamatic workflow execution failed.");
  }

  return parsed.data?.executeWorkflow?.result;
}

function parseMigrationResult(rawResult: unknown): MigrationPipelineResult {
  const result = normalizeValue(resolveResultPayload(rawResult));

  if (!isRecord(result)) {
    throw new Error("Lamatic returned an unexpected response shape.");
  }

  return {
    operations: coerceStringArray(result.operations, "operations"),
    target_table: coerceStringArray(result.target_table, "target_table"),
    target_columns: coerceNestedStringArrays(result.target_columns, "target_columns"),
    is_destructive: coerceBoolean(result.is_destructive, "is_destructive"),
    data_loss_potential: coerceEnum(result.data_loss_potential, riskLevels, "data_loss_potential"),
    explanation: coerceString(result.explanation, "explanation"),
    behavior_analysis: {
      blocking_risk: coerceEnum(
        result.behavior_analysis && isRecord(result.behavior_analysis)
          ? result.behavior_analysis.blocking_risk
          : undefined,
        riskLevels,
        "behavior_analysis.blocking_risk",
      ),
      lock_type: coerceString(
        result.behavior_analysis && isRecord(result.behavior_analysis)
          ? result.behavior_analysis.lock_type
          : undefined,
        "behavior_analysis.lock_type",
      ),
      production_risk: coerceEnum(
        result.behavior_analysis && isRecord(result.behavior_analysis)
          ? result.behavior_analysis.production_risk
          : undefined,
        riskLevels,
        "behavior_analysis.production_risk",
      ),
      reasoning: coerceString(
        result.behavior_analysis && isRecord(result.behavior_analysis)
          ? result.behavior_analysis.reasoning
          : undefined,
        "behavior_analysis.reasoning",
      ),
      table_rewrite: coerceBooleanOrUnknown(
        result.behavior_analysis && isRecord(result.behavior_analysis)
          ? result.behavior_analysis.table_rewrite
          : undefined,
        "behavior_analysis.table_rewrite",
      ),
    },
    deployment_strategy: {
      deployment_order: coerceStringArray(
        result.deployment_strategy && isRecord(result.deployment_strategy)
          ? result.deployment_strategy.deployment_order
          : undefined,
        "deployment_strategy.deployment_order",
      ),
      estimated_downtime: coerceEnum(
        result.deployment_strategy && isRecord(result.deployment_strategy)
          ? result.deployment_strategy.estimated_downtime
          : undefined,
        downtimeLevels,
        "deployment_strategy.estimated_downtime",
      ),
      maintenance_window_required: coerceBoolean(
        result.deployment_strategy && isRecord(result.deployment_strategy)
          ? result.deployment_strategy.maintenance_window_required
          : undefined,
        "deployment_strategy.maintenance_window_required",
      ),
      recommendation: {
        best_practice: coerceString(
          result.deployment_strategy &&
            isRecord(result.deployment_strategy) &&
            isRecord(result.deployment_strategy.recommendation)
            ? result.deployment_strategy.recommendation.best_practice
            : undefined,
          "deployment_strategy.recommendation.best_practice",
        ),
        summary: coerceString(
          result.deployment_strategy &&
            isRecord(result.deployment_strategy) &&
            isRecord(result.deployment_strategy.recommendation)
            ? result.deployment_strategy.recommendation.summary
            : undefined,
          "deployment_strategy.recommendation.summary",
        ),
        why: coerceString(
          result.deployment_strategy &&
            isRecord(result.deployment_strategy) &&
            isRecord(result.deployment_strategy.recommendation)
            ? result.deployment_strategy.recommendation.why
            : undefined,
          "deployment_strategy.recommendation.why",
        ),
      },
      strategy: coerceEnum(
        result.deployment_strategy && isRecord(result.deployment_strategy)
          ? result.deployment_strategy.strategy
          : undefined,
        strategyTypes,
        "deployment_strategy.strategy",
      ),
    },
    release_plan: {
      release_decision: {
        confidence: coerceEnum(
          result.release_plan &&
            isRecord(result.release_plan) &&
            isRecord(result.release_plan.release_decision)
            ? result.release_plan.release_decision.confidence
            : undefined,
          confidenceLevels,
          "release_plan.release_decision.confidence",
        ),
        status: coerceEnum(
          result.release_plan &&
            isRecord(result.release_plan) &&
            isRecord(result.release_plan.release_decision)
            ? result.release_plan.release_decision.status
            : undefined,
          releaseStatuses,
          "release_plan.release_decision.status",
        ),
      },
      rollback_strategy: {
        rollback_order: coerceStringArray(
          result.release_plan &&
            isRecord(result.release_plan) &&
            isRecord(result.release_plan.rollback_strategy)
            ? result.release_plan.rollback_strategy.rollback_order
            : undefined,
          "release_plan.rollback_strategy.rollback_order",
        ),
        rollback_possible: coerceBoolean(
          result.release_plan &&
            isRecord(result.release_plan) &&
            isRecord(result.release_plan.rollback_strategy)
            ? result.release_plan.rollback_strategy.rollback_possible
            : undefined,
          "release_plan.rollback_strategy.rollback_possible",
        ),
        rollback_warning: coerceString(
          result.release_plan &&
            isRecord(result.release_plan) &&
            isRecord(result.release_plan.rollback_strategy)
            ? result.release_plan.rollback_strategy.rollback_warning
            : undefined,
          "release_plan.rollback_strategy.rollback_warning",
        ),
      },
    },
  };
}

export async function runLamaticMigrationAnalysis(sql: string): Promise<MigrationPipelineResult> {
  const endpoint = cleanEnvValue(
    process.env.LAMATIC_API_URL ?? process.env.LAMATIC_PROJECT_ENDPOINT,
  ).replace(/\/+$/, "");
  const projectId = cleanEnvValue(process.env.LAMATIC_PROJECT_ID);
  const apiKey = cleanEnvValue(process.env.LAMATIC_API_KEY);
  const flowId = cleanEnvValue(process.env.LAMATIC_FLOW_ID);

  if (!endpoint || !projectId || !apiKey || !flowId) {
    throw new Error(
      "Lamatic server configuration is incomplete. Set LAMATIC_API_URL (or LAMATIC_PROJECT_ENDPOINT), LAMATIC_PROJECT_ID, LAMATIC_FLOW_ID, and LAMATIC_API_KEY on the server.",
    );
  }

  const result = await invokeLamaticEndpoint(endpoint, flowId, sql, apiKey, projectId);
  return parseMigrationResult(result);
}
