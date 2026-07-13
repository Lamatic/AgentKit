"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { auditSubscriptions } from "@/actions/orchestrate";
import {
  Loader2,
  Sparkles,
  TrendingDown,
  Wallet,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const SAMPLE = `NETFLIX $15.49
SPOTIFY $10.99
ADOBE CREATIVE $59.99 (used once 4 months ago)
GYMPASS $40 (never used)
AMAZON PRIME $14.99
DROPBOX $11.99 (used weekly)
NOTION $8 (used daily)
ONE-OFF COFFEE $4.50`;

type Sub = {
  merchant?: string;
  amount?: number;
  cadence?: string;
  category?: string;
  usage?: string;
  reason?: string;
  monthly_cost?: number;
  cancellation_url?: string;
};

type Analysis = {
  summary?: string;
  subscriptions?: Sub[];
  totals?: {
    monthly_recurring?: number;
    annual_recurring?: number;
    estimated_savings?: number;
  };
  top_recommendations?: string[];
  risk_flags?: string[];
};

/**
 * Returns a colored Badge describing a subscription's usage verdict.
 * @param u - Usage string ("used" | "rarely" | "unused").
 */
function usageBadge(u?: string) {
  const v = (u || "").toLowerCase();
  if (v === "unused")
    return <Badge className="bg-red-100 text-red-700">Unused</Badge>;
  if (v === "rarely")
    return <Badge className="bg-amber-100 text-amber-700">Rarely used</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700">Used</Badge>;
}

/**
 * Formats a numeric amount as a dollar string, or "—" when undefined.
 * @param n - The number to format.
 */
const fmt = (n?: number) =>
  typeof n === "number" ? `$${n.toFixed(2)}` : "—";

/**
 * Main page: statement input form and the rendered subscription audit results.
 */
export default function Page() {
  const [statement, setStatement] = React.useState("");
  const [goals, setGoals] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null);
  const [report, setReport] = React.useState("");

  /**
   * Sends the statement to the SubSniffer flow and stores the audit result.
   */
  const run = async () => {
    if (!statement.trim()) {
      setError("Paste a statement or list of charges first.");
      return;
    }
    setLoading(true);
    setError("");
    setAnalysis(null);
    setReport("");
    try {
      const res = await auditSubscriptions(statement, goals);
      if (!res.success) {
        setError(res.error || "Audit failed.");
        return;
      }
      const d: any = res.data;
      if (d && typeof d === "object") {
        setAnalysis(d.analysis ?? d);
        setReport(typeof d.report === "string" ? d.report : "");
      } else if (typeof d === "string") {
        setReport(d);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clears the current audit result and returns to the input form.
   */
  const reset = () => {
    setAnalysis(null);
    setReport("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-10">
        {!analysis && !report && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Find the money you&apos;re quietly losing
              </h1>
              <p className="mt-3 text-slate-600">
                Paste a bank statement or list of charges. SubSniffer finds every
                subscription, flags the ones you don&apos;t use, and links you to
                cancel.
              </p>
            </div>

            <Card>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Your statement / charges
              </label>
              <Textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder={SAMPLE}
                className="min-h-[200px] font-mono text-xs"
                disabled={loading}
              />

              <label className="mb-2 mt-4 block text-sm font-medium text-slate-700">
                Goals (optional)
              </label>
              <Textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="e.g. cancel anything I haven't used in 60 days"
                className="min-h-[60px]"
                disabled={loading}
              />

              {error && (
                <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="mt-4 flex items-center gap-3">
                <Button onClick={run} disabled={loading || !statement.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Auditing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Audit my subscriptions
                    </>
                  )}
                </Button>
                <button
                  onClick={() => setStatement(SAMPLE)}
                  className="text-xs text-indigo-600 hover:underline"
                  disabled={loading}
                >
                  Load sample
                </button>
              </div>
            </Card>
          </>
        )}

        {(analysis || report) && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Your subscription audit
              </h2>
              <Button variant="outline" onClick={reset}>
                Start over
              </Button>
            </div>

            {analysis?.totals && (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      Monthly recurring
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {fmt(analysis.totals.monthly_recurring)}
                  </p>
                </Card>
                <Card>
                  <div className="flex items-center gap-2 text-slate-500">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      Est. monthly savings
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-emerald-600">
                    {fmt(analysis.totals.estimated_savings)}
                  </p>
                </Card>
                <Card>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      Annual recurring
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {fmt(analysis.totals.annual_recurring)}
                  </p>
                </Card>
              </div>
            )}

            {report && (
              <Card className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {report}
              </Card>
            )}

            {analysis?.subscriptions && analysis.subscriptions.length > 0 && (
              <Card className="mb-6 p-0">
                <div className="border-b border-slate-100 px-6 py-4 font-semibold text-slate-900">
                  Detected subscriptions
                </div>
                <ul className="divide-y divide-slate-100">
                  {analysis.subscriptions.map((s, i) => (
                    <li
                      key={i}
                      className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {s.merchant || "?"}
                          </span>
                          {usageBadge(s.usage)}
                        </div>
                        <p className="text-xs text-slate-500">
                          {s.category} · {s.cadence} · {fmt(s.amount)}{" "}
                          {s.reason ? `· ${s.reason}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900">
                          {fmt(s.monthly_cost)}/mo
                        </span>
                        {s.cancellation_url ? (
                          <a
                            href={s.cancellation_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                          >
                            Cancel <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {analysis?.top_recommendations &&
              analysis.top_recommendations.length > 0 && (
                <Card className="mb-6">
                  <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Quick
                    wins
                  </div>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                    {analysis.top_recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </Card>
              )}

            {analysis?.risk_flags && analysis.risk_flags.length > 0 && (
              <Card className="mb-6">
                <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> Watch
                  outs
                </div>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                  {analysis.risk_flags.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}
      </main>

      <footer className="mx-auto max-w-4xl px-6 pb-10 text-center text-xs text-slate-400">
        Built with Lamatic.ai AgentKit · Estimates to inform your own decisions,
        not financial advice.
      </footer>
    </div>
  );
}
