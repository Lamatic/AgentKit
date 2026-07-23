export type AuditMode = "security" | "gas" | "best-practices" | "comprehensive";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type Confidence = "high" | "medium" | "low";

export interface AuditFinding {
  title: string;
  severity: Severity;
  lineNumbers: number[];
  evidence: string;
  impact: string;
  recommendation: string;
  confidence: Confidence;
}

export interface AuditReport {
  summary: string;
  overallRisk: Severity;
  confidence: Confidence;
  securityFindings: AuditFinding[];
  gasFindings: AuditFinding[];
  bestPracticeFindings: AuditFinding[];
  remediations: string[];
  disclaimer: string;
}

export interface AuditRequest {
  contractCode: string;
  auditMode: AuditMode;
  contractName?: string;
  focusAreas?: string;
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LamaticWorkflowResponse {
  status?: string;
  result?: unknown;
  message?: string;
  error?: unknown;
}
