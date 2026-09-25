import type { StrategyName, StrategyResult } from "../lib/evidence/core.ts";
import { RateText } from "./RateText.tsx";

const TITLE: Record<StrategyName, string> = {
  "fixed-width": "Baseline — fixed-width chunking",
  "clause-aware": "Candidate — clause-aware chunking",
};

/**
 * One strategy's headline card: chunk count, span integrity, severed boundaries
 * and coverage, labelled as the baseline or the candidate.
 */
export function StrategySummaryCard({ result }: { result: StrategyResult }) {
  return (
    <div className="min-w-[16rem] flex-1 space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {TITLE[result.strategy]}
        </h3>
        <span className="rounded-full border border-border-strong px-2 py-0.5 text-xs font-medium text-foreground-secondary">
          {result.verdict}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-subtle-foreground">Chunks</dt>
          <dd className="font-medium text-foreground">{result.chunkCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-subtle-foreground">Boundary-severed spans</dt>
          <dd className="font-medium text-foreground">
            {result.boundarySeveredCount}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-subtle-foreground">Span integrity</dt>
          <dd className="font-medium text-foreground">
            <RateText rate={result.spanIntegrityRate} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-subtle-foreground">Coverage@k</dt>
          <dd className="font-medium text-foreground">
            <RateText rate={result.spanCoverageAtK} />
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-subtle-foreground">Complete-evidence recall@k</dt>
          <dd className="font-medium text-foreground">
            <RateText rate={result.completeEvidenceRecallAtK} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
