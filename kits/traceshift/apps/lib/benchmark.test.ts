import assert from "node:assert/strict";
import test from "node:test";
import { runDeterministicCacheBenchmark } from "./benchmark";

test("runs a real before-and-after cache workload with identical outputs", () => {
  const result = runDeterministicCacheBenchmark(60, 6, 20_000);
  assert.equal(result.outputAgreement, 1);
  assert.equal(result.baselineCalls, 60);
  assert.equal(result.optimizedCalls, 6);
  assert.equal(result.cacheHits, 54);
});

test("measures benchmark duration rather than using a configured savings factor", () => {
  const result = runDeterministicCacheBenchmark(120, 6, 40_000);
  assert.ok(result.baselineMilliseconds > result.optimizedMilliseconds);
  assert.ok(result.speedup > 1);
});

test("rejects invalid benchmark workloads", () => {
  assert.throws(() => runDeterministicCacheBenchmark(0, 1, 1), /totalRequests/);
  assert.throws(() => runDeterministicCacheBenchmark(10, 0, 1), /uniqueInputs/);
  assert.throws(() => runDeterministicCacheBenchmark(10, 11, 1), /cannot exceed/);
  assert.throws(() => runDeterministicCacheBenchmark(10, 2, 1.5), /iterations/);
});
