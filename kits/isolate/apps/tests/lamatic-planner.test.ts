import { describe, expect, test } from "bun:test";

import { requestLamaticPlan } from "../lib/lamatic-planner";

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
                  setupCommand: "bun install --frozen-lockfile",
                  candidateCommand: "bun run cli -- --invalid",
                  candidateAssertions: [{ kind: "exit_code", equals: 0 }],
                  controlCommand: "bun run cli -- --help",
                  controlAssertions: [{ kind: "exit_code", equals: 0 }],
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
    });
  });
});
