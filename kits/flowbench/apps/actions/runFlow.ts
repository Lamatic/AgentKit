"use server";

// runFlow — Execute a batch of test cases against a Lamatic flow
//
// CONCURRENCY CHOICE: p-limit is set to 3 concurrent requests.
// Rationale:
//   - Too low (1): test suites with 20+ cases take forever serially.
//   - Too high (10+): risks hammering the Lamatic API with concurrent requests,
//     potentially hitting rate limits or skewing latency measurements due to
//     server-side queuing. Lamatic flows can be LLM-backed (slow, expensive).
//   - 3 is a conservative middle ground: fast enough to run a 20-case suite in
//     ~7 batches, gentle enough to avoid rate-limit issues on shared projects.
//   - This is a v1 default — could be made configurable per flow later.

import pLimit from "p-limit";
import {
  executeFlow,
  type ExecuteFlowResult,
} from "../lib/lamatic-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single test case to run against a flow. */
export interface TestCaseInput {
  /** Unique identifier for this test case (used in reporting). */
  id: string;
  /** The payload to send to the flow (e.g. { userPrompt: "..." }). */
  input: Record<string, unknown>;
  /** The key within `result` to extract as the scored output. */
  resultField: string;
}

/** The result of running a single test case. */
export interface TestCaseRunResult {
  /** Matches the input test case id. */
  id: string;
  /** The extracted output from result[resultField], or null on error. */
  output: string | null;
  /** Round-trip latency in ms (0 if the request never completed). */
  latencyMs: number;
  /** Error message if this case failed, null on success. */
  error: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum concurrent requests to the Lamatic API. */
const CONCURRENCY_LIMIT = 3;

/** Per-case timeout in milliseconds. */
const TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Coerce an unknown value from the flow result into a string for scoring.
 * - string   → returned as-is
 * - number/boolean → String()
 * - object/array   → JSON.stringify()
 * - null/undefined → null (treated as missing)
 */
function coerceToString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  // objects, arrays
  return JSON.stringify(value);
}

/**
 * Run a single test case with a 30s timeout enforced via AbortController.
 * Returns a TestCaseRunResult — never throws (errors are captured in the result).
 */
async function runSingleCase(
  flowId: string,
  testCase: TestCaseInput
): Promise<TestCaseRunResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let flowResult: ExecuteFlowResult;
  try {
    flowResult = await executeFlow(flowId, testCase.input, {
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    // Distinguish timeout from other errors
    const isAbort =
      err instanceof DOMException && err.name === "AbortError";
    const message = isAbort
      ? `Timeout: flow did not respond within ${TIMEOUT_MS}ms`
      : err instanceof Error
        ? err.message
        : String(err);

    return {
      id: testCase.id,
      output: null,
      latencyMs: 0,
      error: message,
    };
  }

  clearTimeout(timeoutId);

  // Check if the requested resultField exists in the response
  if (!(testCase.resultField in flowResult.result)) {
    return {
      id: testCase.id,
      output: null,
      latencyMs: flowResult.latencyMs,
      error:
        `Missing resultField "${testCase.resultField}" in flow response. ` +
        `Available keys: [${Object.keys(flowResult.result).join(", ")}]`,
    };
  }

  const rawOutput = flowResult.result[testCase.resultField];
  const output = coerceToString(rawOutput);

  if (output === null) {
    return {
      id: testCase.id,
      output: null,
      latencyMs: flowResult.latencyMs,
      error: `resultField "${testCase.resultField}" exists but is null/undefined`,
    };
  }

  return {
    id: testCase.id,
    output,
    latencyMs: flowResult.latencyMs,
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run a batch of test cases against a Lamatic flow with bounded concurrency.
 *
 * Each test case is executed independently — a failure in one case does not
 * affect the others. Errors (network, timeout, missing field) are captured
 * in the result's `error` field rather than thrown.
 *
 * @param flowId    - The Lamatic workflow/flow ID to execute.
 * @param testCases - Array of test cases to run.
 * @returns Array of results in the same order as the input test cases.
 */
export async function runFlow(
  flowId: string,
  testCases: TestCaseInput[]
): Promise<TestCaseRunResult[]> {
  const limit = pLimit(1);

  const promises = testCases.map((testCase) =>
    limit(() => runSingleCase(flowId, testCase))
  );

  // Promise.all is safe here because runSingleCase never rejects —
  // all errors are captured in the TestCaseRunResult.error field.
  return Promise.all(promises);
}
