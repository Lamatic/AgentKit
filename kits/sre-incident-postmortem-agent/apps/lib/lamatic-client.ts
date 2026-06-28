import type {
  IncidentInput,
  LamaticGraphQLResponse,
  Postmortem,
} from "@/lib/types";

const query = `
  query ExecuteWorkflow(
    $workflowId: String!
    $service_name: String
    $incident_title: String
    $alert_details: String
    $logs_or_symptoms: String
    $timeline_notes: String
    $impact_description: String
    $current_status: String
  ) {
    executeWorkflow(
      workflowId: $workflowId
      payload: {
        service_name: $service_name
        incident_title: $incident_title
        alert_details: $alert_details
        logs_or_symptoms: $logs_or_symptoms
        timeline_notes: $timeline_notes
        impact_description: $impact_description
        current_status: $current_status
      }
    ) {
      status
      result
    }
  }
`;

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "x-project-id": projectId,
      },
      body: JSON.stringify({
        query,
        variables: {
          workflowId,
          ...input,
        },
      }),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Lamatic request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const raw = await response.text();
  let parsed: LamaticGraphQLResponse | null = null;

  try {
    parsed = raw ? (JSON.parse(raw) as LamaticGraphQLResponse) : null;
  } catch {
    throw new Error("Lamatic returned a non-JSON response.");
  }

  if (!response.ok) {
    const message =
      parsed?.errors?.map((error) => error.message).filter(Boolean).join("; ") ||
      `Lamatic request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (parsed?.errors?.length) {
    const message = parsed.errors
      .map((error) => error.message)
      .filter(Boolean)
      .join("; ");
    throw new Error(message || "Lamatic returned GraphQL errors.");
  }

  const execution = parsed?.data?.executeWorkflow;
  const status = execution?.status;

  if (!status) {
    throw new Error("Lamatic response is missing workflow status.");
  }

  if (!["success", "completed"].includes(status.toLowerCase())) {
    throw new Error(`Lamatic workflow failed with status: ${status}`);
  }

  const result = execution?.result;
  return validatePostmortem(result?.postmortem);
}
