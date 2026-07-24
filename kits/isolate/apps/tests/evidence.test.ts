import { describe, expect, test } from "bun:test";

import { certifyEvidence } from "../lib/runtime/evidence";

const passingRun = {
  passed: true,
  assertions: [
    { kind: "exit_code" as const, passed: true, expected: 1, actual: 1 },
  ],
  observation: {
    command: "bun test repro.test.ts",
    exitCode: 1,
    stdout: "",
    stderr: "bug observed\n",
    durationMs: 20,
  },
};

const failingControl = {
  passed: false,
  assertions: [
    { kind: "exit_code" as const, passed: false, expected: 1, actual: 0 },
  ],
  observation: {
    command: "bun test control.test.ts",
    exitCode: 0,
    stdout: "control passed\n",
    stderr: "",
    durationMs: 15,
  },
};

describe("certifyEvidence", () => {
  test("certifies only two successful candidate runs with a rejecting control", () => {
    const report = certifyEvidence({
      candidateRuns: [passingRun, passingRun],
      controlRun: failingControl,
    });

    expect(report).toMatchObject({
      outcome: "reproduced",
      gate: {
        repeatCount: 2,
        allCandidateRunsPassed: true,
        controlRejected: true,
      },
    });
  });

  test("does not certify a flaky candidate", () => {
    const report = certifyEvidence({
      candidateRuns: [passingRun, { ...passingRun, passed: false }],
      controlRun: failingControl,
    });

    expect(report.outcome).toBe("not_reproduced_under_tested_conditions");
    expect(report.gate.allCandidateRunsPassed).toBe(false);
  });

  test("does not certify a non-specific probe that also passes its control", () => {
    const report = certifyEvidence({
      candidateRuns: [passingRun, passingRun],
      controlRun: passingRun,
    });

    expect(report.outcome).toBe("not_reproduced_under_tested_conditions");
    expect(report.gate.controlRejected).toBe(false);
  });
});
