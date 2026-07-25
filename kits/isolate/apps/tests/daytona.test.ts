import { describe, expect, spyOn, test } from "bun:test";

import { DaytonaSandboxRuntime } from "../lib/runtime/daytona";

function fakeDaytona(commandResults: Array<{ exitCode: number; result: string }> = []) {
  const calls: Array<{ name: string; args: unknown[] }> = [];
  const sandbox = {
    id: "sandbox_123",
    updateNetworkSettings: async (...args: unknown[]) =>
      calls.push({ name: "updateNetworkSettings", args }),
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
          { timeout: 60 },
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
      {
        name: "updateNetworkSettings",
        args: [{ networkBlockAll: true }],
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
    expect(calls[1]?.args.slice(1)).toEqual([30, true]);
  });

  test("accepts a Daytona tier that already enforces network isolation", async () => {
    const { client, sandbox } = fakeDaytona();
    sandbox.updateNetworkSettings = async () => {
      throw new Error(
        "Network access is restricted and cannot be overridden at the sandbox level.",
      );
    };
    const runtime = new DaytonaSandboxRuntime(client);

    await expect(
      runtime.create({ repositoryUrl: "https://github.com/example/buggy-cli" }),
    ).resolves.toEqual({
      sandboxId: "sandbox_123",
      workspace: "workspace/repo",
    });
  });

  test("fails workspace preparation when deterministic dependency installation fails", async () => {
    const { client } = fakeDaytona([
      { exitCode: 0, result: "reset" },
      { exitCode: 1, result: "install failed" },
    ]);
    const runtime = new DaytonaSandboxRuntime(client);

    await expect(
      runtime.resetWorkspace({
        sandboxId: "sandbox_123",
        workspace: "workspace/repo",
        timeoutSeconds: 20,
      }),
    ).rejects.toThrow("dependency installation failed");
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
    expect(calls[2]).toEqual({
      name: "updateNetworkSettings",
      args: [{ networkBlockAll: true }],
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
      timeoutSeconds: 40,
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
    expect(calls.filter(({ name }) => name === "executeCommand")).toHaveLength(4);
    expect(calls[2]?.args.at(-1)).toBe(45);
  });

  test("rejects unsafe probes before accessing a sandbox", async () => {
    const { client, calls } = fakeDaytona();
    const runtime = new DaytonaSandboxRuntime(client);

    await expect(
      runtime.runProbe({
        sandboxId: "sandbox_123",
        workspace: "workspace/repo",
        probe: {
          command: "git push origin main",
          assertions: [{ kind: "exit_code", equals: 0 }],
        },
      }),
    ).rejects.toThrow("command policy");
    expect(calls).toHaveLength(0);
  });

  test("restores tracked files and removes probe artifacts before certification", async () => {
    const { client, calls } = fakeDaytona();
    const runtime = new DaytonaSandboxRuntime(client);

    await runtime.resetWorkspace({
      sandboxId: "sandbox_123",
      workspace: "workspace/repo",
      timeoutSeconds: 20,
    });

    expect(calls[1]).toEqual({
      name: "executeCommand",
      args: [
        "git reset --hard HEAD && git clean -fdx",
        "workspace/repo",
        undefined,
        10,
      ],
    });
    expect(calls[2]).toEqual({
      name: "updateNetworkSettings",
      args: [{
        domainAllowList:
          "registry.npmjs.org,registry.npmjs.com,registry.yarnpkg.com,npm.pkg.github.com",
      }],
    });
    expect(calls[3]).toEqual({
      name: "executeCommand",
      args: [
        expect.stringContaining("yarn install --frozen-lockfile"),
        "workspace/repo",
        undefined,
        20,
      ],
    });
    expect(calls[4]).toEqual({
      name: "updateNetworkSettings",
      args: [{ networkBlockAll: true }],
    });
  });

  test("fails closed when the workspace cannot be restored", async () => {
    const { client } = fakeDaytona([{ exitCode: 1, result: "reset failed" }]);
    const runtime = new DaytonaSandboxRuntime(client);

    await expect(
      runtime.resetWorkspace({
        sandboxId: "sandbox_123",
        workspace: "workspace/repo",
        timeoutSeconds: 20,
      }),
    ).rejects.toThrow("restored cleanly");
  });

  test("logs, retries, and fails closed when sandbox deletion fails", async () => {
    const { client } = fakeDaytona();
    let attempts = 0;
    client.delete = async () => {
      attempts += 1;
      throw new Error("provider delete failed");
    };
    const logged = spyOn(console, "error").mockImplementation(() => undefined);
    const runtime = new DaytonaSandboxRuntime(client);

    await expect(runtime.delete("sandbox_123")).rejects.toThrow(
      "provider delete failed",
    );
    expect(attempts).toBe(2);
    expect(logged).toHaveBeenCalledTimes(2);
    logged.mockRestore();
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
        command: "bun run generate-lots-of-output",
        assertions: [{ kind: "exit_code", equals: 0 }],
      },
    });

    expect(result.observation.stdout).not.toContain("super-secret");
    expect(result.observation.stderr).not.toContain("secret-token");
    expect(result.observation.stdout).toContain("[REDACTED]");
    expect(result.observation.stdout).toEndWith("\n[output truncated]");
    expect(result.observation.stdout.length).toBeLessThanOrEqual(65_536);
  });

  test("caps files before collection and removes every probe artifact", async () => {
    const { client, calls } = fakeDaytona([
      { exitCode: 0, result: "" },
      { exitCode: 0, result: "" },
      {
        exitCode: 0,
        result: JSON.stringify({ exitCode: 0, stdout: "ok", stderr: "" }),
      },
      { exitCode: 0, result: "" },
    ]);
    const runtime = new DaytonaSandboxRuntime(client);

    await runtime.runProbe({
      sandboxId: "sandbox_123",
      workspace: "workspace/repo",
      probe: {
        command: "bun test",
        assertions: [{ kind: "exit_code", equals: 0 }],
      },
    });

    const commands = calls
      .filter(({ name }) => name === "executeCommand")
      .map(({ args }) => String(args[0]));
    const encodedRunner = commands[1]?.match(/Buffer\.from\('([^']+)'/)?.[1];
    const runner = Buffer.from(String(encodedRunner), "base64").toString();
    expect(runner).toContain("const cap=65536");
    expect(runner).toContain("spawn('setsid'");
    expect(runner).toContain("process.kill(-child.pid");
    expect(commands[1]).not.toContain("ulimit");
    expect(commands.at(-1)).toStartWith("rm -f ");
  });
});
