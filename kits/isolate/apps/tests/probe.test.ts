import { describe, expect, test } from "bun:test";

import { evaluateProbe } from "../lib/runtime/probe";

describe("evaluateProbe", () => {
  test("certifies a reproduction only when every assertion matches observed evidence", () => {
    const result = evaluateProbe(
      {
        command: "bun test regression.test.ts",
        assertions: [
          { kind: "exit_code", equals: 1 },
          { kind: "stderr_contains", value: "Expected 200, received 500" },
        ],
      },
      {
        exitCode: 1,
        stdout: "1 test failed\n",
        stderr: "AssertionError: Expected 200, received 500\n",
        durationMs: 241,
      },
    );

    expect(result).toEqual({
      passed: true,
      assertions: [
        { kind: "exit_code", passed: true, expected: 1, actual: 1 },
        {
          kind: "stderr_contains",
          passed: true,
          expected: "Expected 200, received 500",
          actual: "AssertionError: Expected 200, received 500\n",
        },
      ],
      observation: {
        command: "bun test regression.test.ts",
        exitCode: 1,
        stdout: "1 test failed\n",
        stderr: "AssertionError: Expected 200, received 500\n",
        durationMs: 241,
      },
    });
  });

  test("refuses certification when one assertion disagrees with the evidence", () => {
    const result = evaluateProbe(
      {
        command: "node cli.js --format json",
        assertions: [
          { kind: "exit_code", equals: 0 },
          { kind: "stdout_contains", value: "TypeError" },
        ],
      },
      {
        exitCode: 0,
        stdout: '{"ok":true}\n',
        stderr: "",
        durationMs: 18,
      },
    );

    expect(result.passed).toBe(false);
    expect(result.assertions).toEqual([
      { kind: "exit_code", passed: true, expected: 0, actual: 0 },
      {
        kind: "stdout_contains",
        passed: false,
        expected: "TypeError",
        actual: '{"ok":true}\n',
      },
    ]);
  });
});
