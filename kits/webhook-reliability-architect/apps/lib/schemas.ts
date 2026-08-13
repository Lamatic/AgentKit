import { z } from "zod";

export const businessEffectSchema = z.enum([
  "read-only",
  "reversible-write",
  "notification",
  "inventory",
  "financial",
]);

export const deliverySemanticsSchema = z.enum([
  "at-least-once",
  "at-most-once",
  "best-effort",
  "unknown",
]);

export const webhookScenarioSchema = z
  .object({
    systemName: z.string().trim().min(1, "System name is required.").max(200),
    eventType: z.string().trim().min(1, "Event type is required.").max(200),
    businessEffect: businessEffectSchema,
    deliverySemantics: deliverySemanticsSchema,
    orderingRequired: z.boolean(),
    maxAttempts: z
      .number({ invalid_type_error: "Max attempts must be a number." })
      .finite()
      .int()
      .min(1, "Max attempts must be between 1 and 12.")
      .max(12, "Max attempts must be between 1 and 12."),
    timeoutSeconds: z
      .number({ invalid_type_error: "Timeout must be a number." })
      .finite()
      .int()
      .min(1, "Timeout must be between 1 and 300 seconds.")
      .max(300, "Timeout must be between 1 and 300 seconds."),
    maxDeliveryAgeMinutes: z
      .number({ invalid_type_error: "Delivery age must be a number." })
      .finite()
      .int()
      .min(1, "Delivery age must be between 1 minute and 7 days.")
      .max(10_080, "Delivery age must be between 1 minute and 7 days."),
    currentSafeguards: z.string().max(8_000, "Safeguard notes are too large."),
    samplePayload: z.string().max(20_000, "Sample payload is too large."),
    failureContext: z.string().max(8_000, "Failure context is too large."),
  })
  .strict();

const retryStepSchema = z.object({
  attempt: z.number().finite().int().positive(),
  delaySeconds: z.number().finite().nonnegative(),
  purpose: z.string(),
});

const failureModeSchema = z.object({
  scenario: z.string(),
  impact: z.string(),
  signal: z.string(),
  mitigation: z.string(),
});

const failureTestSchema = z.object({
  name: z.string(),
  setup: z.string(),
  expected: z.string(),
});

export const reliabilityReportSchema = z.object({
  executiveSummary: z.string(),
  riskScore: z.number().finite().min(0).max(100),
  riskLevel: z.enum(["low", "moderate", "high", "critical"]),
  assumptions: z.array(z.string()),
  idempotencyPlan: z.object({
    keyStrategy: z.string(),
    keyExample: z.string(),
    storage: z.string(),
    ttlHours: z.number().finite().nonnegative(),
    firstSeenBehavior: z.string(),
    duplicateBehavior: z.string(),
    conflictBehavior: z.string(),
  }),
  retryPlan: z.object({
    policy: z.string(),
    maxAttempts: z.number().finite().int().positive(),
    maxDeliveryAgeMinutes: z.number().finite().positive(),
    jitter: z.string(),
    schedule: z.array(retryStepSchema),
    retryableConditions: z.array(z.string()),
    nonRetryableConditions: z.array(z.string()),
  }),
  deadLetterPlan: z.object({
    trigger: z.string(),
    record: z.array(z.string()),
    replayChecklist: z.array(z.string()),
  }),
  observability: z.object({
    slo: z.string(),
    metrics: z.array(z.string()),
    alerts: z.array(z.string()),
    logFields: z.array(z.string()),
  }),
  failureModes: z.array(failureModeSchema),
  testMatrix: z.array(failureTestSchema),
  rolloutSteps: z.array(z.string()),
});
