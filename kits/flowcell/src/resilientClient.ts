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

/**
 * Build a resilient flow client: budget-guarded, retried, breaker-isolated,
 * fallback-routed execution of any Lamatic flow.
 */
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

  /** Estimated cost of one primary attempt for this input. */
  function estimatePrimaryCost(input: unknown): number {
    return estimateCallCost(input);
  }

  /** Estimated cost of the cheaper fallback call for this input. */
  function estimateFallbackCost(input: unknown): number {
    return estimateCallCost(input, FALLBACK_MODEL_KEY);
  }

  /** Execute one input through guard → primary (+retry) → fallback. */
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
    // breakerDenied tracks guard denials explicitly so the fallback reason
    // reflects whether primary was ever touched.
    let attempts = 0;
    let breakerDenied = false;
    if (!breaker.canAttemptPrimary()) {
      breakerDenied = true;
    } else {
      for (let i = 1; i <= config.retry.maxAttempts; i++) {
        if (i > 1 && !breaker.canAttemptPrimary()) {
          breakerDenied = true;
          break;
        }
        attempts++;
        // Reserve up front: every attempt is charged, including failed ones,
        // so the ledger never understates spend across retries.
        costTracker.record(estPrimary);
        try {
          const data = await callFlow<T>(config.primaryFlowId, input);
          breaker.recordSuccess();
          return {
            data,
            path: i === 1 ? "primary" : "retried",
            attempts,
            latencyMs: Date.now() - start,
            estimatedCostUsd: round6(estPrimary * attempts),
          };
        } catch (err) {
          const fErr = toFlowcellError(err);
          // Every primary-call failure counts toward the breaker, including
          // 4xx: the live forceFail hook surfaces as HTTP 400 and the
          // circuit_open path depends on counting it.
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
    // circuit_open means primary was never touched (breaker denied every
    // attempt); anything else means primary tried and failed.
    const reason: FallbackReason =
      breakerDenied && attempts === 0
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
      // Same reservation rule as primary: the attempt is charged when made,
      // even if the fallback itself fails below.
      costTracker.record(estFallback);
      const fallbackData = await callFlow<T>(config.fallbackFlowId, input);
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

/** Round to micro-dollars to keep reported costs stable. */
function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
