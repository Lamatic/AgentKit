"use client";

import { useState } from "react";
import { parseTradesCsv } from "@/lib/csv";
import { analyzeJournal } from "@/actions/orchestrate";
import type { Analysis, Trade } from "@/lib/types";
import UploadDropzone from "@/components/UploadDropzone";
import MetricsCards from "@/components/MetricsCards";
import EquityCurve from "@/components/EquityCurve";
import FindingsList from "@/components/FindingsList";
import ChatPanel from "@/components/ChatPanel";

export default function Home() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(trades: Trade[]) {
    setLoading(true);
    setError(null);
    const res = await analyzeJournal(trades);
    setLoading(false);
    if (!res.ok || !res.analysis) {
      setError(res.error || "Analysis failed");
      return;
    }
    setAnalysis(res.analysis);
  }

  async function handleCsv(text: string) {
    setError(null);
    const { trades, errors } = parseTradesCsv(text);
    if (errors.length) {
      setError(errors.slice(0, 6).join("   •   "));
      if (!trades.length) return;
    }
    await run(trades);
  }

  function reset() {
    setAnalysis(null);
    setError(null);
  }

  return (
    <div className="wrap">
      <div className="header">
        <div className="brand">
          <span className="dot" />
          <h1>Trading Journal Coach</h1>
        </div>
        {analysis && (
          <button className="btn ghost" onClick={reset}>
            Analyze another
          </button>
        )}
      </div>
      <p className="sub">
        Behavioural coaching from your own executed trades — not market picks.
      </p>

      {error && <div className="banner error">{error}</div>}

      {!analysis && <UploadDropzone onCsv={handleCsv} loading={loading} />}

      {analysis && (
        <>
          {analysis.mock && (
            <div className="banner">
              <b>Preview mode.</b> Metrics and charts are computed locally from your file. Connect your Lamatic
              flows (add the Flow IDs to <span className="mono">.env.local</span>) to unlock AI pattern detection
              and coaching.
            </div>
          )}

          {analysis.status === "insufficient_data" ? (
            <div className="panel">
              <h3>Not enough data yet</h3>
              <p className="sub" style={{ margin: 0 }}>{analysis.message}</p>
            </div>
          ) : (
            <>
              <MetricsCards analysis={analysis} />
              <div className="grid2">
                <EquityCurve metrics={analysis.metrics} />
                <FindingsList analysis={analysis} />
              </div>
              <ChatPanel analysis={analysis} />
            </>
          )}
        </>
      )}
    </div>
  );
}
