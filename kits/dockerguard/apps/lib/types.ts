export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface Finding {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  line: number | null;
  instruction: string | null;
  why: string;
  fix: string;
  reference?: string | null;
}

export interface AuditReport {
  input_type: "dockerfile" | "compose" | "unknown";
  score: number;
  grade: string;
  summary: string;
  findings: Finding[];
  passed_checks: string[];
}

export type FileType = "dockerfile" | "compose";
