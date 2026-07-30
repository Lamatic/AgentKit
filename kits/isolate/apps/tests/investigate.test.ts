import { describe, expect, test } from "bun:test";

import { investigateIssue } from "../lib/investigate";

const issue = {
  url: "https://github.com/acme/cli/issues/1",
  repositoryUrl: "https://github.com/acme/cli",
  owner: "acme",
  repository: "cli",
  number: 1,
  title: "Names look wrong",
  body: "The CLI changes my name.\n\nObserved stdout: `lower`",
  state: "open" as const,
  author: "maintainer",
  labels: ["bug"],
};

const passingRun = {
  passed: true,
  assertions: [
    { kind: "stdout_contains" as const, passed: true, expected: "lower", actual: "lower" },
  ],
  observation: {
    command: "bun run cli",
    exitCode: 0,
    stdout: "lower\n",
    stderr: "",
    durationMs: 12,
  },
};

function harness(options: {
  invalidRepair?: boolean;
  misplacedSeparatorFirst?: boolean;
  plannerFails?: boolean;
  sequentialSeparator?: boolean;
  unsafeFirst?: boolean;
  tuiPlan?: boolean;
} = {}) {
  const calls: string[] = [];
  const createInputs: unknown[] = [];
  const plannerInputs: Array<{ policyFeedback?: string }> = [];
  const probeCommands: string[] = [];
  let plannerCalls = 0;
  let probeIndex = 0;
  const runtime = {
    create: async (input: unknown) => {
      createInputs.push(input);
      return { sandboxId: "sandbox_1", workspace: "workspace/repo" as const };
    },
    resetWorkspace: async () => {
      calls.push("reset");
    },
    runProbe: async (input: { probe: { command: string } }) => {
      calls.push("probe");
      probeCommands.push(input.probe.command);
      probeIndex += 1;
      if (probeIndex === 1) {
        return {
          ...passingRun,
          observation: { ...passingRun.observation, stdout: "README and package context" },
        };
      }
      if (probeIndex === 2) return passingRun;
      if (probeIndex < 4) return passingRun;
      return { ...passingRun, passed: false };
    },
    prepareTuiWorkspace: async () => {
      calls.push("prepare-tui");
    },
    resetTuiWorkspace: async () => {
      calls.push("reset-tui");
    },
    runTuiUnsavedExitProbe: async (input: { saveBeforeQuit: boolean }) => {
      calls.push(input.saveBeforeQuit ? "tui-control" : "tui-candidate");
      const passed = !input.saveBeforeQuit;
      return {
        passed,
        assertions: [{
          kind: "file_unchanged_after_tui_exit" as const,
          passed,
          expected: "process exited and unsaved fixture stayed unchanged",
          actual: passed
            ? "process exited and fixture stayed unchanged"
            : "process exited and fixture changed",
        }],
        observation: {
          command: "bun run cli -- .isolate-reproduction.md",
          exitCode: 0,
          stdout: "",
          stderr: "",
          durationMs: 5,
        },
      };
    },
    delete: async () => {
      calls.push("delete");
      return { deleted: true as const, sandboxId: "sandbox_1" };
    },
  };
  const planner = async (input: { policyFeedback?: string }) => {
    plannerInputs.push(input);
    plannerCalls += 1;
    if (options.plannerFails) throw new Error("planner unavailable");
    if (options.tuiPlan) {
      return {
        mode: "tui_unsaved_exit" as const,
        hypothesis: "Ctrl+Q exits while the editor is dirty.",
        setupCommand: "bun run build",
        command: "bun run cli",
      };
    }
    if (options.misplacedSeparatorFirst && plannerCalls === 1) {
      return {
        hypothesis: "Case is normalized unexpectedly.",
        candidateCommand: "bun run cli greet -- IsolateCLI",
        controlCommand: "bun run cli greet -- world",
      };
    }
    if (options.sequentialSeparator) {
      return {
        hypothesis: "Case is normalized unexpectedly.",
        candidateCommand: "bun run service & sleep 0.5; bun run cli -- IsolateCLI",
        controlCommand: "bun run service & sleep 0.5; bun run cli -- world",
      };
    }
    if (options.unsafeFirst && plannerCalls === 1) {
      return {
        hypothesis: "Case is normalized unexpectedly.",
        candidateCommand: "bun --eval 'console.log(1)'",
        controlCommand: "bun run cli -- --preserve-case",
      };
    }
    if (options.invalidRepair) {
      return {
        hypothesis: "Case is normalized unexpectedly.",
        candidateCommand: "bun run cli",
        controlCommand: "bun run cli",
      };
    }
    return {
      hypothesis: "Case is normalized unexpectedly.",
      candidateCommand: "bun run cli",
      controlCommand: "bun run cli -- --preserve-case",
    };
  };
  return {
    calls,
    createInputs,
    plannerInputs,
    probeCommands,
    runtime,
    planner,
    plannerCallCount: () => plannerCalls,
  };
}

