import { beforeEach, describe, expect, test } from "bun:test";

import {
  allowInvestigationRequest,
  resetInvestigationRateLimitsForTest,
} from "../lib/rate-limit";

describe("investigation rate limit", () => {
  beforeEach(resetInvestigationRateLimitsForTest);

  test("allows five investigations per client in a ten-minute window", () => {
    for (let request = 0; request < 5; request += 1) {
      expect(allowInvestigationRequest("client", 1_000).allowed).toBe(true);
    }
    expect(allowInvestigationRequest("client", 1_000)).toEqual({
      allowed: false,
      retryAfterSeconds: 600,
    });
  });

  test("opens a fresh window after ten minutes", () => {
    for (let request = 0; request < 5; request += 1) {
      allowInvestigationRequest("client", 1_000);
    }
    expect(allowInvestigationRequest("client", 601_000).allowed).toBe(true);
  });
});
