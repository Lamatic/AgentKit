import { beforeEach, describe, expect, spyOn, test } from "bun:test";

import { handleMcp } from "../lib/runtime/mcp";
import { InvalidGitHubIssueUrlError } from "../lib/runtime/github";
import {
  acquireInvestigationSlot,
  resetInvestigationSlotsForTest,
} from "../lib/concurrency";

const secret = "test-mcp-secret";

function mcpRequest(body: unknown, authorization?: string) {
  return new Request("https://isolate.example/api/mcp", {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      ...(authorization ? { authorization } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function mcpJson(response: Response) {
  const body = await response.text();

  if (response.headers.get("content-type")?.includes("text/event-stream")) {
    const data = body
      .split("\n")
      .find((line) => line.startsWith("data: "))
      ?.slice(6);
    return data ? JSON.parse(data) : null;
  }

  return JSON.parse(body);
}

describe("POST /api/mcp", () => {
  beforeEach(resetInvestigationSlotsForTest);

  test("rejects discovery without the configured bearer secret", async () => {
    const response = await handleMcp(
      mcpRequest({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
      secret,
    );

    expect(response.status).toBe(401);
  });

  test("rejects mismatched tokens and missing server configuration", async () => {
    const body = { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} };
    expect((await handleMcp(mcpRequest(body, "Bearer wrong"), secret)).status).toBe(401);
    expect((await handleMcp(mcpRequest(body, `Bearer ${secret}`), undefined)).status).toBe(401);
  });

  test("advertises Isolate echo through authenticated MCP discovery", async () => {
    const response = await handleMcp(
      mcpRequest(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-03-26",
            capabilities: {},
            clientInfo: { name: "lamatic-spike", version: "1.0.0" },
          },
        },
        `Bearer ${secret}`,
      ),
      secret,
    );
    const body = await mcpJson(response);

    expect(response.status).toBe(200);
    expect(body.result.serverInfo).toEqual({ name: "isolate", version: "0.1.0" });
    expect(body.result.capabilities.tools).toBeDefined();
  });

  test("lists and executes the echo tool over stateless MCP", async () => {
    const toolsResponse = await handleMcp(
      mcpRequest(
        { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
        `Bearer ${secret}`,
      ),
      secret,
    );
    const toolsBody = await mcpJson(toolsResponse);

    expect(toolsBody.result.tools.map(({ name }: { name: string }) => name)).toContain(
      "echo",
    );

    const callResponse = await handleMcp(
      mcpRequest(
        {
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: {
            name: "echo",
            arguments: { message: "called by Lamatic" },
          },
        },
        `Bearer ${secret}`,
      ),
      secret,
    );
    const callBody = await mcpJson(callResponse);

    expect(callBody.result.structuredContent).toMatchObject({
      ok: true,
      tool: "echo",
      message: "called by Lamatic",
    });
    expect(callBody.result.structuredContent.traceId).toMatch(
      /^spike_[a-f0-9-]{36}$/,
    );
  });

  test("returns actionable guidance for an invalid GitHub issue URL", async () => {
    const response = await handleMcp(
      mcpRequest(
        {
          jsonrpc: "2.0",
          id: 4,
          method: "tools/call",
          params: {
            name: "get_github_issue",
            arguments: {
              issueUrl: "https://github.com/example/repo/pull/1",
            },
          },
        },
        `Bearer ${secret}`,
      ),
      secret,
      undefined,
      {
        read: async () => {
          throw new InvalidGitHubIssueUrlError();
        },
      },
    );
    const body = await mcpJson(response);

    expect(body.result.isError).toBe(true);
    expect(JSON.stringify(body.result.content)).toContain(
      "https://github.com/owner/repo/issues/123",
    );
  });

  test("certifies reproduction only after repeat and control probes", async () => {
    const probeCalls: unknown[] = [];
    const lifecycle: unknown[] = [];
    const passingRun = {
      passed: true,
      assertions: [{
        kind: "stderr_contains" as const,
        passed: true,
        expected: "bug observed",
        actual: "bug observed\n",
      }],
      observation: {
        command: "bun test repro.test.ts",
        exitCode: 1,
        stdout: "",
        stderr: "bug observed\n",
        durationMs: 20,
      },
    };
    const runtime = {
      create: async (input: unknown) => {
        lifecycle.push({ create: input });
        return { sandboxId: "sandbox_123", workspace: "workspace/repo" as const };
      },
      runProbe: async (input: unknown) => {
        probeCalls.push(input);
        return probeCalls.length < 3
          ? passingRun
          : {
              ...passingRun,
              passed: false,
              assertions: [{
                kind: "stderr_contains" as const,
                passed: false,
                expected: "bug observed",
                actual: "",
              }],
              observation: { ...passingRun.observation, stderr: "" },
            };
      },
      resetWorkspace: async () => undefined,
      delete: async (sandboxId: string) => {
        lifecycle.push({ delete: sandboxId });
        return { deleted: true as const, sandboxId };
      },
    };
    const response = await handleMcp(
      mcpRequest(
        {
          jsonrpc: "2.0",
          id: 7,
          method: "tools/call",
          params: {
            name: "certify_reproduction",
            arguments: {
              issueUrl: "https://github.com/example/buggy-cli/issues/1",
              ref: "main",
              timeoutSeconds: 40,
              candidateCommand: "bun test repro.test.ts",
              controlCommand: "bun test control.test.ts",
            },
          },
        },
        `Bearer ${secret}`,
      ),
      secret,
      () => runtime,
      {
        read: async () => ({
          url: "https://github.com/example/buggy-cli/issues/1",
          repositoryUrl: "https://github.com/example/buggy-cli",
          owner: "example",
          repository: "buggy-cli",
          number: 1,
          title: "Regression fails",
          body: "Observed stderr: `bug observed`",
          state: "open" as const,
          author: "maintainer",
          labels: ["bug"],
        }),
      },
    );
    const body = await mcpJson(response);

    const markdown = String(body.result.structuredContent.report.content);
    expect(body.result.structuredContent).toMatchObject({
      outcome: "reproduced",
      gate: {
        repeatCount: 2,
        allCandidateRunsPassed: true,
        controlRejected: true,
      },
      report: {
        format: "markdown",
        content: expect.stringContaining("# Isolate reproduction report"),
      },
    });
    expect(markdown.includes("**Outcome:** `reproduced`")).toBe(true);
    expect(markdown.includes("`bun test repro.test.ts`")).toBe(true);
    expect(lifecycle).toEqual([
      {
        create: {
          repositoryUrl: "https://github.com/example/buggy-cli",
          ref: "main",
        },
      },
      { delete: "sandbox_123" },
    ]);
    expect(markdown.includes("bug observed")).toBe(true);
    expect(probeCalls).toHaveLength(3);
  });

  test("does not expose provider or configuration errors through MCP", async () => {
    const logged = spyOn(console, "error").mockImplementation(() => undefined);
    const runtime = {
      create: async () => {
        throw new Error("Missing DAYTONA_API_KEY configuration.");
      },
      runProbe: async () => { throw new Error("not used"); },
      resetWorkspace: async () => undefined,
      delete: async () => { throw new Error("not used"); },
    };
    const response = await handleMcp(
      mcpRequest(
        {
          jsonrpc: "2.0",
          id: 8,
          method: "tools/call",
          params: {
            name: "certify_reproduction",
            arguments: {
              issueUrl: "https://github.com/example/buggy-cli/issues/1",
              candidateCommand: "bun test repro.test.ts",
              controlCommand: "bun test control.test.ts",
            },
          },
        },
        `Bearer ${secret}`,
      ),
      secret,
      () => runtime,
      {
        read: async () => ({
          url: "https://github.com/example/buggy-cli/issues/1",
          repositoryUrl: "https://github.com/example/buggy-cli",
          owner: "example",
          repository: "buggy-cli",
          number: 1,
          title: "Regression fails",
          body: "Observed stderr: `bug observed`",
          state: "open" as const,
          author: "maintainer",
          labels: ["bug"],
        }),
      },
    );
    const body = await mcpJson(response);

    expect(body.result.isError).toBe(true);
    expect(JSON.stringify(body.result.content)).toContain(
      "could not complete the requested operation",
    );
    expect(JSON.stringify(body)).not.toContain("DAYTONA_API_KEY");
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });

  test("rejects unsafe certification commands before sandbox allocation", async () => {
    let creates = 0;
    const runtime = {
      create: async () => {
        creates += 1;
        throw new Error("must not allocate");
      },
      runProbe: async () => { throw new Error("not used"); },
      resetWorkspace: async () => undefined,
      delete: async () => { throw new Error("not used"); },
    };
    const response = await handleMcp(
      mcpRequest(
        {
          jsonrpc: "2.0",
          id: 9,
          method: "tools/call",
          params: {
            name: "certify_reproduction",
            arguments: {
              issueUrl: "https://github.com/example/buggy-cli/issues/1",
              candidateCommand: "printf 'bug observed'",
              controlCommand: "bun test control.test.ts",
            },
          },
        },
        `Bearer ${secret}`,
      ),
      secret,
      () => runtime,
      {
        read: async () => ({
          url: "https://github.com/example/buggy-cli/issues/1",
          repositoryUrl: "https://github.com/example/buggy-cli",
          owner: "example",
          repository: "buggy-cli",
          number: 1,
          title: "Regression fails",
          body: "Observed stderr: `bug observed`",
          state: "open" as const,
          author: "maintainer",
          labels: ["bug"],
        }),
      },
    );
    const body = await mcpJson(response);

    expect(body.result.isError).toBe(true);
    expect(creates).toBe(0);
  });

  test("returns a safe planner-policy error for identical certification commands", async () => {
    let creates = 0;
    const runtime = {
      create: async () => {
        creates += 1;
        throw new Error("must not allocate");
      },
      runProbe: async () => { throw new Error("not used"); },
      resetWorkspace: async () => undefined,
      delete: async () => { throw new Error("not used"); },
    };
    const response = await handleMcp(
      mcpRequest(
        {
          jsonrpc: "2.0",
          id: 11,
          method: "tools/call",
          params: {
            name: "certify_reproduction",
            arguments: {
              issueUrl: "https://github.com/example/buggy-cli/issues/1",
              candidateCommand: "bun test repro.test.ts",
              controlCommand: "bun test repro.test.ts",
            },
          },
        },
        `Bearer ${secret}`,
      ),
      secret,
      () => runtime,
      {
        read: async () => ({
          url: "https://github.com/example/buggy-cli/issues/1",
          repositoryUrl: "https://github.com/example/buggy-cli",
          owner: "example",
          repository: "buggy-cli",
          number: 1,
          title: "Regression fails",
          body: "Observed stderr: `bug observed`",
          state: "open" as const,
          author: "maintainer",
          labels: ["bug"],
        }),
      },
    );
    const body = await mcpJson(response);

    expect(body.result.isError).toBe(true);
    expect(JSON.stringify(body.result.content)).toContain("different cases");
    expect(creates).toBe(0);
  });

  test("rejects certification while both investigation slots are in flight", async () => {
    const releaseFirst = acquireInvestigationSlot();
    const releaseSecond = acquireInvestigationSlot();
    let runtimeAllocations = 0;
    try {
      const response = await handleMcp(
        mcpRequest(
          {
            jsonrpc: "2.0",
            id: 10,
            method: "tools/call",
            params: {
              name: "certify_reproduction",
              arguments: {
                issueUrl: "https://github.com/example/buggy-cli/issues/1",
                candidateCommand: "bun test repro.test.ts",
                controlCommand: "bun test control.test.ts",
              },
            },
          },
          `Bearer ${secret}`,
        ),
        secret,
        () => {
          runtimeAllocations += 1;
          throw new Error("must not allocate");
        },
      );
      const body = await mcpJson(response);

      expect(body.result.isError).toBe(true);
      expect(JSON.stringify(body.result.content)).toContain(
        "Too many investigations",
      );
      expect(runtimeAllocations).toBe(0);
    } finally {
      releaseFirst?.();
      releaseSecond?.();
    }
  });
});
