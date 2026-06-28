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
  "SRE_POSTMORTEM_FLOW_ID",
] as const;

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
  return {
    severity: String(postmortem.severity || "Unknown"),
    executive_summary: String(postmortem.executive_summary || ""),
    suspected_root_cause: String(postmortem.suspected_root_cause || ""),
    timeline: Array.isArray(postmortem.timeline) ? postmortem.timeline.map(String) : [],
    customer_impact: String(postmortem.customer_impact || ""),
    immediate_remediation: String(postmortem.immediate_remediation || ""),
    long_term_prevention: Array.isArray(postmortem.long_term_prevention)
      ? postmortem.long_term_prevention.map(String)
      : [],
    owner_followups: Array.isArray(postmortem.owner_followups)
      ? postmortem.owner_followups.map(String)
      : [],
    markdown_postmortem: String(postmortem.markdown_postmortem || ""),
  };
}

export async function executePostmortemFlow(
  input: IncidentInput,
): Promise<Postmortem> {
  const apiKey = getRequiredEnv("LAMATIC_API_KEY");
  const endpoint = normalizeEndpoint(getRequiredEnv("LAMATIC_API_URL"));
  const projectId = getRequiredEnv("LAMATIC_PROJECT_ID");
  const workflowId = getRequiredEnv("SRE_POSTMORTEM_FLOW_ID");

  const response = await fetch(endpoint, {
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
  });

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

  const result = parsed?.data?.executeWorkflow?.result;
  return validatePostmortem(result?.postmortem);
}
