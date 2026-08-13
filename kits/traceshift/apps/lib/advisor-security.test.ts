import assert from "node:assert/strict";
import test from "node:test";
import {
  advisorQuotaSubject,
  consumeAdvisorQuota,
  verifyAdvisorAccess,
} from "./advisor-security";

test("requires the configured Advisor access token", () => {
  const previous = process.env.TRACESHIFT_ADVISOR_ACCESS_TOKEN;
  process.env.TRACESHIFT_ADVISOR_ACCESS_TOKEN = "a-secure-test-token-with-32-characters";
  try {
    assert.equal(verifyAdvisorAccess("a-secure-test-token-with-32-characters"), true);
    assert.equal(verifyAdvisorAccess("the-wrong-token"), false);
  } finally {
    if (previous === undefined) delete process.env.TRACESHIFT_ADVISOR_ACCESS_TOKEN;
    else process.env.TRACESHIFT_ADVISOR_ACCESS_TOKEN = previous;
  }
});

test("enforces a server-side request quota per validated access token", () => {
  const previous = process.env.TRACESHIFT_ADVISOR_RATE_LIMIT;
  process.env.TRACESHIFT_ADVISOR_RATE_LIMIT = "2";
  const subject = advisorQuotaSubject(`token-${Math.random()}`);
  try {
    assert.equal(consumeAdvisorQuota(subject, 1_000), true);
    assert.equal(consumeAdvisorQuota(subject, 1_001), true);
    assert.equal(consumeAdvisorQuota(subject, 1_002), false);
    assert.equal(consumeAdvisorQuota(subject, 61_000), true);
  } finally {
    if (previous === undefined) delete process.env.TRACESHIFT_ADVISOR_RATE_LIMIT;
    else process.env.TRACESHIFT_ADVISOR_RATE_LIMIT = previous;
  }
});

test("bounds active quota subjects and admits new subjects after expiry", () => {
  const startedAt = 10_000_000;
  for (let index = 0; index < 1_000; index += 1) {
    assert.equal(consumeAdvisorQuota(`bounded-subject-${index}`, startedAt), true);
  }
  assert.equal(consumeAdvisorQuota("bounded-subject-overflow", startedAt), false);
  assert.equal(consumeAdvisorQuota("bounded-subject-overflow", startedAt + 60_000), true);
});
