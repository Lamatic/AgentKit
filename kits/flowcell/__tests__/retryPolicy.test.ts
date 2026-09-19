import { describe, expect, it, vi, afterEach } from "vitest";
import {
  RETRYABLE_STATUSES,
  computeDelay,
  isRetryable,
  parseRetryAfter,
} from "../src/retryPolicy.js";
import type { RetryConfig } from "../src/types.js";

const baseConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 1000,
  jitter: false,
  respectRetryAfter: true,
};

describe("isRetryable", () => {
  it("returns true for every retryable status", () => {
    for (const status of RETRYABLE_STATUSES) {
      expect(
        isRetryable({ message: `http ${status}`, retryable: false, httpStatus: status }),
        `status ${status}`,
      ).toBe(true);
    }
  });

  it("returns false for non-retryable statuses", () => {
    for (const status of [400, 401, 403, 404, 422]) {
      expect(
        isRetryable({ message: `http ${status}`, retryable: false, httpStatus: status }),
        `status ${status}`,
      ).toBe(false);
    }
  });

  it("retries transport failures by message", () => {
    expect(isRetryable({ message: "request timeout", retryable: false })).toBe(true);
    expect(isRetryable({ message: "TIMEOUT exceeded", retryable: false })).toBe(true);
    expect(isRetryable({ message: "read ECONNRESET", retryable: false })).toBe(true);
    expect(isRetryable({ message: "fetch failed", retryable: false })).toBe(true);
  });

  it("does not retry 200-with-garbage or client errors", () => {
    expect(isRetryable({ message: "malformed JSON in response", retryable: false })).toBe(false);
    expect(isRetryable({ message: "schema validation failed", retryable: false })).toBe(false);
    expect(isRetryable({ message: "bad config", retryable: false })).toBe(false);
    expect(isRetryable({ message: "", retryable: false })).toBe(false);
  });

  it("classifies on HTTP status first: 502 with malformed body is retryable", () => {
    expect(
      isRetryable({ message: "malformed body", retryable: false, httpStatus: 502 }),
    ).toBe(true);
  });
});

describe("computeDelay", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("backs off exponentially without jitter", () => {
    expect(computeDelay(1, baseConfig)).toBe(100);
    expect(computeDelay(2, baseConfig)).toBe(200);
    expect(computeDelay(3, baseConfig)).toBe(400);
  });

  it("respects maxDelayMs", () => {
    expect(computeDelay(10, baseConfig)).toBe(1000);
  });

  it("jitter stays within [0.5x, 1.0x]", () => {
    const jittered = { ...baseConfig, jitter: true };
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(computeDelay(2, jittered)).toBe(100); // 200 * 0.5
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    expect(computeDelay(2, jittered)).toBeCloseTo(200, 0);
  });

  it("Retry-After overrides exponential when larger", () => {
    expect(computeDelay(1, baseConfig, 5000)).toBe(1000); // capped by maxDelayMs
    expect(computeDelay(1, baseConfig, 150)).toBe(150);
    expect(computeDelay(2, baseConfig, 50)).toBe(200); // smaller → ignored
  });

  it("ignores Retry-After when respectRetryAfter is false", () => {
    expect(
      computeDelay(1, { ...baseConfig, respectRetryAfter: false }, 900),
    ).toBe(100);
  });
});

describe("parseRetryAfter", () => {
  it("parses numeric seconds and ms", () => {
    expect(parseRetryAfter({ retryAfterMs: 250 })).toBe(250);
    expect(parseRetryAfter({ retryAfter: 2 })).toBe(2000);
    expect(parseRetryAfter({ headers: { "retry-after": "3" } })).toBe(3000);
  });

  it("returns undefined when absent or unparseable", () => {
    expect(parseRetryAfter(new Error("boom"))).toBeUndefined();
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter({ headers: {} })).toBeUndefined();
  });
});
