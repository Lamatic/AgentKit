export type BusinessEffect =
  | "read-only"
  | "reversible-write"
  | "notification"
  | "inventory"
  | "financial";

export type DeliverySemantics =
  | "at-least-once"
  | "at-most-once"
  | "best-effort"
  | "unknown";

export interface WebhookScenario {
  systemName: string;
  eventType: string;
  businessEffect: BusinessEffect;
  deliverySemantics: DeliverySemantics;
  orderingRequired: boolean;
  maxAttempts: number;
  timeoutSeconds: number;
  maxDeliveryAgeMinutes: number;
  currentSafeguards: string;
  samplePayload: string;
  failureContext: string;
}

export interface RetryStep {
  attempt: number;
  delaySeconds: number;
  purpose: string;
}

export interface FailureMode {
  scenario: string;
  impact: string;
  signal: string;
  mitigation: string;
}

export interface FailureTest {
  name: string;
  setup: string;
  expected: string;
}

export interface ReliabilityReport {
  executiveSummary: string;
  riskScore: number;
  riskLevel: "low" | "moderate" | "high" | "critical";
  assumptions: string[];
  idempotencyPlan: {
    keyStrategy: string;
    keyExample: string;
    storage: string;
    ttlHours: number;
    firstSeenBehavior: string;
    duplicateBehavior: string;
    conflictBehavior: string;
  };
  retryPlan: {
    policy: string;
    maxAttempts: number;
    maxDeliveryAgeMinutes: number;
    jitter: string;
    schedule: RetryStep[];
    retryableConditions: string[];
    nonRetryableConditions: string[];
  };
  deadLetterPlan: {
    trigger: string;
    record: string[];
    replayChecklist: string[];
  };
  observability: {
    slo: string;
    metrics: string[];
    alerts: string[];
    logFields: string[];
  };
  failureModes: FailureMode[];
  testMatrix: FailureTest[];
  rolloutSteps: string[];
}

export interface AnalysisResult {
  success: boolean;
  report?: ReliabilityReport;
  error?: string;
  mode?: "demo" | "live";
}
