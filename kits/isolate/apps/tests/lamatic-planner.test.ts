import { describe, expect, test } from "bun:test";

import { requestLamaticPlan, requestLamaticReport } from "../lib/lamatic-planner";

describe("requestLamaticPlan", () => {
  test("uses Lamatic's generated flow-specific GraphQL contract", async () => {
    let requestBody: Record<string, unknown> | undefined;
    let requestHeaders: Headers | undefined;
    const fetchImpl = (async (_url: string, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body));
      requestHeaders = new Headers(init?.headers);
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
    expect(requestHeaders?.get("authorization")).toBe("Bearer test-key");
    expect(requestHeaders?.get("x-project-id")).toBe("project-id");
  });
});

test.each([
  ["HTTP failure", new Response("gateway", { status: 502 }), /HTTP 502/],
  ["workflow failure", new Response(JSON.stringify({ data: { executeWorkflow: { status: "failed" } } })), /could not produce/],
  ["upstream message", new Response(JSON.stringify({ errors: [{ message: "flow not found" }] }), { status: 404 }), /flow not found/],
])("rejects %s", async (_name, response, expected) => {
  await expect(requestLamaticPlan(
    { issue: "issue", repositoryContext: "snapshot", ref: "main" },
    {
      fetchImpl: (async () => response) as unknown as typeof fetch,
      configuration: { endpoint: "https://isolate.example.com", projectId: "project-id", apiKey: "test-key", flowId: "flow-id" },
    },
  )).rejects.toThrow(expected);
});

test("parses report-mode output through the existing flow response field", async () => {
  const fetchImpl = (async () => new Response(JSON.stringify({
    data: { executeWorkflow: { status: "success", result: { plan: JSON.stringify({
      report: {
        assessment: "likely_reproduced",
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
  expect(report.assessment).toBe("likely_reproduced");
});
