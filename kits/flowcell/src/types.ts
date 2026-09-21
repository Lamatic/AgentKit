// Flowcell shared types.
// Keep `data: T | null` so the capped path can return without a network call.
// Tradeoff (see README): callers must null-check `data` even on success paths.
// A discriminated union would remove that tax but adds complexity not needed here.

export type ExecutionPath = "primary" | "retried" | "fallback" | "capped";

export type FallbackReason = "retries_exhausted" | "circuit_open";

export interface ExecutionResult<T> {
  data: T | null;
  path: ExecutionPath;
  attempts: number;
  latencyMs: number;
  estimatedCostUsd: number;
  fallback?: {
    reason: FallbackReason;
    attempts: number;
  };
}

export interface FlowcellError {
  message: string;
  retryable: boolean;
  httpStatus?: number;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: boolean;
  respectRetryAfter: boolean;
}

export interface RunawayGuardConfig {
  /** Per-instance ceiling on ESTIMATED spend (USD). Not account billing. */
  maxEstimatedUsd: number;
}

export interface ResilientClientConfig {
  primaryFlowId: string;
  fallbackFlowId: string;
  retry: RetryConfig;
  failureThreshold: number;
  cooldownMs: number;
  runawayGuard: RunawayGuardConfig;
}

/** Transport used to invoke a deployed flow. Inject a mock in tests/demo. */
export type CallFlowFn = <T>(flowId: string, input: unknown) => Promise<T>;

export class FlowcellExhaustedError extends Error {
  readonly httpStatus?: number;
  /** Error thrown when the fallback flow fails after the primary is exhausted. */
  constructor(message: string, httpStatus?: number) {
    super(message);
    this.name = "FlowcellExhaustedError";
    this.httpStatus = httpStatus;
  }
}

export class RunawayGuardExceededError extends Error {
  /** Error for callers that prefer throwing over the capped ExecutionResult. */
  constructor(message = "Runaway guard exceeded: estimated session spend cap reached") {
    super(message);
    this.name = "RunawayGuardExceededError";
  }
}
