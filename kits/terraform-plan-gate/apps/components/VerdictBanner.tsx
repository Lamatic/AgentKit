import type { Decision, ReviewResult } from "../lib/types";

const LABEL: Record<ReviewResult["verdict"], { text: string; color: string }> = {
  allow: { text: "ALLOW", color: "var(--allow)" },
  "needs-approval": { text: "NEEDS APPROVAL", color: "var(--approve)" },
  block: { text: "BLOCK", color: "var(--block)" },
  "no-changes": { text: "NO CHANGES", color: "var(--muted)" },
};

export function VerdictBanner({ result, decision }: { result: ReviewResult; decision: Decision | null }) {
  const v = LABEL[result.verdict];
  const c = result.counts;
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border p-4"
      style={{ borderColor: v.color, background: "var(--panel)" }}
    >
      <div className="flex flex-wrap items-baseline gap-4">
        <span className="text-xl font-bold tracking-wide" style={{ color: v.color }}>
          {v.text}
        </span>
        <span className="text-sm">{result.summary}</span>
        {decision && (
          <span className="ml-auto rounded px-2 py-0.5 text-xs font-medium" style={{ border: `1px solid ${v.color}` }}>
            {decision.action} · {new Date(decision.decidedAt).toLocaleString()}
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs" style={{ color: "var(--muted)" }}>
        <span>critical {c.critical}</span>
        <span>high {c.high}</span>
        <span>medium {c.medium}</span>
        <span>low {c.low}</span>
        <span>unclassified {c.unclassified}</span>
        {result.invalidFacts > 0 && (
          <span>{result.invalidFacts} change entr{result.invalidFacts === 1 ? "y" : "ies"} could not be read and count as unclassified</span>
        )}
        {result.droppedAssessments > 0 && (
          <span>{result.droppedAssessments} model assessment(s) discarded for not matching a plan resource</span>
        )}
        <span className="ml-auto">
          verdict is arithmetic: any critical → block; any high, medium or unclassified → needs approval
        </span>
      </div>
    </div>
  );
}
