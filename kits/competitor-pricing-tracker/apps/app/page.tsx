"use client";

import { useState } from "react";
import { trackCompetitors } from "../actions/orchestrate";
import type { CompetitorInput, TrackResult } from "../lib/types";
import ComparisonTable from "../components/ComparisonTable";

const EMPTY_ROW: CompetitorInput = { competitorName: "", url: "" };

export default function Home() {
  const [rows, setRows] = useState<CompetitorInput[]>([
    { competitorName: "Notion", url: "https://www.notion.com/pricing" },
    { ...EMPTY_ROW },
  ]);
  const [results, setResults] = useState<TrackResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  function updateRow(i: number, field: keyof CompetitorInput, value: string) {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r))
    );
  }

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function run() {
    const valid = rows.filter((r) => r.url.trim().length > 0);
    if (valid.length === 0) {
      setStatus("Add at least one competitor URL to compare.");
      return;
    }
    setLoading(true);
    setResults([]);
    setStatus(`Scraping ${valid.length} pricing page${valid.length > 1 ? "s" : ""}…`);
    try {
      const data = await trackCompetitors(valid);
      setResults(data);
      const ok = data.filter((d) => d.ok).length;
      setStatus(`Done — ${ok}/${data.length} pages parsed.`);
    } catch {
      setStatus("Something went wrong. Check your credentials in .env.local.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="wrap">
      <header className="masthead">
        <div className="eyebrow">Competitive Intelligence</div>
        <h1>Competitor Pricing Tracker</h1>
        <p className="sub">
          Drop in competitor pricing pages. The agent scrapes each one, extracts
          the plans, prices, and features, and lays them out side by side.
        </p>
      </header>

      <section className="panel">
        <div className="panel-title">Competitors</div>
        {rows.map((row, i) => (
          <div className="row" key={i}>
            <input
              placeholder="Name (e.g. Notion)"
              value={row.competitorName}
              onChange={(e) => updateRow(i, "competitorName", e.target.value)}
            />
            <input
              className="mono"
              placeholder="https://competitor.com/pricing"
              value={row.url}
              onChange={(e) => updateRow(i, "url", e.target.value)}
            />
            <button
              className="icon-btn"
              onClick={() => removeRow(i)}
              aria-label="Remove competitor"
              disabled={rows.length === 1}
            >
              ×
            </button>
          </div>
        ))}

        <div className="actions">
          <button className="btn-ghost" onClick={addRow}>
            + Add competitor
          </button>
          <button className="btn-primary" onClick={run} disabled={loading}>
            {loading ? "Analyzing…" : "Compare pricing"}
          </button>
        </div>

        <div className="status">
          {loading && <span className="blink">▮ </span>}
          {status}
        </div>
      </section>

      <ComparisonTable results={results} />
    </main>
  );
}
