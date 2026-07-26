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

function harness(options: { plannerFails?: boolean; unsafeFirst?: boolean } = {}) {
  const calls: string[] = [];
  const createInputs: unknown[] = [];
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
    delete: async () => {
      calls.push("delete");
      return { deleted: true as const, sandboxId: "sandbox_1" };
    },
  };
  const planner = async () => {
    plannerCalls += 1;
    if (options.plannerFails) throw new Error("planner unavailable");
    if (options.unsafeFirst && plannerCalls === 1) {
      return {
        hypothesis: "Case is normalized unexpectedly.",
        candidateCommand: "bun --eval 'console.log(1)'",
        controlCommand: "bun run cli -- --preserve-case",
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
    probeCommands,
    runtime,
    planner,
    plannerCallCount: () => plannerCalls,
  };
}

describe("investigateIssue", () => {
  test("runs a Lamatic-authored plan through the deterministic evidence gate", async () => {
    const { calls, createInputs, runtime, planner } = harness();
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

  test("investigates a vague issue but blocks certification without a confirmed signature", async () => {
    const { calls, runtime, planner } = harness();
    const vagueIssue = { ...issue, body: "The CLI changes my name unexpectedly." };

    await expect(
      investigateIssue(
        { issueUrl: vagueIssue.url },
        { issueReader: { read: async () => vagueIssue }, runtime, planner },
      ),
    ).rejects.toThrow("formed this hypothesis");
    expect(calls).toContain("probe");
    expect(calls.at(-1)).toBe("delete");
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
