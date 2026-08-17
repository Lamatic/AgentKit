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
      <p className="font-medium">Deployed run — ranked by Lamatic flows.</p>
      <p className="mt-1">
        Chunking, span integrity, and the verdict are still computed deterministically in this
        app. Only the per-question ranking within each strategy came from the deployed vector
        search flow.
      </p>
    </div>
  );
}
