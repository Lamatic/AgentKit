"use client";

import type { ReviewResult, Verdict } from "../lib/types";

const VERDICTS: Record<
  Verdict,
  { title: string; blurb: string; ring: string; dot: string; tint: string }
> = {
  "needs-major-version": {
    title: "Needs a major version",
    blurb: "Consumers will break unless they change code.",
    ring: "border-red-500/40",
    dot: "bg-red-400",
    tint: "bg-red-500/10",
  },
  "review-required": {
    title: "Review required",
    blurb: "Some changes may affect consumers — read them before merging.",
    ring: "border-amber-500/40",
    dot: "bg-amber-400",
    tint: "bg-amber-500/10",
  },
  "safe-to-merge": {
    title: "Safe to merge",
    blurb: "Additive only — no consumer action needed.",
    ring: "border-emerald-500/40",
    dot: "bg-emerald-400",
    tint: "bg-emerald-500/10",
  },
  "no-api-change": {
    title: "No API change",
    blurb: "The two specs describe the same surface.",
    ring: "border-edge",
    dot: "bg-slate-400",
    tint: "bg-panel-2",
  },
};

function Count({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className="rounded-lg border border-edge bg-panel px-3 py-2">
      <div className={`text-lg font-semibold tabular-nums ${tone}`}>{n}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

export default function VerdictBanner({ result }: { result: ReviewResult }) {
  const v = VERDICTS[result.verdict] ?? VERDICTS["review-required"];
  const counts = result.counts ?? {
    breaking: 0,
    potentiallyBreaking: 0,
    additive: 0,
    unclassified: 0,
  };
  // Only shown when it happens, but it must be shown — it is why an otherwise
  // clean diff can still come back as review-required.
  const unclassified = counts.unclassified ?? 0;

  return (
    <div className={`rounded-xl border ${v.ring} ${v.tint} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${v.dot}`} />
            <h2 className="text-base font-semibold">{v.title}</h2>
            {result.oldVersion || result.newVersion ? (
              <span className="rounded-md border border-edge bg-panel px-2 py-0.5 text-xs text-muted">
                {result.oldVersion ?? "?"} → {result.newVersion ?? "?"}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm text-muted">{v.blurb}</p>
          {result.summary ? (
            <p className="mt-2 text-sm leading-relaxed">{result.summary}</p>
          ) : null}
        </div>

        <div
          className={`grid shrink-0 gap-2 ${unclassified ? "grid-cols-5" : "grid-cols-4"}`}
        >
          <Count n={counts.breaking} label="Breaking" tone="text-severity-breaking" />
          <Count
            n={counts.potentiallyBreaking}
            label="Maybe"
            tone="text-severity-maybe"
          />
          <Count n={counts.additive} label="Additive" tone="text-severity-additive" />
          {unclassified ? (
            <Count n={unclassified} label="Unknown" tone="text-severity-unknown" />
          ) : null}
          <Count n={result.totalChanges} label="Total" tone="text-ink" />
        </div>
      </div>
    </div>
  );
}
