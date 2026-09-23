import { describe, expect, it } from "vitest";
import { lamaticTransport } from "../src/lamaticTransport.js";
import { isRetryable, toFlowcellError } from "../src/retryPolicy.js";

// Attach shared call log per instance instead:
function makeClient(queue: unknown[]) {
  const calls: Array<{ flowId: string; input: unknown }> = [];
  return {
    calls,
    executeFlow: async (flowId: string, input: unknown) => {
      calls.push({ flowId, input });
      return queue.shift();
    },
  };
}

describe("lamaticTransport", () => {
  it("unwraps the result payload on success envelopes", async () => {
    const client = makeClient([
      { status: "success", result: { answer: "hi" }, statusCode: 200 },
    ]);
    const call = lamaticTransport(client);
    await expect(call("demo-primary", { query: "q" })).resolves.toEqual({
      answer: "hi",
    });
    expect(client.calls).toEqual([{ flowId: "demo-primary", input: { query: "q" } }]);
  });

  it("throws carrying httpStatus on error envelopes", async () => {
    const client = makeClient([
      { status: "error", result: null, message: "FLOWCELL_TEST_HOOK: forced primary failure", statusCode: 400 },
    ]);
    const call = lamaticTransport(client);
    const err = (await call("demo-primary", {}).catch((e: unknown) => e)) as Error & { httpStatus?: number };
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("FLOWCELL_TEST_HOOK: forced primary failure");
    expect(err.httpStatus).toBe(400);
    // …and the retry table classifies it as non-retryable (400).
    expect(isRetryable(toFlowcellError(err))).toBe(false);
  });

  it("maps error-envelope 503 to retryable", async () => {
    const client = makeClient([
      { status: "error", result: null, message: "overloaded", statusCode: 503 },
    ]);
    const call = lamaticTransport(client);
    const err = (await call("demo-primary", {}).catch((e: unknown) => e)) as Error & { httpStatus?: number };
    expect(isRetryable(toFlowcellError(err))).toBe(true);
  });

  it("passes through non-envelope values untouched", async () => {
    const client = makeClient([{ answer: "raw" }, "plain", null]);
    const call = lamaticTransport(client);
    await expect(call("f", {})).resolves.toEqual({ answer: "raw" });
    await expect(call("f", {})).resolves.toBe("plain");
    await expect(call("f", {})).resolves.toBeNull();
  });

  it("throws a default message when the envelope has none", async () => {
    const client = makeClient([{ status: "error", result: null }]);
    const call = lamaticTransport(client);
    const err = (await call("f", {}).catch((e: unknown) => e)) as Error & { httpStatus?: number };
    expect(err.message).toBe("flow returned an error status");
    expect(err.httpStatus).toBeUndefined();
  });
});
