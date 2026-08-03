"use client";

import { useState } from "react";
import { analyze, type AnalyzeResult } from "../actions/orchestrate";

const SAMPLES: { label: string; url: string }[] = [
  { label: "Titanic", url: "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv" },
  { label: "Iris", url: "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" },
  { label: "Air travel", url: "https://people.sc.fsu.edu/~jburkardt/data/csv/airtravel.csv" },
];

export default function Page() {
  const [url, setUrl] = useState(SAMPLES[0].url);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<AnalyzeResult | null>(null);

  async function run() {
    setLoading(true);
    setRes(null);
    const r = await analyze(url.trim());
    setRes(r);
    setLoading(false);
  }

  function download() {
    if (!res?.dashboardHtml) return;
    const blob = new Blob([res.dashboardHtml], { type: "text/html" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = "eda-dashboard.html";
    a.click();
    URL.revokeObjectURL(u);
  }

  return (
    <main className="wrap">
      <div className="header">
        <h1>EDA Analyst</h1>
        <p>Give it a CSV URL — the agent cleans the data, decides what to analyze, and builds a dashboard.</p>
      </div>

      <div className="card">
        <div className="row">
          <input
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/data.csv"
            onKeyDown={(e) => { if (e.key === "Enter" && !loading) run(); }}
          />
          <button className="btn" onClick={run} disabled={loading}>
            {loading ? "Analyzing…" : "Analyze"}
          </button>
        </div>

        <div className="samples">
          <span className="hint" style={{ marginTop: 0 }}>Try:</span>
          {SAMPLES.map((s) => (
            <span key={s.label} className="chip" onClick={() => setUrl(s.url)}>{s.label}</span>
          ))}
        </div>
        <p className="hint">Must be a public, direct-download CSV link. Analysis runs several reasoning steps, so it can take up to a minute.</p>

        {loading && (
          <div className="status"><span className="spinner" /> Profiling → cleaning → analyzing → rendering…</div>
        )}
        {res && !res.ok && <div className="error">{res.error}</div>}
      </div>

      {res?.ok && res.dashboardHtml && (
        <div className="result">
          <div className="result-bar">
            <div className="badges">
              {typeof res.validated === "boolean" && (
                <span className={"badge " + (res.validated ? "ok" : "bad")}>
                  {res.validated ? "✓ cleaned & validated" : "⚠ cleaning reverted"}
                </span>
              )}
              {typeof res.chartCount === "number" && <span className="badge">{res.chartCount} charts</span>}
            </div>
            <button className="btn secondary" onClick={download}>Download .html</button>
          </div>
          <iframe className="frame" title="EDA dashboard" srcDoc={res.dashboardHtml} sandbox="allow-scripts" />
        </div>
      )}
    </main>
  );
}
