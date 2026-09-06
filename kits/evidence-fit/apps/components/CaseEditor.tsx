"use client";

import { useRef } from "react";
import { LIMITS } from "../lib/validation.ts";

export type DraftEvidence = { quote: string };
export type DraftCase = {
  id: string;
  question: string;
  required: boolean;
  evidence: DraftEvidence[];
};

type Props = {
  cases: DraftCase[];
  onChange: (cases: DraftCase[]) => void;
};

const inputClass =
  "mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

const smallButtonClass =
  "rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 " +
  "disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-blue-600 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800";

/** Ids this component generates itself follow `case-<n>`; used to seed the counter below. */
const GENERATED_ID_PATTERN = /^case-(\d+)$/;

/** Trimmed, non-empty case ids that occur more than once — surfaced inline per-row. */
function duplicateCaseIds(list: DraftCase[]): Set<string> {
  const counts = new Map<string, number>();
  for (const c of list) {
    const id = c.id.trim();
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const dupes = new Set<string>();
  for (const [id, count] of counts) {
    if (count > 1) dupes.add(id);
  }
  return dupes;
}

/** Compact acceptance-case editor: question + evidence quotes per case, add/remove both. */
export function CaseEditor({ cases, onChange }: Props) {
  // Monotonically increasing counter for ids this component generates, so a remove
  // followed by an add can never reissue an id that is (or was) already in use — unlike
  // an index- or count-based id, which collides as soon as a case is removed from the
  // middle or end of the list. Seeded once from any existing `case-<n>` ids so it never
  // collides with ids the parent (e.g. the initial case, or a loaded demo) already set.
  const nextCaseNumber = useRef<number>(0);
  if (nextCaseNumber.current === 0) {
    const highestExisting = cases.reduce((max, c) => {
      const match = GENERATED_ID_PATTERN.exec(c.id);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    nextCaseNumber.current = highestExisting + 1;
  }

  const duplicateIds = duplicateCaseIds(cases);

  function updateCase(index: number, patch: Partial<DraftCase>) {
    const next = cases.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function updateEvidence(caseIndex: number, evidenceIndex: number, quote: string) {
    const next = cases.slice();
    const evidence = next[caseIndex].evidence.slice();
    evidence[evidenceIndex] = { quote };
    next[caseIndex] = { ...next[caseIndex], evidence };
    onChange(next);
  }

  function addEvidence(caseIndex: number) {
    const next = cases.slice();
    const c = next[caseIndex];
    if (c.evidence.length >= LIMITS.maxQuotesPerCase) return;
    next[caseIndex] = { ...c, evidence: [...c.evidence, { quote: "" }] };
    onChange(next);
  }

  function removeEvidence(caseIndex: number, evidenceIndex: number) {
    const next = cases.slice();
    const c = next[caseIndex];
    if (c.evidence.length <= 1) return;
    next[caseIndex] = { ...c, evidence: c.evidence.filter((_, i) => i !== evidenceIndex) };
    onChange(next);
  }

  function addCase() {
    if (cases.length >= LIMITS.maxCases) return;
    // The counter alone is not enough: a user who renames `case-1` to `case-2` makes the
    // counter's next candidate a duplicate, and the run is then blocked by the
    // duplicate-id check with no obvious cause. Skip past ids already in use.
    const taken = new Set(cases.map((c) => c.id));
    while (taken.has(`case-${nextCaseNumber.current}`)) nextCaseNumber.current += 1;
    const id = `case-${nextCaseNumber.current}`;
    nextCaseNumber.current += 1;
    onChange([...cases, { id, question: "", required: true, evidence: [{ quote: "" }] }]);
  }

  function removeCase(index: number) {
    if (cases.length <= 1) return;
    onChange(cases.filter((_, i) => i !== index));
  }

  return (
    <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <legend className="px-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
        Acceptance cases
      </legend>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Each case is a question and one or more evidence quotes copied verbatim from the document
        above. A required case that loses its evidence to a chunk boundary forces a BLOCK verdict.
      </p>

      <div className="space-y-4">
        {cases.map((c, ci) => {
          const isDuplicateId = c.id.trim().length > 0 && duplicateIds.has(c.id.trim());
          const idErrorMessageId = `case-id-${ci}-error`;

          return (
            <div
              key={ci}
              className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[8rem] flex-1">
                  <label
                    htmlFor={`case-id-${ci}`}
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    Case ID
                  </label>
                  <input
                    id={`case-id-${ci}`}
                    type="text"
                    value={c.id}
                    onChange={(e) => updateCase(ci, { id: e.target.value })}
                    maxLength={LIMITS.maxIdChars}
                    aria-invalid={isDuplicateId || undefined}
                    aria-describedby={isDuplicateId ? idErrorMessageId : undefined}
                    className={inputClass}
                  />
                  {isDuplicateId && (
                    <p
                      id={idErrorMessageId}
                      role="alert"
                      className="mt-1 text-xs font-medium text-red-700 dark:text-red-400"
                    >
                      This case ID is used by another case. Case IDs must be unique.
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-1.5 pb-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={c.required}
                    onChange={(e) => updateCase(ci, { required: e.target.checked })}
                    className="h-3.5 w-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  />
                  Required for verdict
                </label>

                <button
                  type="button"
                  onClick={() => removeCase(ci)}
                  disabled={cases.length <= 1}
                  className={`ml-auto ${smallButtonClass}`}
                >
                  Remove case
                </button>
              </div>

              <div>
                <label
                  htmlFor={`case-question-${ci}`}
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Question
                </label>
                <input
                  id={`case-question-${ci}`}
                  type="text"
                  value={c.question}
                  onChange={(e) => updateCase(ci, { question: e.target.value })}
                  maxLength={LIMITS.maxQuestionChars}
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Evidence quotes (verbatim from the document)
                </p>
                {c.evidence.map((ev, ei) => (
                  <div key={ei} className="flex items-start gap-2">
                    <div className="flex-1">
                      <label htmlFor={`case-${ci}-quote-${ei}`} className="sr-only">
                        Evidence quote {ei + 1} for case {c.id || ci + 1}
                      </label>
                      <textarea
                        id={`case-${ci}-quote-${ei}`}
                        value={ev.quote}
                        onChange={(e) => updateEvidence(ci, ei, e.target.value)}
                        rows={2}
                        maxLength={LIMITS.maxQuoteChars}
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEvidence(ci, ei)}
                      disabled={c.evidence.length <= 1}
                      className={`mt-1 ${smallButtonClass}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addEvidence(ci)}
                  disabled={c.evidence.length >= LIMITS.maxQuotesPerCase}
                  className={`border-dashed ${smallButtonClass}`}
                >
                  + Add evidence quote
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addCase}
        disabled={cases.length >= LIMITS.maxCases}
        className="rounded border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        + Add case
      </button>
    </fieldset>
  );
}
