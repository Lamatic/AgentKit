import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { CircuitBreaker } from "../src/circuitBreaker.js";

describe("CircuitBreaker state transitions", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts CLOSED and allows primary", () => {
    const b = new CircuitBreaker(3, 1000);
    expect(b.getState()).toBe("CLOSED");
    expect(b.canAttemptPrimary()).toBe(true);
  });

  it("CLOSED → OPEN at threshold", () => {
    const b = new CircuitBreaker(3, 1000);
    b.recordFailure();
    b.recordFailure();
    expect(b.getState()).toBe("CLOSED");
    b.recordFailure();
    expect(b.getState()).toBe("OPEN");
    expect(b.canAttemptPrimary()).toBe(false);
  });

  it("OPEN blocks primary until cooldown, then admits one HALF_OPEN probe", () => {
    const b = new CircuitBreaker(1, 1000);
    b.recordFailure();
    expect(b.getState()).toBe("OPEN");
    expect(b.canAttemptPrimary()).toBe(false);
    vi.advanceTimersByTime(999);
    expect(b.canAttemptPrimary()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(b.canAttemptPrimary()).toBe(true);
    expect(b.getState()).toBe("HALF_OPEN");
  });

  it("HALF_OPEN admits exactly one probe", () => {
    const b = new CircuitBreaker(1, 1000);
    b.recordFailure();
    vi.advanceTimersByTime(1000);
    expect(b.canAttemptPrimary()).toBe(true); // the probe
    expect(b.canAttemptPrimary()).toBe(false); // second concurrent call blocked
  });

  it("HALF_OPEN → CLOSED on probe success, counters reset", () => {
    const b = new CircuitBreaker(2, 1000);
    b.recordFailure();
    b.recordFailure();
    expect(b.getState()).toBe("OPEN");
    vi.advanceTimersByTime(1000);
    expect(b.canAttemptPrimary()).toBe(true);
    b.recordSuccess();
    expect(b.getState()).toBe("CLOSED");
    expect(b.getFailureCount()).toBe(0);
    // Needs a full threshold of fresh failures to reopen.
    b.recordFailure();
    expect(b.getState()).toBe("CLOSED");
  });

  it("HALF_OPEN → OPEN on probe failure, cooldown restarts", () => {
    const b = new CircuitBreaker(1, 1000);
    b.recordFailure();
    vi.advanceTimersByTime(1000);
    expect(b.canAttemptPrimary()).toBe(true);
    b.recordFailure();
    expect(b.getState()).toBe("OPEN");
    expect(b.canAttemptPrimary()).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(b.canAttemptPrimary()).toBe(true);
    expect(b.getState()).toBe("HALF_OPEN");
  });

  it("success below threshold keeps CLOSED with running count", () => {
    const b = new CircuitBreaker(3, 1000);
    b.recordFailure();
    b.recordSuccess();
    expect(b.getState()).toBe("CLOSED");
    expect(b.getFailureCount()).toBe(0);
  });
});
