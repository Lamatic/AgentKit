import type {
  FailureMode,
  FailureTest,
  ReliabilityReport,
  RetryStep,
  WebhookScenario,
} from "./types";

const DELAYS = [0, 5, 30, 120, 600, 1_800, 7_200, 21_600];

const effectRisk: Record<WebhookScenario["businessEffect"], number> = {
  "read-only": 4,
  "reversible-write": 12,
  notification: 16,
  inventory: 24,
  financial: 32,
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function describesPersistedIdempotency(safeguards: string): boolean {
  const normalized = safeguards.toLowerCase();
  const protection = String.raw`(?:idempoten(?:cy|t)|deduplicat(?:e|ion)|dedup)`;
  const persistence = String.raw`(?:persist(?:ed|ent|ence|ing)?|durable|transactional|inbox|database|redis|unique constraint)`;
  const explicitlyAbsent = new RegExp(
    String.raw`\b(?:no|without|missing|lacks?)\b[^.]{0,100}\b${protection}\b`,
  ).test(normalized);

  if (explicitlyAbsent) return false;
  return (
    new RegExp(String.raw`\b${protection}\b[^.]{0,100}\b${persistence}\b`).test(normalized) ||
    new RegExp(String.raw`\b${persistence}\b[^.]{0,100}\b${protection}\b`).test(normalized)
  );
}

function buildSchedule(maxAttempts: number, maxAgeMinutes: number): RetryStep[] {
  const capSeconds = maxAgeMinutes * 60;
  let elapsed = 0;
  const schedule: RetryStep[] = [];

  for (let index = 0; index < maxAttempts; index += 1) {
    const delaySeconds = index === 0 ? 0 : DELAYS[Math.min(index, DELAYS.length - 1)];
    if (elapsed + delaySeconds > capSeconds && index > 0) break;
    elapsed += delaySeconds;
    schedule.push({
      attempt: index + 1,
      delaySeconds,
      purpose: index === 0 ? "Initial delivery" : `Recover after ${delaySeconds}s plus full jitter`,
    });
  }

  return schedule;
}

function getRiskLevel(score: number): ReliabilityReport["riskLevel"] {
  if (score >= 76) return "critical";
  if (score >= 56) return "high";
  if (score >= 31) return "moderate";
  return "low";
}

function buildFailureModes(scenario: WebhookScenario): FailureMode[] {
  const duplicateImpact =
    scenario.businessEffect === "financial"
      ? "A duplicate may charge or refund money twice."
      : scenario.businessEffect === "inventory"
        ? "A duplicate may reserve or release stock twice."
        : "A duplicate may repeat the downstream side effect.";

  return [
    {
      scenario: "Receiver completes work but the acknowledgement is lost",
      impact: duplicateImpact,
      signal: "Same event ID is delivered again after a timeout or connection reset.",
      mitigation: "Persist the idempotency record and business mutation atomically before returning 2xx.",
    },
    {
      scenario: "Receiver is throttled or temporarily unavailable",
      impact: "Immediate retries amplify load and extend the incident.",
      signal: "HTTP 429/503 rate rises while latency and queue age increase together.",
      mitigation: "Honor Retry-After, apply exponential backoff with full jitter, and cap delivery age.",
    },
    {
      scenario: "Payload is malformed or violates the event contract",
      impact: "Poison events consume every retry and hide actionable defects.",
      signal: "Stable 400/422 responses repeat for the same payload hash.",
      mitigation: "Treat deterministic validation failures as non-retryable and route them to quarantine.",
    },
    {
      scenario: "Events arrive out of order",
      impact: scenario.orderingRequired
        ? "Newer state can be overwritten by an older event."
        : "Consumers may still observe confusing intermediate state.",
      signal: "Event sequence or occurred_at is older than the last applied version.",
      mitigation: scenario.orderingRequired
        ? "Enforce a per-aggregate sequence check and reject or park gaps for replay."
        : "Record event time and make state transitions monotonic where possible.",
    },
  ];
}

function buildTests(scenario: WebhookScenario): FailureTest[] {
  return [
    {
      name: "Lost acknowledgement",
      setup: "Complete the side effect, then terminate the connection before returning 2xx.",
      expected: "The redelivery returns the stored result and does not repeat the side effect.",
    },
    {
      name: "Concurrent duplicate",
      setup: "Send two requests with the same event ID at the same millisecond.",
      expected: "One request owns processing; the other waits or receives the canonical response.",
    },
    {
      name: "Transient receiver outage",
      setup: `Return 503 for the first ${Math.min(2, scenario.maxAttempts - 1)} attempts, then recover.`,
      expected: "Attempts follow the documented jittered schedule and stop immediately after success.",
    },
    {
      name: "Poison payload",
      setup: "Remove a required field while keeping the event signature valid.",
      expected: "The event is quarantined after one deterministic 4xx response, without blind retries.",
    },
    {
      name: "Stale event",
      setup: "Deliver sequence 42 after sequence 43 for the same aggregate.",
      expected: scenario.orderingRequired
        ? "Sequence 42 is parked or rejected and never overwrites sequence 43."
        : "The event is processed only if the transition remains valid and monotonic.",
    },
  ];
}

export function buildDemoReport(scenario: WebhookScenario): ReliabilityReport {
  const safeguards = scenario.currentSafeguards.toLowerCase();
  const hasIdempotency = describesPersistedIdempotency(safeguards);
  const hasDeadLetter = /dead.?letter|dlq|quarantine/.test(safeguards);
  const hasBackoff = /backoff|jitter|retry-after/.test(safeguards);

  const score = clamp(
    18 +
      effectRisk[scenario.businessEffect] +
      (scenario.deliverySemantics === "at-least-once" ? 14 : 5) +
      (scenario.orderingRequired ? 8 : 0) +
      (hasIdempotency ? -16 : 12) +
      (hasDeadLetter ? -8 : 7) +
      (hasBackoff ? -6 : 6) +
      (scenario.maxAttempts > 8 ? 7 : 0),
    5,
    98,
  );

  const keyBase = scenario.samplePayload.match(
    /"(?:event_id|eventId|provider_event_id|providerEventId)"\s*:\s*"([^"]+)"/,
  )?.[1];
  const keyExample = keyBase
    ? `${scenario.eventType}:${keyBase}`
    : `${scenario.eventType}:<provider-event-id>`;
  const schedule = buildSchedule(scenario.maxAttempts, scenario.maxDeliveryAgeMinutes);

  return {
    executiveSummary: `${scenario.systemName} has ${getRiskLevel(score)} duplicate-delivery risk for ${scenario.eventType}. The safest design is an inbox-style idempotency record, bounded jittered retries, and an operator-controlled replay path that never bypasses validation.`,
    riskScore: score,
    riskLevel: getRiskLevel(score),
    assumptions: [
      keyBase
        ? "The sampled payload's explicit event identifier is stable across every redelivery."
        : "The sample payload has no explicit event identifier; the plan assumes the provider supplies a stable provider event ID.",
      "The receiver can persist a small delivery record in the same trust boundary as the side effect.",
      "Only transient transport and 5xx failures should be retried automatically.",
    ],
    idempotencyPlan: {
      keyStrategy: "Namespace the provider event ID by event type and account/tenant; reject key reuse with a different payload hash.",
      keyExample,
      storage: "A transactional inbox table with a unique idempotency_key, payload_hash, status, response_code, and response_body.",
      ttlHours: clamp(Math.ceil(scenario.maxDeliveryAgeMinutes / 60) * 2, 24, 720),
      firstSeenBehavior: "Insert PROCESSING, perform the business mutation, store the canonical response, then commit atomically.",
      duplicateBehavior: "Return the stored status and response without executing the business mutation again.",
      conflictBehavior: "Return 409 and alert when the same key arrives with a different payload hash.",
    },
    retryPlan: {
      policy: "Exponential backoff with full jitter, Retry-After support, a hard attempt cap, and a delivery-age budget.",
      maxAttempts: schedule.length,
      maxDeliveryAgeMinutes: scenario.maxDeliveryAgeMinutes,
      jitter: "For retry n, choose a random delay from 0 to the scheduled ceiling; honor a larger valid Retry-After within the age budget.",
      schedule,
      retryableConditions: [
        "Connection reset, DNS failure, or timeout before a definitive response",
        "HTTP 408, 425, 429, 500, 502, 503, or 504",
        "Receiver explicitly marks the failure as transient",
      ],
      nonRetryableConditions: [
        "HTTP 400, 401, 403, 404, 409 payload conflict, or 422",
        "Invalid signature, expired timestamp, or schema violation",
        "Business rule rejection with a stable error code",
      ],
    },
    deadLetterPlan: {
      trigger: "Move the event to quarantine when attempts or delivery age are exhausted, or immediately on a deterministic poison payload.",
      record: [
        "Original headers and payload (redacted)",
        "Event ID, payload hash, tenant, and event type",
        "Every attempt timestamp, latency, response code, and error class",
        "Next safe operator action and correlation/trace IDs",
      ],
      replayChecklist: [
        "Confirm the receiver defect or dependency outage is resolved.",
        "Revalidate signature policy, schema version, and payload retention rules.",
        "Check the idempotency record before replaying; never mint a new key silently.",
        "Replay a single canary, verify the business state, then release the remaining batch gradually.",
      ],
    },
    observability: {
      slo: `99.9% of valid ${scenario.eventType} events reach a terminal state within ${scenario.maxDeliveryAgeMinutes} minutes, with zero duplicated business mutations.`,
      metrics: [
        "deliveries_total by event_type, status, and attempt",
        "delivery_latency_seconds and queue_age_seconds",
        "duplicate_suppressed_total and idempotency_conflict_total",
        "dead_letter_depth and oldest_dead_letter_age_seconds",
      ],
      alerts: [
        "Terminal success rate below 99.9% for 15 minutes",
        "Oldest queued event exceeds 50% of the delivery-age budget",
        "Any idempotency key/payload hash conflict",
        "Dead-letter depth grows for three consecutive windows",
      ],
      logFields: [
        "event_id",
        "idempotency_key",
        "payload_hash",
        "attempt",
        "tenant_id",
        "trace_id",
        "response_code",
        "error_class",
      ],
    },
    failureModes: buildFailureModes(scenario),
    testMatrix: buildTests(scenario),
    rolloutSteps: [
      "Observe current delivery outcomes and define the baseline before changing retries.",
      "Ship the idempotency inbox in shadow mode and compare duplicate detections without suppressing traffic.",
      "Enable suppression for one low-risk event type, then verify stored-response behavior.",
      "Introduce bounded jittered retries and dead-letter routing behind a feature flag.",
      "Run the failure-injection matrix, document evidence, and expand traffic gradually.",
    ],
  };
}
