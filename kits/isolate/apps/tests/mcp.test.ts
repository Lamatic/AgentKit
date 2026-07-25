import { describe, expect, test } from "bun:test";

import { handleMcp } from "../lib/runtime/mcp";
import { DaytonaSandboxRuntime } from "../lib/runtime/daytona";

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

  test("creates an isolated repository workspace through MCP", async () => {
    const calls: unknown[] = [];
    const runtime = {
      create: async (input: unknown) => {
        calls.push(input);
        return { sandboxId: "sandbox_123", workspace: "workspace/repo" as const };
      },
      runProbe: async () => {
        throw new Error("not used");
      },
      delete: async () => {
        throw new Error("not used");
      },
    };
    const response = await handleMcp(
      mcpRequest(
        {
          jsonrpc: "2.0",
          id: 4,
          method: "tools/call",
          params: {
            name: "create_sandbox",
            arguments: {
              repositoryUrl: "https://github.com/example/buggy-cli",
              ref: "main",
            },
          },
        },
        `Bearer ${secret}`,
      ),
      secret,
      () => runtime,
    );
    const body = await mcpJson(response);

    expect(body.result.structuredContent).toEqual({
      sandboxId: "sandbox_123",
      workspace: "workspace/repo",
    });
    expect(calls).toEqual([
      {
        repositoryUrl: "https://github.com/example/buggy-cli",
        ref: "main",
      },
    ]);
  });

  test("returns runtime-certified probe evidence through MCP", async () => {
    const runtime = {
      create: async () => {
        throw new Error("not used");
      },
      runProbe: async () => ({
        passed: true,
        assertions: [
          { kind: "exit_code" as const, passed: true, expected: 1, actual: 1 },
        ],
        observation: {
          command: "bun test regression.test.ts",
          exitCode: 1,
          stdout: "",
          stderr: "failure reproduced\n",
          durationMs: 20,
        },
      }),
      delete: async () => {
        throw new Error("not used");
      },
    };
    const response = await handleMcp(
      mcpRequest(
        {
          jsonrpc: "2.0",
          id: 5,
          method: "tools/call",
          params: {
            name: "run_probe",
            arguments: {
              sandboxId: "sandbox_123",
              workspace: "workspace/repo",
              timeoutSeconds: 40,
              probe: {
                command: "bun test regression.test.ts",
                assertions: [{ kind: "exit_code", equals: 1 }],
              },
            },
          },
        },
        `Bearer ${secret}`,
      ),
      secret,
      () => runtime,
    );
    const body = await mcpJson(response);
    expect(body.result.structuredContent).toMatchObject({
      passed: true,
      observation: {
        command: "bun test regression.test.ts",
        exitCode: 1,
        stderr: "failure reproduced\n",
      },
    });
  });

  test("rejects unsafe commands at the MCP runtime boundary", async () => {
    let sandboxLookups = 0;
    const runtime = new DaytonaSandboxRuntime({
      create: async () => { throw new Error("not used"); },
      get: async () => {
        sandboxLookups += 1;
        throw new Error("must not access sandbox");
      },
      delete: async () => undefined,
    });
    const response = await handleMcp(
      mcpRequest(
        {
          jsonrpc: "2.0",
          id: 51,
          method: "tools/call",
          params: {
            name: "run_probe",
            arguments: {
              sandboxId: "sandbox_123",
              workspace: "workspace/repo",
              timeoutSeconds: 40,
              probe: {
                command: "git push origin main",
                assertions: [{ kind: "exit_code", equals: 0 }],
              },
            },
          },
        },
        `Bearer ${secret}`,
      ),
      secret,
      () => runtime,
    );
    const body = await mcpJson(response);

    expect(body.result.isError).toBe(true);
    expect(JSON.stringify(body.result.content)).toContain("command policy");
    expect(sandboxLookups).toBe(0);
  });

  test("deletes an investigation sandbox through MCP", async () => {
    const runtime = {
      create: async () => {
        throw new Error("not used");
      },
      runProbe: async () => {
        throw new Error("not used");
      },
      delete: async (sandboxId: string) => ({ deleted: true as const, sandboxId }),
    };
    const response = await handleMcp(
      mcpRequest(
        {
          jsonrpc: "2.0",
          id: 6,
          method: "tools/call",
          params: {
            name: "delete_sandbox",
            arguments: { sandboxId: "sandbox_123" },
          },
        },
        `Bearer ${secret}`,
      ),
      secret,
      () => runtime,
    );
    const body = await mcpJson(response);

    expect(body.result.structuredContent).toEqual({
      deleted: true,
      sandboxId: "sandbox_123",
    });
  });

  test("certifies reproduction only after repeat and control probes", async () => {
    const calls: unknown[] = [];
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
      create: async () => {
        throw new Error("not used");
      },
      runProbe: async (input: unknown) => {
        calls.push(input);
        return calls.length < 3
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
      delete: async () => {
        throw new Error("not used");
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
              sandboxId: "sandbox_123",
              workspace: "workspace/repo",
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
    expect(markdown.includes("bug observed")).toBe(true);
    expect(calls).toHaveLength(3);
  });
});
