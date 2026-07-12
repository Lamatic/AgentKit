"use server";

import { runFlow, type TestCaseInput } from "./runFlow";
import { scoreOutput } from "./scoreOutput";
import { compareBaseline, type RunResult, type CompareResult, type CaseResult } from "./compareBaseline";
import { generateRunId } from "../lib/metrics";
import { loadBaseline, saveBaseline, saveRun } from "./storage";

export interface OrchestrationResult {
  run: RunResult;
  diff: CompareResult;
  baselineUpdated: boolean;
  error?: string;
}

export async function executeBenchmark(
  flowId: string,
  testCases: TestCaseInput[]
): Promise<OrchestrationResult> {
  try {
    // 1. Execute flows
    const flowResults = await runFlow(flowId, testCases);

    // 2. Score outputs
    const runId = generateRunId();
    const caseResults: CaseResult[] = [];

    for (let i = 0; i < testCases.length; i++) {
      const spec = testCases[i];
      const run = flowResults[i];

      let similarity: number | null = null;
      let passed = run.error === null;

      // Type-cast because TestCaseInput doesn't have min_similarity and expected_contains by default
      // but we will pass them in from the UI parse step
      const expectedContains = (spec as any).expected_contains;
      const minSimilarity = (spec as any).min_similarity ?? 0.7;

      if (expectedContains && run.output && passed) {
        const score = await scoreOutput(run.output, expectedContains, minSimilarity);
        similarity = score.similarity;
        if (!score.pass) {
          passed = false;
        }
      }

      caseResults.push({
        id: spec.id,
        passed,
        latencyMs: run.latencyMs,
        similarity,
        output: run.output,
        error: run.error,
      });
    }

    // 3. Assemble run
    const currentRun: RunResult = {
      runId,
      flowId,
      timestamp: new Date().toISOString(),
      cases: caseResults,
    };

    // 4. Compare baseline
    const baseline = loadBaseline(flowId);
    const diff = compareBaseline(currentRun, baseline);

    // 5. Save results
    saveRun(currentRun);

    const allPassed = currentRun.cases.every((c) => c.passed);
    const noBlockingRegressions = diff.blockingRegressions.length === 0;
    
    let baselineUpdated = false;
    if (allPassed && noBlockingRegressions) {
      saveBaseline(flowId, currentRun);
      baselineUpdated = true;
    }

    return {
      run: currentRun,
      diff,
      baselineUpdated,
    };
  } catch (err: unknown) {
    return {
      run: null as any,
      diff: null as any,
      baselineUpdated: false,
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function getRunsHistory() {
  const { listAllRuns } = await import("./storage");
  return listAllRuns();
}

export async function getRunDetails(runId: string) {
  const { loadRun, loadBaseline } = await import("./storage");
  const run = loadRun(runId);
  if (!run) return null;
  const baseline = loadBaseline(run.flowId);
  const diff = compareBaseline(run, baseline);
  return { run, diff };
}
