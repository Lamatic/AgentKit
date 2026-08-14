import type { z } from "zod";
import type {
  businessEffectSchema,
  deliverySemanticsSchema,
  reliabilityReportSchema,
  webhookScenarioSchema,
} from "./schemas";

export type BusinessEffect = z.infer<typeof businessEffectSchema>;
export type DeliverySemantics = z.infer<typeof deliverySemanticsSchema>;
export type WebhookScenario = z.infer<typeof webhookScenarioSchema>;
export type ReliabilityReport = z.infer<typeof reliabilityReportSchema>;
export type RetryStep = ReliabilityReport["retryPlan"]["schedule"][number];
export type FailureMode = ReliabilityReport["failureModes"][number];
export type FailureTest = ReliabilityReport["testMatrix"][number];

export interface AnalysisResult {
  success: boolean;
  report?: ReliabilityReport;
  error?: string;
  mode?: "demo" | "live";
}
