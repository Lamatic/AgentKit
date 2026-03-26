"use client";

import { useState } from "react";
import { generateChangelog } from "@/actions/orchestrate";
import ReactMarkdown from "react-markdown";

export default function ChangelogPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl || !dateFrom || !dateTo) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setResult(null);
    setIsLoading(true);
    try {
      const changelog = await generateChangelog({ repoUrl, dateFrom, dateTo });
      setResult(changelog);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white font-mono">
      {/* Grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-indigo-400 text-xs mb-6 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            AI-Powered
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white leading-none mb-4">
            Changelog
            <span className="text-indigo-400"> Generator</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl leading-relaxed">
            Turn your GitHub repository activity into a beautifully structured
            changelog — in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-zinc-300 tracking-widest uppercase mb-8">
              Repository Details
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="repo-url" className="block text-xs text-zinc-500 mb-2 tracking-wider uppercase">
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  id="repo-url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date-from" className="block text-xs text-zinc-500 mb-2 tracking-wider uppercase">
                    From Date
                  </label>
                  <input
                    type="date"
                    id="date-from"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label htmlFor="date-to" className="block text-xs text-zinc-500 mb-2 tracking-wider uppercase">
                    To Date
                  </label>
                  <input
                    type="date"
                    id="date-to"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 text-sm tracking-wide"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Changelog
                  </>
                )}
              </button>
            </form>

            {/* Info box */}
            <div className="mt-8 pt-6 border-t border-zinc-800">
              <p className="text-xs text-zinc-600 leading-relaxed">
                Provide a GitHub repo URL and date range. The AI will generate a
                professional changelog with features, fixes, improvements, and
                breaking changes.
              </p>
            </div>
          </div>

          {/* Right: Output */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-semibold text-zinc-300 tracking-widest uppercase">
                Output
              </h2>
              {result && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-lg transition-all"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Markdown
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto">
              {!result && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-zinc-600 text-sm">
                    Your generated changelog will appear here
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                    <svg className="animate-spin w-7 h-7 text-indigo-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                  <p className="text-zinc-400 text-sm">Generating your changelog...</p>
                  <p className="text-zinc-600 text-xs mt-1">This may take a few seconds</p>
                </div>
              )}

              {result && (
                <div className="prose prose-invert prose-sm max-w-none
                  prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                  prose-h2:text-base prose-h2:mt-6 prose-h2:mb-3
                  prose-p:text-zinc-300 prose-p:leading-relaxed
                  prose-li:text-zinc-300 prose-li:my-0.5
                  prose-strong:text-white
                  prose-code:text-indigo-300 prose-code:bg-indigo-500/10 prose-code:px-1 prose-code:rounded">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-700 text-xs mt-12 tracking-wider">
          POWERED BY LAMATIC AI · AGENTKIT
        </p>
      </div>
    </main>
  );
}