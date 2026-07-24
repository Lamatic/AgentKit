import { describe, expect, test } from "bun:test";

import { DaytonaSandboxRuntime } from "../lib/runtime/daytona";

function fakeDaytona(commandResults: Array<{ exitCode: number; result: string }> = []) {
  const calls: Array<{ name: string; args: unknown[] }> = [];
  const sandbox = {
    id: "sandbox_123",
    git: {
      clone: async (...args: unknown[]) => calls.push({ name: "clone", args }),
    },
    process: {
      executeCommand: async (...args: unknown[]) => {
        calls.push({ name: "executeCommand", args });
        return commandResults.shift() ?? { exitCode: 0, result: "" };
      },
    },
  };
  const client = {
    create: async (...args: unknown[]) => {
      calls.push({ name: "create", args });
      return sandbox;
    },
    get: async (...args: unknown[]) => {
      calls.push({ name: "get", args });
      return sandbox;
    },
    delete: async (...args: unknown[]) => calls.push({ name: "delete", args }),
  };

  return { client, calls, sandbox };
}

describe("DaytonaSandboxRuntime", () => {
  test("creates an expiring private sandbox for a public GitHub repository", async () => {
    const { client, calls } = fakeDaytona();
    const runtime = new DaytonaSandboxRuntime(client);

    const result = await runtime.create({
      repositoryUrl: "https://github.com/example/buggy-cli",
      ref: "main",
    });

    expect(result).toEqual({ sandboxId: "sandbox_123", workspace: "workspace/repo" });
    expect(calls).toEqual([
      {
        name: "create",
        args: [
          {
            language: "typescript",
            ephemeral: true,
            public: false,
            ttlMinutes: 30,
            labels: { product: "isolate", purpose: "issue-reproduction" },
          },
          { timeout: 90 },
        ],
      },
      {
        name: "clone",
        args: [
          "https://github.com/example/buggy-cli",
          "workspace/repo",
          "main",
          undefined,
          undefined,
          undefined,
          false,
          1,
        ],
      },
    ]);
  });

  test("rejects repositories outside the public GitHub boundary", async () => {
    const { client, calls } = fakeDaytona();
    const runtime = new DaytonaSandboxRuntime(client);

    await expect(
      runtime.create({ repositoryUrl: "ssh://git@github.com/private/repo" }),
    ).rejects.toThrow("Only public HTTPS GitHub repositories are supported.");
    expect(calls).toHaveLength(0);
  });

  test("deletes a sandbox immediately when repository cloning fails", async () => {
    const { client, calls, sandbox } = fakeDaytona();
    sandbox.git.clone = async () => {
      throw new Error("clone failed");
    };
    const runtime = new DaytonaSandboxRuntime(client);

    await expect(
      runtime.create({ repositoryUrl: "https://github.com/example/missing" }),
    ).rejects.toThrow("clone failed");

    expect(calls.map(({ name }) => name)).toEqual(["create", "delete"]);
    expect(calls[1]?.args.slice(1)).toEqual([60, true]);
  });

  test("checks out an immutable commit when the ref is a full SHA", async () => {
    const { client, calls } = fakeDaytona();
    const runtime = new DaytonaSandboxRuntime(client);
    const commit = "0123456789abcdef0123456789abcdef01234567";

    await runtime.create({
      repositoryUrl: "https://github.com/example/buggy-cli",
      ref: commit,
    });

    expect(calls[1]).toEqual({
      name: "clone",
      args: [
        "https://github.com/example/buggy-cli",
        "workspace/repo",
        undefined,
        commit,
        undefined,
        undefined,
        false,
        1,
      ],
    });
  });

  test("runs a probe and evaluates separately captured stdout and stderr", async () => {
    const { client, calls } = fakeDaytona([
      { exitCode: 0, result: "" },
      { exitCode: 0, result: "" },
      {
        exitCode: 0,
        result: JSON.stringify({
          exitCode: 1,
          stdout: "1 test failed\n",
          stderr: "Expected 200, received 500\n",
        }),
      },
    ]);
    const runtime = new DaytonaSandboxRuntime(client, () => 1_000);

    const result = await runtime.runProbe({
      sandboxId: "sandbox_123",
      workspace: "workspace/repo",
      timeoutSeconds: 45,
      probe: {
        command: "bun test regression.test.ts",
        assertions: [
          { kind: "exit_code", equals: 1 },
          { kind: "stderr_contains", value: "Expected 200, received 500" },
        ],
      },
    });

    expect(result.passed).toBe(true);
    expect(result.observation).toMatchObject({
      command: "bun test regression.test.ts",
      exitCode: 1,
      stdout: "1 test failed\n",
      stderr: "Expected 200, received 500\n",
      durationMs: 0,
    });
    expect(calls[0]).toEqual({ name: "get", args: ["sandbox_123"] });
    expect(calls.filter(({ name }) => name === "executeCommand")).toHaveLength(3);
    expect(calls[2]?.args.at(-1)).toBe(45);
  });

  test("redacts common credentials and caps captured command output", async () => {
    const oversized = `API_KEY=super-secret\n${"x".repeat(70_000)}`;
    const { client } = fakeDaytona([
      { exitCode: 0, result: "" },
      { exitCode: 0, result: "" },
      {
        exitCode: 0,
        result: JSON.stringify({
          exitCode: 0,
          stdout: oversized,
          stderr: "Authorization: Bearer secret-token",
        }),
      },
    ]);
    const runtime = new DaytonaSandboxRuntime(client, () => 1_000);

    const result = await runtime.runProbe({
      sandboxId: "sandbox_123",
      workspace: "workspace/repo",
      probe: {
        command: "env && generate-lots-of-output",
        assertions: [{ kind: "exit_code", equals: 0 }],
      },
    });

    expect(result.observation.stdout).not.toContain("super-secret");
    expect(result.observation.stderr).not.toContain("secret-token");
    expect(result.observation.stdout).toContain("[REDACTED]");
    expect(result.observation.stdout).toEndWith("\n[output truncated]");
    expect(result.observation.stdout.length).toBeLessThanOrEqual(65_536);
  });
});
