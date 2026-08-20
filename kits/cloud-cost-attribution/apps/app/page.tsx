"use client";

import { useState } from "react";
import { GitCommitHorizontal, ExternalLink } from "lucide-react";
import { analyze } from "../actions/orchestrate";
import type { Report } from "../lib/types";
import { UploadPanel } from "../components/UploadPanel";
import { SpendWaterfall } from "../components/SpendWaterfall";
import { AnomalyCard } from "../components/AnomalyCard";

export default function Home() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(input: { billingCsv: string; changeEventsJson: string; periodLabel: string }) {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await analyze(input);
      if (res.ok) setReport(res.data);
      else setError(res.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-edge bg-bg/80 backdrop-blur supports-backdrop-filter:bg-bg/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge-strong bg-panel text-accent">
              <GitCommitHorizontal className="h-4.5 w-4.5" strokeWidth={2.25} />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">Cloud Cost Attribution</p>
              <p className="text-[11px] text-muted-2">git blame for your cloud bill</p>
            </div>
          </div>
          <a
            href="https://github.com/Lamatic/AgentKit/tree/main/kits/cloud-cost-attribution"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-edge px-3 py-1.5 text-xs text-muted transition hover:border-edge-strong hover:text-ink"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Source
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
        {!report && !loading && (
          <div className="space-y-2 animate-fade-up">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Find out which deploy blew up your bill.
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed text-muted">
              Upload a billing export and a change log. Every anomaly gets ranked, attributed to a
              specific change with evidence, and paired with a costed fix — no arithmetic performed
              by the model, ever.
            </p>
          </div>
        )}

        <UploadPanel onAnalyze={handleAnalyze} loading={loading} error={error} />

        {report && (
          <div className="space-y-5 animate-fade-up">
            <SpendWaterfall report={report} />

            {report.anomalies.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-2">
                  Anomalies, ranked by impact
                </p>
                <div className="h-px flex-1 bg-edge" />
              </div>
            )}

            <div className="space-y-4">
              {report.anomalies.map((a, i) => (
                <AnomalyCard key={a.id} rank={i + 1} anomaly={a} currency={report.currency} />
              ))}
            </div>

            {report.anomalies.length === 0 && (
              <div className="rounded-(--radius) border border-edge bg-panel p-8 text-center">
                <p className="text-sm text-muted">No anomalies above the significance floor were found in this period.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="text-center text-xs text-muted-2">
          Every dollar figure above is computed deterministically. The model only explains, never calculates.
        </p>
      </footer>
    </div>
  );
}
