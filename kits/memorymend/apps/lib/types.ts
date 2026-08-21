import type { IntegrityReport } from "../../core/integrity";

export interface MemoryMendResult {
  status: "complete" | "error";
  report?: IntegrityReport;
  error?: string;
}
