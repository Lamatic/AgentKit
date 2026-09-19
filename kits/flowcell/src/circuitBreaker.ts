// Three-state circuit breaker with exactly-one HALF_OPEN probe.
//
// CLOSED --failures >= threshold--> OPEN
// OPEN --cooldown elapsed--> HALF_OPEN
// HALF_OPEN --probe succeeds--> CLOSED
// HALF_OPEN --probe fails--> OPEN

export type BreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreaker {
  private state: BreakerState = "CLOSED";
  private failureCount = 0;
  private openedAt: number | null = null;
  private probeInFlight = false;

  constructor(
    private failureThreshold: number,
    private cooldownMs: number,
  ) {
    if (failureThreshold < 1) throw new Error("failureThreshold must be >= 1");
    if (cooldownMs < 0) throw new Error("cooldownMs must be >= 0");
  }

  canAttemptPrimary(now: number = Date.now()): boolean {
    if (this.state === "CLOSED") return true;
    if (this.state === "OPEN") {
      if (this.openedAt !== null && now - this.openedAt >= this.cooldownMs) {
        this.state = "HALF_OPEN";
        this.probeInFlight = true;
        return true; // the one probe
      }
      return false;
    }
    // HALF_OPEN: exactly one probe in flight.
    if (this.probeInFlight) return false;
    this.probeInFlight = true;
    return true;
  }

  /** Release a HALF_OPEN probe slot without changing state (e.g. retryable mid-probe). */
  releaseProbe(): void {
    if (this.state === "HALF_OPEN") this.probeInFlight = false;
  }

  recordSuccess(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.openedAt = null;
    this.probeInFlight = false;
  }

  recordFailure(now: number = Date.now()): void {
    if (this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.openedAt = now;
      this.probeInFlight = false;
      return;
    }
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      this.openedAt = now;
    }
  }

  getState(): BreakerState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}
