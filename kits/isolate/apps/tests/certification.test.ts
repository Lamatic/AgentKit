import { describe, expect, test } from "bun:test";

import { runCertification } from "../lib/runtime/certification";
import { evaluateProbe, type ProbeSpec } from "../lib/runtime/probe";

describe("runCertification", () => {
  test("evaluates candidate and control against one shared issue assertion", async () => {
    const probes: ProbeSpec[] = [];
    const runtime = {
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
      timeoutSeconds: 40,
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
        runtime: { runProbe: async () => { throw new Error("not reached"); } },
        sandboxId: "sandbox_1",
        workspace: "workspace/repo",
        timeoutSeconds: 40,
        candidateCommand: "bun test",
        controlCommand: "bun test",
        assertion: { kind: "stderr_contains", value: "failure reproduced" },
      }),
    ).rejects.toThrow("different cases");
  });

  test("rejects a control that reuses the reported output token", async () => {
    await expect(
      runCertification({
        runtime: { runProbe: async () => { throw new Error("not reached"); } },
        sandboxId: "sandbox_1",
        workspace: "workspace/repo",
        timeoutSeconds: 40,
        candidateCommand: "bun run cli IsolateCLI",
        controlCommand: "bun run cli isolatecli",
        assertion: { kind: "stdout_contains", value: "Hello, isolatecli!" },
      }),
    ).rejects.toThrow("reuses the reported signature");
  });
});
