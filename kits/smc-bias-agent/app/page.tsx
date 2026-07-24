"use client";

import { useState } from "react";
import PriceChart from "@/components/PriceChart";
import BiasCard from "@/components/BiasCard";
import { SMCAnalysis } from "@/lib/types";

const INTERVALS = ["15m", "1h", "4h", "1d"];

interface ApiResponse {
  analysis: SMCAnalysis;
  narrative: { reasoning: string; source: "lamatic" | "fallback" };
}

export default function Home() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setIntervalValue] = useState("4h");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runScan(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, interval }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:py-12 flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Smart Money Concepts</span>
        <h1 className="font-display text-2xl md:text-3xl font-medium text-ink">SMC Bias Agent</h1>
        <p className="text-sm text-muted max-w-xl">
          Reads recent price action for a pair, marks up order blocks, fair value gaps, and structure breaks the way
          an ICT/SMC trader would by hand, then explains the bias in plain English.
        </p>
      </header>

      <form onSubmit={runScan} className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-panel p-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-muted">Symbol</span>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="BTCUSDT"
            className="w-40 rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-ink outline-none focus:border-signal"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-muted">Timeframe</span>
          <select
            value={interval}
            onChange={(e) => setIntervalValue(e.target.value)}
            className="rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-ink outline-none focus:border-signal"
          >
            {INTERVALS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="ml-auto rounded-md bg-signal px-5 py-2 font-display text-sm font-medium text-bg transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Scanning…" : "Scan"}
        </button>
      </form>

      {error && (
        <div className="rounded-md border border-bear/40 bg-bear/10 px-4 py-3 text-sm text-ink">
          Couldn&apos;t analyze that symbol: {error}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="animate-fade-up rounded-lg border border-border bg-panel p-4">
            <PriceChart analysis={data.analysis} />
            <div className="flex gap-4 pt-3 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-signal/60" /> order block
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-bull/40" /> fair value gap
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-0.5 border-t border-dashed border-signal" /> structure break
              </span>
            </div>
          </div>

          <BiasCard analysis={data.analysis} reasoning={data.narrative.reasoning} source={data.narrative.source} />
        </div>
      )}

      {!data && !error && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
          Run a scan to see the detected structure.
        </div>
      )}
    </main>
  );
}
