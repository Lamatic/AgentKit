import { parseReproductionPlan } from "./runtime/plan";

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} configuration.`);
  return value;
}

export async function requestLamaticPlan(input: {
  issue: string;
  repositoryContext: string;
  ref: string;
}, dependencies: {
  fetchImpl?: typeof fetch;
  configuration?: {
    endpoint: string;
    projectId: string;
    apiKey: string;
    flowId: string;
  };
} = {}) {
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
  ) {
    executeWorkflow(
      workflowId: $workflowId
      payload: {
        issue: $issue
        repositoryContext: $repositoryContext
        ref: $ref
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
      variables: { workflowId: configuration.flowId, ...input },
    }),
  });
  const body = (await response.json()) as {
    data?: { executeWorkflow?: { status?: string; result?: unknown } };
    errors?: Array<{ message?: string }>;
  };
  const execution = body.data?.executeWorkflow;
  if (!response.ok || execution?.status !== "success" || !execution.result) {
    throw new Error(
      body.errors?.[0]?.message ?? "Lamatic could not produce a probe plan.",
    );
  }
  const result = execution.result as { plan?: unknown };
  return parseReproductionPlan(result.plan ?? result);
}
