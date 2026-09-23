// Flowcell demo: four scenarios, four terminal outputs. No UI required.
// Run with: npm run demo
// Uses an in-memory mocked transport — no Lamatic credentials needed.

import { createResilientClient } from "./resilientClient";
import type { CallFlowFn, ResilientClientConfig } from "./types";

/** Default client config for the demo scenarios (no sleeping between retries). */
function makeConfig(overrides: Partial<ResilientClientConfig> = {}): ResilientClientConfig {
  return {
    primaryFlowId: "demo-primary",
    fallbackFlowId: "demo-fallback",
    retry: {
      maxAttempts: 3,
      baseDelayMs: 10,
      maxDelayMs: 100,
      jitter: false,
      respectRetryAfter: true,
    },
    failureThreshold: 3,
    cooldownMs: 60_000,
    runawayGuard: { maxEstimatedUsd: 1.0 },
    ...overrides,
  };
}

/** Queue-driven mock: each entry is a success value or an error to throw. */
function mockTransport(queue: Array<{ ok: boolean; value: unknown }>): CallFlowFn {
  return async <T>(flowId: string, _input: unknown): Promise<T> => {
    const next = queue.shift();
    if (!next) throw Object.assign(new Error("mock queue exhausted"), { httpStatus: 500 });
    if (next.ok) return { flow: flowId, ...(next.value as Record<string, unknown>) } as T;
    throw next.value;
  };
}

/** Build a throwable HTTP error for the mock transport queue. */
function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { httpStatus: status });
}

/** No-op sleeper so the demo runs instantly. */
const noSleep = () => Promise.resolve();

/** Scenario 1: transient 500s followed by success. */
async function scenario1() {
  console.log("--- 1. Retry recovers a transient failure ---");
  const client = createResilientClient(
    makeConfig(),
    mockTransport([
      { ok: false, value: httpError(500, "upstream 500") },
      { ok: false, value: httpError(500, "upstream 500") },
      { ok: true, value: { answer: "A circuit breaker stops calls to a failing service." } },
    ]),
    noSleep,
  );
  console.log(JSON.stringify(await client.execute({ query: "What is a circuit breaker?" }), null, 2));
}

/** Scenario 2: failures trip the breaker; next call skips primary. */
async function scenario2() {
  console.log("--- 2. Circuit opens → fallback (circuit_open) ---");
  const client = createResilientClient(
    makeConfig({ failureThreshold: 2 }),
    mockTransport([
      { ok: false, value: httpError(500, "boom") },
      { ok: false, value: httpError(500, "boom") },
      { ok: true, value: { answer: "[fallback] short answer" } },
      { ok: true, value: { answer: "[fallback] short answer" } },
    ]),
    noSleep,
  );
  // First call: 2 primary failures trip the breaker (threshold 2), then fallback.
  await client.execute({ query: "trip" });
  console.log("breaker state after failures:", client.getBreakerState());
  // Second call: breaker OPEN, primary untouched → circuit_open.
  const result = await client.execute({ query: "q" });
  console.log(JSON.stringify(result, null, 2));
}

/** Scenario 3: all primary attempts fail within one call. */
async function scenario3() {
  console.log("--- 3. Retries exhausted → fallback (retries_exhausted) ---");
  const client = createResilientClient(
    makeConfig({ failureThreshold: 10 }),
    mockTransport([
      { ok: false, value: httpError(503, "service unavailable") },
      { ok: false, value: httpError(503, "service unavailable") },
      { ok: false, value: httpError(503, "service unavailable") },
      { ok: true, value: { answer: "[fallback] short answer" } },
    ]),
    noSleep,
  );
  console.log(JSON.stringify(await client.execute({ query: "q" }), null, 2));
}

/** Scenario 4: estimated spend ceiling refuses the call up front. */
async function scenario4() {
  console.log("--- 4. Runaway guard refuses the call ---");
  const client = createResilientClient(
    makeConfig({ runawayGuard: { maxEstimatedUsd: 0.000000001 } }),
    mockTransport([{ ok: true, value: { answer: "never reached" } }]),
    noSleep,
  );
  console.log(JSON.stringify(await client.execute({ query: "q" }), null, 2));
}

await scenario1();
await scenario2();
await scenario3();
await scenario4();