describe("investigateIssue", () => {
  test("runs a Lamatic-authored plan through the deterministic evidence gate", async () => {
    const { calls, createInputs, probeCommands, runtime, planner } = harness();
    const result = await investigateIssue(
      { issueUrl: issue.url },
      { issueReader: { read: async () => issue }, runtime, planner },
    );

    expect(result.outcome).toBe("reproduced");
    expect(result.hypothesis).toBe("Case is normalized unexpectedly.");
    expect(result.gate).toEqual({
      repeatCount: 2,
      allCandidateRunsPassed: true,
      controlRejected: true,
    });
    expect(calls.at(-1)).toBe("delete");
    expect(createInputs).toEqual([
      { repositoryUrl: "https://github.com/acme/cli" },
    ]);
    expect(result.ref).toBe("default");
    expect(probeCommands[0]).toContain("-name 'package.json'");
    expect(probeCommands[0]).toContain("-not -path '*/node_modules/*'");
  });

  test("deletes the sandbox when Lamatic planning fails", async () => {
    const { calls, runtime, planner } = harness({ plannerFails: true });

    await expect(
      investigateIssue(
        { issueUrl: issue.url },
        { issueReader: { read: async () => issue }, runtime, planner },
      ),
    ).rejects.toThrow("planner unavailable");
    expect(calls.at(-1)).toBe("delete");
  });

  test("repairs one unsafe Lamatic plan before certification", async () => {
    const { runtime, planner, plannerCallCount, probeCommands } = harness({
      unsafeFirst: true,
    });

    const result = await investigateIssue(
      { issueUrl: issue.url },
      { issueReader: { read: async () => issue }, runtime, planner },
    );

    expect(result.outcome).toBe("reproduced");
    expect(plannerCallCount()).toBe(2);
    expect(probeCommands).not.toContain("bun --eval 'console.log(1)'");
  });

  test("repairs a misplaced runner separator before executing certification", async () => {
    const { runtime, planner, plannerCallCount, probeCommands } = harness({
      misplacedSeparatorFirst: true,
    });

    const result = await investigateIssue(
      { issueUrl: issue.url },
      { issueReader: { read: async () => issue }, runtime, planner },
    );

    expect(result.outcome).toBe("reproduced");
    expect(plannerCallCount()).toBe(2);
    expect(probeCommands).not.toContain("bun run cli greet -- IsolateCLI");
  });

  test("normalizes safe sequential runner commands without another model call", async () => {
    const { runtime, planner, plannerCallCount, probeCommands } = harness({
      sequentialSeparator: true,
    });

    const result = await investigateIssue(
      { issueUrl: issue.url },
      { issueReader: { read: async () => issue }, runtime, planner },
    );

    expect(result.outcome).toBe("reproduced");
    expect(plannerCallCount()).toBe(1);
    expect(probeCommands).toContain(
      "bun run service & sleep 0.5 && bun run cli -- IsolateCLI",
    );
  });

  test("fails safely after one invalid repair without executing either plan", async () => {
    const { calls, runtime, planner, plannerCallCount, probeCommands } = harness({
      unsafeFirst: true,
      invalidRepair: true,
    });

    await expect(
      investigateIssue(
        { issueUrl: issue.url },
        { issueReader: { read: async () => issue }, runtime, planner },
      ),
    ).rejects.toThrow("different cases");

    expect(plannerCallCount()).toBe(2);
    expect(probeCommands).toHaveLength(1);
    expect(calls.at(-1)).toBe("delete");
  });

  test("returns an evidence-based report for a vague issue without a confirmed signature", async () => {
    const { calls, runtime, planner } = harness();
    const vagueIssue = { ...issue, body: "The CLI changes my name unexpectedly." };

    const result = await investigateIssue(
      { issueUrl: vagueIssue.url },
      {
        issueReader: { read: async () => vagueIssue },
        runtime,
        planner,
        reporter: async () => ({
          outcome: "likely_reproduced" as const,
          summary: "The narrow preview splits a word between lines.",
          expectedBehavior: "Wrap at a word boundary.",
          actualBehavior: "The word is split after its twentieth character.",
          reproductionSteps: ["Run the repository CLI at a narrow width."],
          evidence: ["Both candidate runs produced the same split output."],
          limitations: ["Conclusion is model-interpreted, not runtime-certified."],
          markdown: "# Isolate investigation report\n\nLikely reproduced.",
        }),
      },
    );

    expect(result.outcome).toBe("likely_reproduced");
    expect(result.verdictOwner).toBe("lamatic");
    expect(result.report.content).toContain("Likely reproduced");
    expect(result.evidence.candidateRuns).toHaveLength(2);
    expect(calls).toContain("probe");
    expect(calls.at(-1)).toBe("delete");
  });

  test("certifies an ordinary TUI unsaved-exit issue without a formatted output signature", async () => {
    const { calls, plannerInputs, runtime, planner } = harness({ tuiPlan: true });
    const tuiIssue = {
      ...issue,
      title: "ctrl + Q exits without any save warning",
      body: "When exiting the TUI, it exits instantly without the content saved or giving any warning.",
    };

    const result = await investigateIssue(
      { issueUrl: tuiIssue.url },
      { issueReader: { read: async () => tuiIssue }, runtime, planner },
    );

    expect(result.outcome).toBe("reproduced");
    expect(calls).toContain("prepare-tui");
    expect(calls.filter((call) => call === "tui-candidate")).toHaveLength(2);
    expect(calls).toContain("tui-control");
    expect(calls.at(-1)).toBe("delete");
    expect(plannerInputs[0]?.policyFeedback).toMatch(
      /repository-defined environment variable[\s\S]*never downloads[\s\S]*effective working directory[\s\S]*bun --cwd/,
    );
  });

  test("fails closed when sandbox deletion cannot be confirmed", async () => {
    const { runtime, planner } = harness();
    const cleanupFailure = {
      ...runtime,
      delete: async () => {
        throw new Error("sandbox cleanup failed");
      },
    };

    await expect(
      investigateIssue(
        { issueUrl: issue.url },
        { issueReader: { read: async () => issue }, runtime: cleanupFailure, planner },
      ),
    ).rejects.toThrow("sandbox cleanup failed");
  });
});
