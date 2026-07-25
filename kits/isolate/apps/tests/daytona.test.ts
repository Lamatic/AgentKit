import { describe, expect, spyOn, test } from "bun:test";

import { DaytonaSandboxRuntime } from "../lib/runtime/daytona";
import { InvestigationDeadline } from "../lib/deadline";

function fakeDaytona(commandResults: Array<{ exitCode: number; result: string }> = []) {
  const calls: Array<{ name: string; args: unknown[] }> = [];
  const sandbox = {
    id: "sandbox_123",
    process: {
      executeCommand: async (...args: unknown[]) => {
        calls.push({ name: "executeCommand", args });
        if (String(args[0]).startsWith("git clone ")) {
          return { exitCode: 0, result: "cloned" };
        }
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
    updateNetworkSettings: async (...args: unknown[]) =>
      calls.push({ name: "updateNetworkSettings", args }),
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
            name: expect.stringMatching(/^isolate-/),
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
        name: "executeCommand",
        args: [
          "git clone --depth 1 --branch 'main' -- 'https://github.com/example/buggy-cli' 'workspace/repo'",
          ".",
          undefined,
          30,
        ],
      },
      {
        name: "updateNetworkSettings",
        args: ["sandbox_123", { networkBlockAll: true }, expect.any(AbortSignal)],
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
    sandbox.process.executeCommand = async (...args: unknown[]) => {
      calls.push({ name: "executeCommand", args });
      return { exitCode: 1, result: "clone failed" };
    };
    const runtime = new DaytonaSandboxRuntime(client);

    await expect(
      runtime.create({ repositoryUrl: "https://github.com/example/missing" }),
    ).rejects.toThrow("Repository cloning failed");

    expect(calls.map(({ name }) => name)).toEqual([
      "create",
      "executeCommand",
      "delete",
    ]);
    expect(calls[2]?.args.slice(1)).toEqual([15, true]);
  });

  test("recovers and deletes a sandbox whose create resolves after the work deadline", async () => {
    const { client, calls, sandbox } = fakeDaytona();
    client.create = async (...args: unknown[]) => {
      calls.push({ name: "create", args });
      await new Promise((resolve) => setTimeout(resolve, 30));
      return sandbox;
    };
    const runtime = new DaytonaSandboxRuntime(client);
    const deadline = new InvestigationDeadline(35_010);

    await expect(
      runtime.create(
        { repositoryUrl: "https://github.com/example/buggy-cli" },
        deadline,
      ),
    ).rejects.toThrow("execution budget");
    expect(calls.some(({ name }) => name === "delete")).toBe(true);
  });

  test("accepts a Daytona tier that already enforces network isolation", async () => {
    const { client, sandbox } = fakeDaytona();
    client.updateNetworkSettings = async () => {
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
    await runtime.create({ repositoryUrl: "https://github.com/example/buggy-cli" });

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
      name: "executeCommand",
      args: [
        `git clone --depth 1 -- 'https://github.com/example/buggy-cli' 'workspace/repo' && git -C 'workspace/repo' fetch --depth 1 origin '${commit}' && git -C 'workspace/repo' checkout --detach '${commit}'`,
        ".",
        undefined,
        30,
      ],
    });
    expect(calls[2]).toEqual({
      name: "updateNetworkSettings",
      args: ["sandbox_123", { networkBlockAll: true }, expect.any(AbortSignal)],
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
    await runtime.create({ repositoryUrl: "https://github.com/example/buggy-cli" });

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
    expect(calls.some(({ name }) => name === "get")).toBe(false);
    const probeCalls = calls.filter(
      ({ name, args }) =>
        name === "executeCommand" && !String(args[0]).startsWith("git clone "),
    );
    expect(probeCalls).toHaveLength(4);
    expect(
      probeCalls[1]?.args.at(-1),
    ).toBe(45);
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
    await runtime.create({ repositoryUrl: "https://github.com/example/buggy-cli" });

    await runtime.resetWorkspace({
      sandboxId: "sandbox_123",
      workspace: "workspace/repo",
      timeoutSeconds: 20,
    });

    expect(calls[3]).toEqual({
      name: "executeCommand",
      args: [
        "git reset --hard HEAD && git clean -fdx",
        "workspace/repo",
        undefined,
        10,
      ],
    });
    expect(calls[4]).toEqual({
      name: "updateNetworkSettings",
      args: [
        "sandbox_123",
        {
          networkBlockAll: false,
          domainAllowList:
            "registry.npmjs.org,registry.npmjs.com,registry.yarnpkg.com,npm.pkg.github.com",
        },
        expect.any(AbortSignal),
      ],
    });
    expect(calls[5]).toEqual({
      name: "executeCommand",
      args: [
        expect.stringContaining("yarn install --frozen-lockfile"),
        "workspace/repo",
        undefined,
        20,
      ],
    });
    expect(calls[6]).toEqual({
      name: "updateNetworkSettings",
      args: ["sandbox_123", { networkBlockAll: true }, expect.any(AbortSignal)],
    });
  });

  test("explicitly unblocks a block-all sandbox before allowing registries", async () => {
    const { client, sandbox } = fakeDaytona();
    let blocked = true;
    client.updateNetworkSettings = async (...args: unknown[]) => {
      const settings = args[1] as {
        networkBlockAll?: boolean;
        domainAllowList?: string;
      };
      if (settings.domainAllowList && blocked && settings.networkBlockAll !== false) {
        throw new Error("allowlist cannot override block-all");
      }
      if (settings.networkBlockAll !== undefined) blocked = settings.networkBlockAll;
      return 0;
    };
    const runtime = new DaytonaSandboxRuntime(client);
    await runtime.create({ repositoryUrl: "https://github.com/example/buggy-cli" });

    await expect(
      runtime.resetWorkspace({
        sandboxId: "sandbox_123",
        workspace: "workspace/repo",
        timeoutSeconds: 20,
      }),
    ).resolves.toBeUndefined();
    expect(blocked).toBe(true);
  });

  test("uses the cleanup reserve to re-block network access", async () => {
    let now = 0;
    const { client, sandbox } = fakeDaytona();
    const policies: Array<{ networkBlockAll?: boolean; domainAllowList?: string }> = [];
    client.updateNetworkSettings = async (...args: unknown[]) => {
      const settings = args[1];
      policies.push(settings as { networkBlockAll?: boolean; domainAllowList?: string });
      return 0;
    };
    const runtime = new DaytonaSandboxRuntime(client, () => now);
    const deadline = new InvestigationDeadline(35_100, () => now);
    await runtime.create(
      { repositoryUrl: "https://github.com/example/buggy-cli" },
      deadline,
    );
    const execute = sandbox.process.executeCommand;
    sandbox.process.executeCommand = async (...args: unknown[]) => {
      const result = await execute(...args);
      if (String(args[0]).includes("install --frozen-lockfile")) now = 101;
      return result;
    };

    await expect(
      runtime.resetWorkspace(
        {
          sandboxId: "sandbox_123",
          workspace: "workspace/repo",
          timeoutSeconds: 20,
        },
        deadline,
      ),
    ).resolves.toBeUndefined();
    expect(policies.at(-1)).toEqual({ networkBlockAll: true });
  });

  test("uses the cleanup reserve to remove probe artifacts", async () => {
    let now = 0;
    const { client, calls, sandbox } = fakeDaytona();
    const runtime = new DaytonaSandboxRuntime(client, () => now);
    const deadline = new InvestigationDeadline(35_100, () => now);
    await runtime.create(
      { repositoryUrl: "https://github.com/example/buggy-cli" },
      deadline,
    );
    const execute = sandbox.process.executeCommand;
    sandbox.process.executeCommand = async (...args: unknown[]) => {
      const result = await execute(...args);
      if (String(args[0]).startsWith("printf '%s'")) now = 101;
      return result;
    };

    await expect(
      runtime.runProbe(
        {
          sandboxId: "sandbox_123",
          workspace: "workspace/repo",
          probe: {
            command: "bun test",
            assertions: [{ kind: "exit_code", equals: 0 }],
          },
        },
        deadline,
      ),
    ).rejects.toThrow("execution budget");
    expect(
      calls.some(
        ({ name, args }) =>
          name === "executeCommand" && String(args[0]).startsWith("rm -f "),
      ),
    ).toBe(true);
  });

  test("aborts a delayed network update before deleting the sandbox", async () => {
    const { client, calls } = fakeDaytona();
    client.updateNetworkSettings = async (...args: unknown[]) => {
      const signal = args[2] as AbortSignal;
      return await new Promise<number>((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason));
      });
    };
    const runtime = new DaytonaSandboxRuntime(client);
    const deadline = new InvestigationDeadline(35_020);

    await expect(
      runtime.create(
        { repositoryUrl: "https://github.com/example/buggy-cli" },
        deadline,
      ),
    ).rejects.toThrow("execution budget");
    expect(calls.some(({ name }) => name === "delete")).toBe(true);
  });

  test("fails closed when the workspace cannot be restored", async () => {
    const { client } = fakeDaytona([{ exitCode: 1, result: "reset failed" }]);
    const runtime = new DaytonaSandboxRuntime(client);
    await runtime.create({ repositoryUrl: "https://github.com/example/buggy-cli" });

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
    await runtime.create({ repositoryUrl: "https://github.com/example/buggy-cli" });

    await expect(runtime.delete("sandbox_123")).rejects.toThrow(
      "provider delete failed",
    );
    expect(attempts).toBe(2);
    expect(logged).toHaveBeenCalledTimes(2);
    logged.mockRestore();
  });

  test("deletes using the retained sandbox handle without a provider lookup", async () => {
    const { client, calls } = fakeDaytona();
    client.get = async () => await new Promise(() => undefined);
    const runtime = new DaytonaSandboxRuntime(client);
    await runtime.create({ repositoryUrl: "https://github.com/example/buggy-cli" });

    await expect(runtime.delete("sandbox_123")).resolves.toEqual({
      deleted: true,
      sandboxId: "sandbox_123",
    });
    expect(calls.some(({ name }) => name === "get")).toBe(false);
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
    await runtime.create({ repositoryUrl: "https://github.com/example/buggy-cli" });

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
    await runtime.create({ repositoryUrl: "https://github.com/example/buggy-cli" });

    await runtime.runProbe({
      sandboxId: "sandbox_123",
      workspace: "workspace/repo",
      probe: {
        command: "bun test",
        assertions: [{ kind: "exit_code", equals: 0 }],
      },
    });

    const commands = calls
      .filter(
        ({ name, args }) =>
          name === "executeCommand" && !String(args[0]).startsWith("git clone "),
      )
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
