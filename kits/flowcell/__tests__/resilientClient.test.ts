import { describe, expect, it } from "vitest";
import { createResilientClient } from "../src/resilientClient.js";
import type {
  CallFlowFn,
  ResilientClientConfig,
} from "../src/types.js";
import { FlowcellExhaustedError } from "../src/types.js";

function makeConfig(
  overrides: Partial<ResilientClientConfig> = {},
): ResilientClientConfig {
  return {
    primaryFlowId: "demo-primary",
    fallbackFlowId: "demo-fallback",
    retry: {
      maxAttempts: 3,
      baseDelayMs: 1,
      maxDelayMs: 5,
      jitter: false,
      respectRetryAfter: true,
    },
    failureThreshold: 10,
    cooldownMs: 60_000,
    runawayGuard: { maxEstimatedUsd: 100 },
    ...overrides,
  };
}

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { httpStatus: status });
}

function mockTransport(
  queue: Array<{ ok: boolean; value: unknown }>,
  seen: string[] = [],
): CallFlowFn {
  return async <T>(flowId: string, _input: unknown): Promise<T> => {
    seen.push(flowId);
    const next = queue.shift();
    if (!next) throw httpError(500, "mock queue exhausted");
    if (next.ok) return next.value as T;
    throw next.value;
  };
}

const noSleep = () => Promise.resolve();

describe("resilientClient end to end", () => {
  it("primary success on first try", async () => {
    const client = createResilientClient(
      makeConfig(),
      mockTransport([{ ok: true, value: { answer: "hi" } }]),
      noSleep,
    );
    const res = await client.execute<{ answer: string }>({ query: "q" });
    expect(res.path).toBe("primary");
    expect(res.attempts).toBe(1);
    expect(res.data).toEqual({ answer: "hi" });
    expect(res.fallback).toBeUndefined();
    expect(res.latencyMs).toBeGreaterThanOrEqual(0);
    expect(res.estimatedCostUsd).toBeGreaterThan(0);
  });

  it("retry recovers a transient failure", async () => {
    const client = createResilientClient(
      makeConfig(),
      mockTransport([
        { ok: false, value: httpError(500, "boom") },
        { ok: false, value: httpError(500, "boom") },
        { ok: true, value: { answer: "recovered" } },
      ]),
      noSleep,
    );
    const res = await client.execute({ query: "q" });
    expect(res.path).toBe("retried");
    expect(res.attempts).toBe(3);
    expect(res.data).toEqual({ answer: "recovered" });
  });

  it("non-retryable primary error goes straight to fallback (retries_exhausted)", async () => {
    const seen: string[] = [];
    const client = createResilientClient(
      makeConfig(),
      mockTransport(
        [
          { ok: false, value: httpError(400, "bad request") },
          { ok: true, value: { answer: "[fallback] short" } },
        ],
        seen,
      ),
      noSleep,
    );
    const res = await client.execute({ query: "q" });
    expect(res.path).toBe("fallback");
    expect(res.attempts).toBe(1);
    expect(res.fallback).toEqual({ reason: "retries_exhausted", attempts: 1 });
    expect(seen).toEqual(["demo-primary", "demo-fallback"]);
  });

  it("retries exhausted after maxAttempts → fallback (retries_exhausted)", async () => {
    const client = createResilientClient(
      makeConfig({ failureThreshold: 100 }),
      mockTransport([
        { ok: false, value: httpError(503, "down") },
        { ok: false, value: httpError(503, "down") },
        { ok: false, value: httpError(503, "down") },
        { ok: true, value: { answer: "[fallback] short" } },
      ]),
      noSleep,
    );
    const res = await client.execute({ query: "q" });
    expect(res.path).toBe("fallback");
    expect(res.attempts).toBe(3);
    expect(res.fallback).toEqual({ reason: "retries_exhausted", attempts: 1 });
  });

  it("open circuit skips primary entirely (circuit_open)", async () => {
    const seen: string[] = [];
    const client = createResilientClient(
      makeConfig({ failureThreshold: 2 }),
      mockTransport(
        [
          { ok: false, value: httpError(500, "boom") },
          { ok: false, value: httpError(500, "boom") },
          { ok: true, value: { answer: "[fallback] 1" } },
          { ok: true, value: { answer: "[fallback] 2" } },
        ],
        seen,
      ),
      noSleep,
    );
    await client.execute({ query: "trip" });
    expect(client.getBreakerState()).toBe("OPEN");
    const res = await client.execute({ query: "q" });
    expect(res.path).toBe("fallback");
    expect(res.attempts).toBe(0);
    expect(res.fallback).toEqual({ reason: "circuit_open", attempts: 1 });
    // Primary touched twice (first call), never in the second call.
    expect(seen).toEqual([
      "demo-primary",
      "demo-primary",
      "demo-fallback",
      "demo-fallback",
    ]);
  });

  it("ledger charges every attempt, including failed ones", async () => {
    const client = createResilientClient(
      makeConfig(),
      mockTransport([
        { ok: false, value: httpError(500, "boom") },
        { ok: true, value: { answer: "recovered" } },
      ]),
      noSleep,
    );
    const res = await client.execute({ query: "q" });
    expect(res.path).toBe("retried");
    // Two primary attempts ran: ledger must match the reported estimate.
    expect(client.getSpentUsd()).toBeCloseTo(res.estimatedCostUsd, 10);
  });

  it("runaway guard refuses before any network call", async () => {
    const seen: string[] = [];
    const client = createResilientClient(
      makeConfig({ runawayGuard: { maxEstimatedUsd: 0.000000001 } }),
      mockTransport([{ ok: true, value: { answer: "never" } }], seen),
      noSleep,
    );
    const res = await client.execute({ query: "q" });
    expect(res.path).toBe("capped");
    expect(res.attempts).toBe(0);
    expect(res.data).toBeNull();
    expect(res.estimatedCostUsd).toBe(0);
    expect(seen).toEqual([]);
  });

  it("fallback failure throws FlowcellExhaustedError", async () => {
    const client = createResilientClient(
      makeConfig({ failureThreshold: 100 }),
      mockTransport([
        { ok: false, value: httpError(500, "primary down") },
        { ok: false, value: httpError(500, "primary down") },
        { ok: false, value: httpError(500, "primary down") },
        { ok: false, value: httpError(500, "fallback down") },
      ]),
      noSleep,
    );
    await expect(client.execute({ query: "q" })).rejects.toBeInstanceOf(
      FlowcellExhaustedError,
    );
  });
});
