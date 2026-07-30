import { parseReproductionPlan } from "./runtime/plan";
import { parseInvestigationReport } from "./runtime/investigation-report";

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} configuration.`);
  return value;
}

type LamaticInput = {
  issue: string;
  repositoryContext: string;
  ref: string;
  policyFeedback?: string;
};

type LamaticDependencies = {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  configuration?: {
    endpoint: string;
    projectId: string;
    apiKey: string;
    flowId: string;
  };
};

async function executeLamaticFlow(input: LamaticInput, dependencies: LamaticDependencies = {}) {
  const configuration = dependencies.configuration ?? {
    endpoint: requiredEnvironment("LAMATIC_API_URL"),
    projectId: requiredEnvironment("LAMATIC_PROJECT_ID"),
    apiKey: requiredEnvironment("LAMATIC_API_KEY"),
    flowId: requiredEnvironment("ISOLATE_REPRODUCTION_FLOW_ID"),
  };
  const query = `query ExecuteWorkflow(
    $workflowId: String!
    $issue: String!
    $repositoryContext: String!
    $ref: String!
    $policyFeedback: String!
  ) {
    executeWorkflow(
      workflowId: $workflowId
      payload: {
        issue: $issue
        repositoryContext: $repositoryContext
        ref: $ref
        policyFeedback: $policyFeedback
      }
    ) {
      status
      result
    }
  }`;
  const response = await (dependencies.fetchImpl ?? fetch)(configuration.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${configuration.apiKey}`,
      "Content-Type": "application/json",
      "x-project-id": configuration.projectId,
    },
    body: JSON.stringify({
      query,
      variables: {
        workflowId: configuration.flowId,
        ...input,
        policyFeedback: input.policyFeedback ?? "",
      },
    }),
    signal: dependencies.signal ?? AbortSignal.timeout(25_000),
  });
  const rawBody = await response.text();
  let body: {
    data?: { executeWorkflow?: { status?: string; result?: unknown } };
    errors?: Array<{ message?: string }>;
  } = {};
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    throw new Error(
      response.ok
        ? "Lamatic could not produce a probe plan."
        : `Lamatic returned HTTP ${response.status} without a valid error response.`,
    );
  }
  const execution = body.data?.executeWorkflow;
  if (!response.ok || execution?.status !== "success" || !execution.result) {
    throw new Error(
      body.errors?.[0]?.message ?? "Lamatic could not produce a probe plan.",
    );
  }
  return execution.result as { plan?: unknown; report?: unknown };
}

export async function requestLamaticPlan(
  input: LamaticInput,
  dependencies: LamaticDependencies = {},
) {
  const result = await executeLamaticFlow(input, dependencies);
  return parseReproductionPlan(result.plan ?? result);
}

export async function requestLamaticReport(
  input: LamaticInput,
  dependencies: LamaticDependencies = {},
) {
  const result = await executeLamaticFlow(input, dependencies);
  return parseInvestigationReport(result.report ?? result.plan ?? result);
}
