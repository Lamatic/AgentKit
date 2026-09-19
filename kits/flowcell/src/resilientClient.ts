import { CircuitBreaker } from "./circuitBreaker";
import { CostTracker } from "./costTracker";
import { FALLBACK_MODEL_KEY, estimateCallCost } from "./priceTable";
import {
  computeDelay,
  isRetryable,
  parseRetryAfter,
  sleep,
  toFlowcellError,
} from "./retryPolicy";
import type {
  CallFlowFn,
  ExecutionResult,
  FallbackReason,
  ResilientClientConfig,
} from "./types";
import { FlowcellExhaustedError } from "./types";

export type { CallFlowFn, ExecutionResult, ResilientClientConfig };

export function createResilientClient(
  config: ResilientClientConfig,
  callFlow: CallFlowFn,
  sleepFn: (ms: number) => Promise<void> = sleep,
) {
  const breaker = new CircuitBreaker(
    config.failureThreshold,
    config.cooldownMs,
  );
  const costTracker = new CostTracker(config.runawayGuard.maxEstimatedUsd);

  function estimatePrimaryCost(input: unknown): number {
    return estimateCallCost(input);
  }

  function estimateFallbackCost(input: unknown): number {
    return estimateCallCost(input, FALLBACK_MODEL_KEY);
  }

  async function execute<T>(input: unknown): Promise<ExecutionResult<T>> {
    const start = Date.now();

    // Runaway guard — checked before primary is ever touched.
    const estPrimary = estimatePrimaryCost(input);
    if (!costTracker.canAfford(estPrimary)) {
      return {
        data: null,
        path: "capped",
        attempts: 0,
        latencyMs: Date.now() - start,
        estimatedCostUsd: 0,
      };
    }

    // Primary path (only if the breaker allows). The breaker is re-checked
    // before every attempt so a mid-retry trip stops further primary calls.
    let attempts = 0;
    if (breaker.canAttemptPrimary()) {
      for (let i = 1; i <= config.retry.maxAttempts; i++) {
        if (i > 1 && !breaker.canAttemptPrimary()) break;
        attempts++;
        try {
          const data = await callFlow<T>(config.primaryFlowId, input);
          breaker.recordSuccess();
          costTracker.record(estPrimary);
          return {
            data,
            path: i === 1 ? "primary" : "retried",
            attempts,
            latencyMs: Date.now() - start,
            estimatedCostUsd: round6(estPrimary * attempts),
          };
        } catch (err) {
          const fErr = toFlowcellError(err);
          breaker.recordFailure();
          const lastAttempt = i === config.retry.maxAttempts;
          if (!isRetryable(fErr) || lastAttempt) break;
          breaker.releaseProbe();
          await sleepFn(
            computeDelay(i, config.retry, parseRetryAfter(err)),
          );
        }
      }
    }

    // Fallback path. Guard is re-checked: retries already spent estimates.
    const reason: FallbackReason =
      breaker.getState() === "OPEN" && attempts === 0
        ? "circuit_open"
        : "retries_exhausted";

    const estFallback = estimateFallbackCost(input);
    if (!costTracker.canAfford(estFallback)) {
      return {
        data: null,
        path: "capped",
        attempts,
        latencyMs: Date.now() - start,
        estimatedCostUsd: 0,
      };
    }

    try {
      const fallbackData = await callFlow<T>(config.fallbackFlowId, input);
      costTracker.record(estFallback);
      return {
        data: fallbackData,
        path: "fallback",
        attempts,
        latencyMs: Date.now() - start,
        estimatedCostUsd: round6(estPrimary * attempts + estFallback),
        fallback: { reason, attempts: 1 },
      };
    } catch (err) {
      const fErr = toFlowcellError(err);
      throw new FlowcellExhaustedError(
        `Fallback flow failed after primary ${reason}: ${fErr.message}`,
        fErr.httpStatus,
      );
    }
  }

  return {
    execute,
    getBreakerState: () => breaker.getState(),
    getSpentUsd: () => costTracker.spent(),
    getRemainingUsd: () => costTracker.remaining(),
  };
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
