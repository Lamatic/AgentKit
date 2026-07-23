/**
 * Verdict + regression math. Pure functions — unit-testable with no API key.
 *
 * Design stance: absolute LLM-judge scores are noisy, but DELTAS between two
 * runs of the SAME immutable suite are robust. The regression verdict leans on
 * flipped cases and mean-score movement, not decimal-point score worship.
 */

import type {
  JudgedCase,
  Judgment,
  Run,
  BaselineDiff,
  RegressionVerdict,
} from '@/types';

/** Mean of the four rubric axes for one judgment. */
export function meanScore(j: Judgment | null): number | null {
  if (!j) return null;
  const s = j.scores;
  return (s.taskSuccess + s.faithfulness + s.toneConstitution + s.safety) / 4;
}

/** Roll a run's judged cases into headline totals. */
export function computeTotals(results: JudgedCase[]): NonNullable<Run['totals']> {
  let passed = 0,
    failed = 0,
    borderline = 0,
    errored = 0,
    costUsd = 0,
    latencySum = 0,
    latencyN = 0;

  for (const r of results) {
    costUsd += r.execution.costUsd ?? 0;
    if (r.execution.latencyMs) {
      latencySum += r.execution.latencyMs;
      latencyN += 1;
    }
    if (r.execution.outcome !== 'ok') {
      errored += 1;
      continue;
    }
    const v = r.judgment?.verdict;
    if (v === 'pass') passed += 1;
    else if (v === 'fail') failed += 1;
    else borderline += 1;
  }

  return {
    cases: results.length,
    passed,
    failed,
    borderline,
    errored,
    costUsd: Number(costUsd.toFixed(4)),
    avgLatencyMs: latencyN ? Math.round(latencySum / latencyN) : 0,
  };
}

const isFail = (j: Judgment | null) => j?.verdict === 'fail';
const isPass = (j: Judgment | null) => j?.verdict === 'pass';

/**
 * Compare a candidate run against a baseline run of the SAME suite version.
 * Throws if the suite versions differ — comparisons across suite versions are
 * meaningless and the caller must prevent them.
 */
export function computeBaselineDiff(baseline: Run, candidate: Run): BaselineDiff {
  if (baseline.suiteVersion !== candidate.suiteVersion) {
    throw new Error(
      'Cannot compare runs from different suite versions. Pin a suite and re-run.'
    );
  }

  const baseById = new Map(baseline.results.map((r) => [r.testCase.id, r]));
  const perCase: BaselineDiff['perCase'] = [];
  const flippedToFail: string[] = [];
  const flippedToPass: string[] = [];

  let deltaSum = 0;
  let deltaN = 0;

  for (const cand of candidate.results) {
    const base = baseById.get(cand.testCase.id);
    const bMean = meanScore(base?.judgment ?? null);
    const cMean = meanScore(cand.judgment ?? null);
    const delta = bMean != null && cMean != null ? cMean - bMean : null;

    if (delta != null) {
      deltaSum += delta;
      deltaN += 1;
    }
    if (base && isPass(base.judgment) && isFail(cand.judgment)) {
      flippedToFail.push(cand.testCase.id);
    }
    if (base && isFail(base.judgment) && isPass(cand.judgment)) {
      flippedToPass.push(cand.testCase.id);
    }

    perCase.push({
      caseId: cand.testCase.id,
      baselineMean: bMean,
      candidateMean: cMean,
      delta: delta != null ? Number(delta.toFixed(3)) : null,
    });
  }

  const meanScoreDelta = deltaN ? Number((deltaSum / deltaN).toFixed(3)) : 0;
  const verdict = decideVerdict(meanScoreDelta, flippedToFail.length, flippedToPass.length);

  return {
    baselineRunId: baseline.id,
    candidateRunId: candidate.id,
    verdict,
    meanScoreDelta,
    flippedToFail,
    flippedToPass,
    perCase,
  };
}

/**
 * Verdict thresholds. A single case flipping to fail is a REGRESSION regardless
 * of average movement — a real defect matters more than a flattering mean.
 */
export function decideVerdict(
  meanScoreDelta: number,
  flippedToFailCount: number,
  flippedToPassCount: number
): RegressionVerdict {
  if (flippedToFailCount > 0) return 'REGRESSED';
  if (meanScoreDelta <= -0.25) return 'REGRESSED';
  if (flippedToFailCount === 0 && meanScoreDelta >= 0.25) return 'IMPROVED';
  if (flippedToPassCount > 0 && meanScoreDelta >= 0) return 'IMPROVED';
  return 'NO_CHANGE';
}

/** The worst-N cases in a run, for the report and drill-down. */
export function worstFailures(run: Run, n = 5) {
  return [...run.results]
    .filter((r) => r.judgment)
    .sort((a, b) => (meanScore(a.judgment) ?? 9) - (meanScore(b.judgment) ?? 9))
    .slice(0, n)
    .map((r) => ({
      caseId: r.testCase.id,
      category: r.testCase.category,
      expectedBehavior: r.testCase.expectedBehavior,
      actualOutputExcerpt: (r.execution.rawText || '').slice(0, 400),
      verdict: r.judgment?.verdict,
      meanScore: meanScore(r.judgment),
      rationales: r.judgment?.rationales,
    }));
}
