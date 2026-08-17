import type { StrategyName, StrategyResult } from "../lib/evidence/core.ts";
import { RateText } from "./RateText.tsx";

const TITLE: Record<StrategyName, string> = {
  "fixed-width": "Baseline — fixed-width chunking",
  "clause-aware": "Candidate — clause-aware chunking",
};

export function StrategySummaryCard({ result }: { result: StrategyResult }) {
  return (
    <div className="min-w-[16rem] flex-1 space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {TITLE[result.strategy]}
        </h3>
        <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300">
          {result.verdict}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Chunks</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-100">{result.chunkCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Boundary-severed spans</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-100">
            {result.boundarySeveredCount}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Span integrity</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-100">
            <RateText rate={result.spanIntegrityRate} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Coverage@k</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-100">
            <RateText rate={result.spanCoverageAtK} />
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Complete-evidence recall@k</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-100">
            <RateText rate={result.completeEvidenceRecallAtK} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
