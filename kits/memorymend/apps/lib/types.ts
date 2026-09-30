import type { IntegrityReport } from "../../core/integrity";

export type MemoryMendResult =
  | { status: "complete"; report: IntegrityReport; error?: never }
  | { status: "error"; error: string; report?: never };
