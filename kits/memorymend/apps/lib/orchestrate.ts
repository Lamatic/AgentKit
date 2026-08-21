import { analyzeMemoryIntegrity } from "../../core/integrity";
import { demoEvidence, demoMemories, demoPolicy } from "./demo";
import type { MemoryMendResult } from "./types";

export async function runMemoryMend(): Promise<MemoryMendResult> {
  try {
    const report = analyzeMemoryIntegrity(demoMemories, demoEvidence, demoPolicy, new Date("2026-08-21T00:00:00Z"));
    return { status: "complete", report };
  } catch {
    return { status: "error", error: "Memory integrity analysis could not be completed." };
  }
}
