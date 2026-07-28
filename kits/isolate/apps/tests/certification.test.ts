import { describe, expect, test } from "bun:test";

import {
  runCertification,
  runTuiUnsavedExitCertification,
} from "../lib/runtime/certification";
import { evaluateProbe, type ProbeSpec } from "../lib/runtime/probe";
import { InvestigationDeadline } from "../lib/deadline";

describe("runCertification", () => {
  const deadline = new InvestigationDeadline();
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

  test("certifies a TUI unsaved exit through runtime-owned repeat and save control", async () => {
    const scenarios: Array<{ saveBeforeQuit: boolean }> = [];
    const setupTimeouts: number[] = [];
    const runtime = {
      prepareTuiWorkspace: async ({ timeoutSeconds }: { timeoutSeconds: number }) => {
        setupTimeouts.push(timeoutSeconds);
      },
      resetTuiWorkspace: async () => undefined,
      runTuiUnsavedExitProbe: async ({ saveBeforeQuit }: { saveBeforeQuit: boolean }) => {
        scenarios.push({ saveBeforeQuit });
        const passed = !saveBeforeQuit;
        return {
          passed,
          assertions: [
            {
              kind: "file_unchanged_after_tui_exit" as const,
              passed,
              expected: "process exited and unsaved fixture stayed unchanged",
              actual: passed
                ? "process exited and fixture stayed unchanged"
                : "process exited and fixture changed",
            },
          ],
          observation: {
            command: "bun run cli -- .isolate-reproduction.md",
            exitCode: 0,
            stdout: "",
            stderr: "",
            durationMs: 5,
          },
        };
      },
    };

    const result = await runTuiUnsavedExitCertification({
      runtime,
      sandboxId: "sandbox_1",
      workspace: "workspace/repo",
      deadline: new InvestigationDeadline(150_000, () => 0),
      setupCommand: "bun run build",
      command: "bun run cli",
      quitKey: "ctrl_q",
    });

    expect(result.outcome).toBe("reproduced");
    expect(setupTimeouts).toEqual([57]);
    expect(scenarios).toEqual([
      { saveBeforeQuit: false },
      { saveBeforeQuit: false },
      { saveBeforeQuit: true },
    ]);
  });
});
