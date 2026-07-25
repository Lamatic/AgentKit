import { describe, expect, test } from "bun:test";

import { runCertification } from "../lib/runtime/certification";
import { evaluateProbe, type ProbeSpec } from "../lib/runtime/probe";

describe("runCertification", () => {
  const deadline = {
    probeTimeoutSeconds: (maximumSeconds: number) => maximumSeconds,
  };
  test("evaluates candidate and control against one shared issue assertion", async () => {
    const probes: ProbeSpec[] = [];
    const runtime = {
      resetWorkspace: async () => undefined,
      runProbe: async ({ probe }: { probe: ProbeSpec }) => {
        probes.push(probe);
        return evaluateProbe(probe, {
          exitCode: 0,
          stdout: probes.length < 3 ? "Hello, isolatecli!\n" : "Hello, control!\n",
          stderr: "",
          durationMs: 5,
        });
      },
    };

    const result = await runCertification({
      runtime,
      sandboxId: "sandbox_1",
      workspace: "workspace/repo",
      deadline,
      candidateCommand: "bun run cli IsolateCLI",
      controlCommand: "bun run cli control",
      assertion: { kind: "stdout_contains", value: "Hello, isolatecli!" },
    });

    expect(result.outcome).toBe("reproduced");
    expect(probes.map(({ assertions }) => assertions)).toEqual([
      [{ kind: "stdout_contains", value: "Hello, isolatecli!" }],
      [{ kind: "stdout_contains", value: "Hello, isolatecli!" }],
      [{ kind: "stdout_contains", value: "Hello, isolatecli!" }],
    ]);
  });

  test("rejects an identical candidate and control", async () => {
    await expect(
      runCertification({
        runtime: {
          resetWorkspace: async () => undefined,
          runProbe: async () => { throw new Error("not reached"); },
        },
        sandboxId: "sandbox_1",
        workspace: "workspace/repo",
        deadline,
        candidateCommand: "bun test",
        controlCommand: "bun test",
        assertion: { kind: "stderr_contains", value: "failure reproduced" },
      }),
    ).rejects.toThrow("different cases");
  });

  test("rejects a command that prints the reported signature", async () => {
    await expect(
      runCertification({
        runtime: {
          resetWorkspace: async () => undefined,
          runProbe: async () => { throw new Error("not reached"); },
        },
        sandboxId: "sandbox_1",
        workspace: "workspace/repo",
        deadline,
        candidateCommand: "printf 'Hello, isolatecli!'",
        controlCommand: "bun run cli control",
        assertion: { kind: "stdout_contains", value: "Hello, isolatecli!" },
      }),
    ).rejects.toThrow("command policy");
  });
});
