import { describe, expect, test } from "bun:test";

import { requestLamaticPlan, requestLamaticReport } from "../lib/lamatic-planner";

describe("requestLamaticPlan", () => {
  test("uses Lamatic's generated flow-specific GraphQL contract", async () => {
    let requestBody: Record<string, unknown> | undefined;
    const fetchImpl = (async (_url: string, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          data: {
            executeWorkflow: {
              status: "success",
              result: {
                plan: JSON.stringify({
                  hypothesis: "The CLI exits zero for an invalid flag.",
                  candidateCommand: "bun run cli -- --invalid",
                  controlCommand: "bun run cli -- --help",
                }),
              },
            },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;

    const plan = await requestLamaticPlan(
      { issue: "issue", repositoryContext: "snapshot", ref: "main" },
      {
        fetchImpl,
        configuration: {
          endpoint: "https://isolate.example.com",
          projectId: "project-id",
          apiKey: "test-key",
          flowId: "flow-id",
        },
      },
    );

    expect(plan.hypothesis).toContain("exits zero");
    expect(String(requestBody?.query)).toContain("$issue: String!");
    expect(String(requestBody?.query)).not.toContain("$payload: JSON!");
    expect(requestBody?.variables).toEqual({
      workflowId: "flow-id",
      issue: "issue",
      repositoryContext: "snapshot",
      ref: "main",
      policyFeedback: "",
    });
  });
});

test("parses report-mode output through the existing flow response field", async () => {
  const fetchImpl = (async () => new Response(JSON.stringify({
    data: { executeWorkflow: { status: "success", result: { plan: JSON.stringify({
      report: {
        outcome: "likely_reproduced",
        summary: "Words split at narrow width.",
        expectedBehavior: "Wrap between words.",
        actualBehavior: "A word was split.",
        reproductionSteps: ["Run the narrow preview."],
        evidence: ["Two runs showed the split."],
        limitations: ["AI-interpreted."],
        markdown: "# Isolate investigation report",
      },
    }) } } },
  }), { headers: { "content-type": "application/json" } })) as unknown as typeof fetch;

  const report = await requestLamaticReport(
    { issue: "issue", repositoryContext: "evidence", ref: "main" },
    { fetchImpl, configuration: { endpoint: "https://isolate.example.com", projectId: "project-id", apiKey: "test-key", flowId: "flow-id" } },
  );
  expect(report.outcome).toBe("likely_reproduced");
});
