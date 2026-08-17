import type { Comparison, StrategyName, Verdict } from "../lib/evidence/core.ts";

const STRATEGY_LABEL: Record<StrategyName, string> = {
  "fixed-width": "baseline fixed-width chunking",
  "clause-aware": "clause-aware chunking",
};

const VERDICT_COPY: Record<Verdict, { tone: string; description: string }> = {
  SHIP: {
    tone: "border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100",
    description: "This configuration can return complete evidence for every required question.",
  },
  TUNE: {
    tone: "border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100",
    description:
      "Chunk boundaries are intact, but retrieval is not yet surfacing complete evidence within " +
      "top-k for every required question.",
  },
  BLOCK: {
    tone: "border-red-400 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-100",
    description:
      "A chunk boundary severs required evidence, so complete evidence can never be retrieved, " +
      "no matter how good search is.",
  },
};

/**
 * Names WHICH configuration achieves the shown verdict, derived from each strategy's own
 * StrategyResult.verdict — not from `recommended`, which ranks by recall score alone and
 * can in principle point at a configuration whose own verdict is worse (see core.ts:
 * a severed span can still reach complete coverage across multiple retrieved chunks).
 * Comparison.verdict is the better of the two strategies, so it must always be presented
 * alongside the strategy name that actually earned it.
 */
function achievingLabel(comparison: Comparison): string {
  const { baseline, candidate, verdict } = comparison;
  const baselineAchieves = baseline.verdict === verdict;
  const candidateAchieves = candidate.verdict === verdict;

  if (baselineAchieves && candidateAchieves) {
    return "both fixed-width and clause-aware chunking";
  }
  if (candidateAchieves) return STRATEGY_LABEL["clause-aware"];
  return STRATEGY_LABEL["fixed-width"];
}

export function VerdictBanner({ comparison }: { comparison: Comparison }) {
  const label = achievingLabel(comparison);
  const copy = VERDICT_COPY[comparison.verdict];

  return (
    <div role="status" aria-live="polite" className={`rounded-lg border-2 p-4 ${copy.tone}`}>
      <p className="text-lg font-bold">
        {comparison.verdict} — with {label}
      </p>
      <p className="mt-1 text-sm">{copy.description}</p>
      {comparison.recommended !== "neither" && (
        <p className="mt-2 text-xs opacity-80">
          Engine recommendation by complete-evidence recall alone:{" "}
          {STRATEGY_LABEL[comparison.recommended]}.
        </p>
      )}
    </div>
  );
}
