import type { StrategyResult } from "../lib/evidence/core.ts";
import { RateText } from "./RateText.tsx";

type Props = {
  baseline: StrategyResult;
  candidate: StrategyResult;
};

/**
 * Per-question results, both strategies side by side. A missing rank is rendered as the
 * explicit words "not recovered" — never left blank and never rendered as 0, since 0 would
 * read as "recovered at rank zero" rather than "never recovered".
 */
export function CaseResultsTable({ baseline, candidate }: Props) {
  const candidateById = new Map(candidate.cases.map((c) => [c.caseId, c]));

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[48rem] text-left text-sm">
        <caption className="sr-only">Per-question results for both chunking strategies</caption>
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            <th scope="col" className="px-3 py-2">
              Case
            </th>
            <th scope="col" className="px-3 py-2">
              Question
            </th>
            <th scope="col" className="px-3 py-2">
              Required
            </th>
            <th scope="col" className="px-3 py-2">
              Baseline coverage
            </th>
            <th scope="col" className="px-3 py-2">
              Baseline first complete rank
            </th>
            <th scope="col" className="px-3 py-2">
              Candidate coverage
            </th>
            <th scope="col" className="px-3 py-2">
              Candidate first complete rank
            </th>
          </tr>
        </thead>
        <tbody>
          {baseline.cases.map((bc) => {
            const cc = candidateById.get(bc.caseId);
            return (
              <tr key={bc.caseId} className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-3 py-2 font-mono text-xs">{bc.caseId}</td>
                <td className="px-3 py-2">{bc.question}</td>
                <td className="px-3 py-2">{bc.required ? "Yes" : "No"}</td>
                <td className="px-3 py-2">
                  <RateText rate={bc.spanCoverageAtK} />
                </td>
                <td className="px-3 py-2">
                  {bc.firstCompleteEvidenceRank === null ? "not recovered" : bc.firstCompleteEvidenceRank}
                </td>
                <td className="px-3 py-2">{cc ? <RateText rate={cc.spanCoverageAtK} /> : "—"}</td>
                <td className="px-3 py-2">
                  {cc
                    ? cc.firstCompleteEvidenceRank === null
                      ? "not recovered"
                      : cc.firstCompleteEvidenceRank
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
