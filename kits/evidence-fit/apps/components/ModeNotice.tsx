type Props = { mode: "local" | "deployed" };

/**
 * Labels the source of a result unambiguously. The local path must never read as a live
 * Lamatic call, and its ranking must never read as a claim about semantic retrieval
 * quality — it is a deliberate upper bound that isolates the chunking question.
 */
export function ModeNotice({ mode }: Props) {
  if (mode === "local") {
    return (
      <div className="rounded-md border border-slate-300 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <p className="font-medium">Local deterministic run — Lamatic not configured.</p>
        <p className="mt-1">
          Chunking, span integrity, and the verdict were computed locally in this app. The
          per-question ranking used a deterministic local ranking that is a deliberate upper
          bound isolating the chunking question — it is not a claim about semantic retrieval
          quality. Configure LAMATIC_API_KEY, LAMATIC_PROJECT_ID, and LAMATIC_API_URL to run
          against deployed Lamatic flows instead.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
      <p className="font-medium">Deployed run — computed by Lamatic flows.</p>
      <p className="mt-1">
        Chunking, retrieval, every metric, and the verdict were computed inside the deployed
        Lamatic flows. The Evaluate flow&apos;s metrics code node runs the same deterministic
        engine used in local mode, against real vector search results for both strategies, and
        its output is wired directly to the API Response. This app only validates that response
        against the documented contract and renders it as-is — it never recomputes any metric or
        the verdict itself.
      </p>
    </div>
  );
}
