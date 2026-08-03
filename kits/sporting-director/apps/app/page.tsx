"use client";

import { useState } from "react";
import { generateReport } from "@/actions/orchestrate";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [buyingClub, setBuyingClub] = useState("");
  const [budget, setBudget] = useState("");
  const [needs, setNeeds] = useState("");
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);

    const result = await generateReport(playerName, buyingClub, budget, needs);

    if (!result.success) {
      setError(result.error);
    } else {
      setReport(result.data.report);
    }

    setLoading(false);
  }

  return (
    <main
      className="min-h-screen relative bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70 backdrop-blur-[2px]" />

      <div className="relative max-w-2xl mx-auto px-4 py-24">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white/80">
              <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-medium text-white">Agent Hunt</h1>
            <p className="text-xs text-white/60">Sporting Director</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 mb-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl"
        >
          <div>
            <label className="block text-xs text-white/60 mb-1">Player Name</label>
            <input
              required
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 transition-colors"
              placeholder="e.g. Sunil Chetri"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Buying Club</label>
            <input
              required
              value={buyingClub}
              onChange={(e) => setBuyingClub(e.target.value)}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 transition-colors"
              placeholder="e.g. Chennayin FC"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Budget</label>
            <input
              required
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 transition-colors"
              placeholder="e.g. £80 million"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Club Needs</label>
            <textarea
              required
              value={needs}
              onChange={(e) => setNeeds(e.target.value)}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 transition-colors resize-none"
              placeholder="e.g. India's finest talent"
              rows={2}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white text-gray-900 hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium transition-colors"
          >
            {loading ? "Analyzing..." : "Generate Report"}
          </button>
        </form>

        {error && (
          <div className="rounded-lg border border-red-400/30 bg-red-950/40 backdrop-blur-md text-red-200 px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {report && (
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl px-5 py-4 whitespace-pre-wrap text-sm leading-relaxed text-white/90 shadow-2xl">
            {report}
          </div>
        )}
      </div>
    </main>
  );
}