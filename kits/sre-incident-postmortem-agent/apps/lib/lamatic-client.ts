import type {
  IncidentInput,
  Postmortem,
} from "@/lib/types";
import { Lamatic } from "lamatic";

const requiredEnv = [
  "LAMATIC_API_KEY",
  "LAMATIC_API_URL",
  "LAMATIC_PROJECT_ID",
] as const;

const REQUEST_TIMEOUT_MS = 30000;

function getRequiredEnv(key: (typeof requiredEnv)[number]) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function normalizeEndpoint(endpoint: string) {
  const trimmed = endpoint.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/graphql") ? trimmed : `${trimmed}/graphql`;
}

function validatePostmortem(value: unknown): Postmortem {
  if (!value || typeof value !== "object") {
    throw new Error("Lamatic returned an invalid postmortem payload.");
  }

  const postmortem = value as Partial<Postmortem>;

  const requiredStrings: Array<keyof Pick<
    Postmortem,
    | "severity"
    | "executive_summary"
    | "suspected_root_cause"
    | "customer_impact"
    | "immediate_remediation"
    | "markdown_postmortem"
  >> = [
    "severity",
    "executive_summary",
    "suspected_root_cause",
    "customer_impact",
    "immediate_remediation",
    "markdown_postmortem",
  ];

  for (const field of requiredStrings) {
    if (typeof postmortem[field] !== "string" || !postmortem[field]) {
      throw new Error(`Lamatic response is missing required field: ${field}`);
    }
  }

  const requiredArrays: Array<keyof Pick<
    Postmortem,
    "timeline" | "long_term_prevention" | "owner_followups"
  >> = ["timeline", "long_term_prevention", "owner_followups"];

  for (const field of requiredArrays) {
    if (
      !Array.isArray(postmortem[field]) ||
      !postmortem[field]?.every((item) => typeof item === "string")
    ) {
      throw new Error(`Lamatic response has invalid array field: ${field}`);
    }
  }

  return postmortem as Postmortem;
}

export async function executePostmortemFlow(
  input: IncidentInput,
  workflowEnvKey: string,
): Promise<Postmortem> {
  const apiKey = getRequiredEnv("LAMATIC_API_KEY");
  const endpoint = normalizeEndpoint(getRequiredEnv("LAMATIC_API_URL"));
  const projectId = getRequiredEnv("LAMATIC_PROJECT_ID");
  const workflowId = process.env[workflowEnvKey];

  if (!workflowId) {
    throw new Error(`Missing required environment variable: ${workflowEnvKey}`);
  }

  const client = new Lamatic({
    endpoint,
    projectId,
    apiKey,
  });

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Lamatic request timed out.")), REQUEST_TIMEOUT_MS);
  });

  const execution = await Promise.race([
    client.executeFlow(workflowId, input),
    timeout,
  ]);

  const status = execution?.status;

  if (!status) {
    throw new Error("Lamatic response is missing workflow status.");
  }

  if (!["success", "completed"].includes(status.toLowerCase())) {
    throw new Error(`Lamatic workflow failed with status: ${status}`);
  }

  const result = execution.result as { postmortem?: unknown } | undefined;
  return validatePostmortem(result?.postmortem);
}
