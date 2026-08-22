import { describe, it, expect } from 'vitest';
import {
  decideVerdict,
  computeTotals,
  computeBaselineDiff,
  meanScore,
} from './verdict';
import type { JudgedCase, Judgment, Run, JudgeVerdict } from '@/types';

function judgment(v: JudgeVerdict, scores = [4, 4, 4, 4]): Judgment {
  return {
    caseId: 'x',
    rationales: {},
    scores: {
      taskSuccess: scores[0],
      faithfulness: scores[1],
      toneConstitution: scores[2],
      safety: scores[3],
    },
    schemaValid: true,
    verdict: v,
    confidence: 0.8,
    rubricVersion: 'v1',
  };
}

function jc(id: string, v: JudgeVerdict, scores?: number[]): JudgedCase {
  return {
    testCase: { id, category: 'happy_path', input: {}, expectedBehavior: 'x', rationale: '' },
    execution: {
      caseId: id,
      outcome: 'ok',
      output: null,
      rawText: '',
      latencyMs: 100,
      costUsd: 0,
      retries: 0,
      truncated: false,
    },
    judgment: judgment(v, scores),
  };
}

function run(id: string, results: JudgedCase[]): Run {
  return {
    id,
    suiteId: 's1',
    suiteVersion: 1,
    targetFlowId: 't1',
    stage: 'DONE',
    isBaseline: false,
    createdAt: new Date().toISOString(),
    results,
    totals: computeTotals(results),
  };
}

describe('meanScore', () => {
  it('averages the four axes', () => {
    expect(meanScore(judgment('pass', [5, 3, 4, 4]))).toBe(4);
  });
  it('is null for no judgment', () => {
    expect(meanScore(null)).toBeNull();
  });
});

describe('decideVerdict', () => {
  it('any flip to fail = REGRESSED', () => {
    expect(decideVerdict(0.5, 1, 0)).toBe('REGRESSED');
  });
  it('big mean drop = REGRESSED', () => {
    expect(decideVerdict(-0.3, 0, 0)).toBe('REGRESSED');
  });
  it('clear mean gain with no fails = IMPROVED', () => {
    expect(decideVerdict(0.3, 0, 0)).toBe('IMPROVED');
  });
  it('small movement = NO_CHANGE', () => {
    expect(decideVerdict(0.05, 0, 0)).toBe('NO_CHANGE');
  });
});

describe('computeTotals', () => {
  it('counts verdicts and errors', () => {
    const t = computeTotals([jc('a', 'pass'), jc('b', 'fail'), jc('c', 'borderline')]);
    expect(t.passed).toBe(1);
    expect(t.failed).toBe(1);
    expect(t.borderline).toBe(1);
    expect(t.cases).toBe(3);
  });
});

describe('computeBaselineDiff', () => {
  it('detects a pass→fail regression on the same case', () => {
    const base = run('base', [jc('a', 'pass', [5, 5, 5, 5]), jc('b', 'pass')]);
    const cand = run('cand', [jc('a', 'fail', [1, 2, 2, 1]), jc('b', 'pass')]);
    const diff = computeBaselineDiff(base, cand);
    expect(diff.verdict).toBe('REGRESSED');
    expect(diff.flippedToFail).toContain('a');
    expect(diff.meanScoreDelta).toBeLessThan(0);
  });

  it('refuses to compare across suite versions', () => {
    const base = run('base', [jc('a', 'pass')]);
    const cand = { ...run('cand', [jc('a', 'pass')]), suiteVersion: 2 };
    expect(() => computeBaselineDiff(base, cand)).toThrow();
  });
});
