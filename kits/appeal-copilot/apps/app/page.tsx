"use client";

import { useState } from "react";
import { analyzeDenial } from "../actions/orchestrate";
import { EXAMPLE_SCENARIOS } from "../lib/demo-data";
import type { AppealResult, DenialCategory } from "../lib/types";
import type { UrgencyLevel } from "../lib/deadline-urgency";
import {
  FileWarning,
  Sparkles,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Download,
  ShieldAlert,
  ShieldCheck,
  Clock,
  ClipboardList,
  Info,
} from "lucide-react";

// Status palette (validated: dataviz skill) — same hex in light and dark, always paired
// with an icon + text label since warning/serious fall below 3:1 on the light surface.
const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
  muted: "#898781",
} as const;

const CATEGORY_LABEL: Record<DenialCategory, string> = {
  "medical-necessity": "Medical necessity",
  administrative: "Administrative",
  coverage: "Coverage",
  other: "Other",
};

const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; color: string; icon: typeof Clock }> = {
  critical: { label: "Deadline in 7 days or less", color: STATUS.critical, icon: ShieldAlert },
  moderate: { label: "Deadline within 30 days", color: STATUS.warning, icon: Clock },
  low: { label: "Deadline more than 30 days out", color: STATUS.good, icon: ShieldCheck },
  expired: { label: "Appeal deadline may have passed", color: STATUS.critical, icon: ShieldAlert },
  unknown: { label: "Deadline not stated in the letter", color: STATUS.muted, icon: Clock },
};

function strengthBand(score: number): { label: string; color: string } {
  if (score >= 7) return { label: "Strong", color: STATUS.good };
  if (score >= 4) return { label: "Needs more evidence", color: STATUS.warning };
  return { label: "Weak", color: STATUS.critical };
}

const LOADING_STEPS = [
  "Classifying the denial reason...",
  "Checking the appeal deadline...",
  "Drafting a category-specific appeal letter...",
  "Scoring appeal strength and evidence gaps...",
];

export default function Home() {
  const [denialText, setDenialText] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AppealResult | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const runAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!denialText.trim()) {
      setError("Paste the denial letter or EOB text before analyzing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1400);

    try {
      const response = await analyzeDenial(denialText, additionalContext);
      clearInterval(interval);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Analysis failed.");
      }
      setResult(response.data);
      setDemoMode(Boolean(response.demoMode));
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadExample = (id: string) => {
    const scenario = EXAMPLE_SCENARIOS.find((s) => s.id === id);
    if (!scenario) return;
    setDenialText(scenario.denialText);
    setAdditionalContext(scenario.additionalContext);
    setError(null);
    setResult(null);
  };

  const copyLetter = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.appealLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadLetter = () => {
    if (!result) return;
    const blob = new Blob([result.appealLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appeal-letter-${result.claimNumber ?? "draft"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-black/10 dark:border-white/10 sticky top-0 z-10 bg-[var(--background)]/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <FileWarning className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Appeal Copilot</h1>
            <p className="text-xs text-black/60 dark:text-white/60">Insurance claim denial → scored appeal package</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: input form */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-base font-semibold">Paste your denial letter</h2>
              <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                We classify the denial reason, check the appeal deadline, and draft a first-level appeal letter with a
                strength score and missing-evidence checklist.
              </p>
            </div>

            <form onSubmit={runAnalysis} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="denial-text" className="text-sm font-medium">
                  Denial letter / EOB text
                </label>
                <textarea
                  id="denial-text"
                  required
                  rows={8}
                  placeholder="Paste the denial letter or Explanation of Benefits text here..."
                  value={denialText}
                  onChange={(e) => setDenialText(e.target.value)}
                  className="w-full rounded-xl border border-black/15 dark:border-white/15 bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="context" className="text-sm font-medium">
                  Additional context <span className="text-black/40 dark:text-white/40 font-normal">(optional)</span>
                </label>
                <textarea
                  id="context"
                  rows={3}
                  placeholder="Anything relevant not in the letter itself, e.g. medical history, urgency, prior communication..."
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  className="w-full rounded-xl border border-black/15 dark:border-white/15 bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-black/20 dark:disabled:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Analyze denial
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6">
            <h3 className="text-sm font-semibold mb-1">Try an example</h3>
            <p className="text-xs text-black/60 dark:text-white/60 mb-3">
              Three realistic denial scenarios, one per category the flow handles differently.
            </p>
            <div className="flex flex-col gap-2">
              {EXAMPLE_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => loadExample(s.id)}
                  className="text-left text-sm px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 hover:border-blue-500 hover:bg-blue-500/5 transition-colors cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right: results */}
        <section className="lg:col-span-7 flex flex-col">
          <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 flex-1 min-h-[480px] flex flex-col">
            {/* Idle */}
            {!isLoading && !result && !error && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="h-14 w-14 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4">
                  <ClipboardList className="h-6 w-6 text-black/40 dark:text-white/40" aria-hidden="true" />
                </div>
                <h3 className="font-semibold">Your appeal package will appear here</h3>
                <p className="text-sm text-black/60 dark:text-white/60 max-w-sm mt-2">
                  Denial category, deadline urgency, a drafted appeal letter, and a strength score with a missing-evidence
                  checklist — usually in under a minute.
                </p>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-6" aria-hidden="true" />
                <div className="flex flex-col gap-2 max-w-sm w-full">
                  {LOADING_STEPS.map((msg, i) => (
                    <div
                      key={msg}
                      className={`flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg text-left transition-colors ${
                        i === loadingStep
                          ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium"
                          : i < loadingStep
                          ? "text-black/40 dark:text-white/40"
                          : "text-black/25 dark:text-white/25"
                      }`}
                    >
                      {i < loadingStep ? (
                        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      ) : i === loadingStep ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                      ) : (
                        <span className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="h-14 w-14 rounded-full bg-[#d03b3b]/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6" style={{ color: STATUS.critical }} aria-hidden="true" />
                </div>
                <h3 className="font-semibold" style={{ color: STATUS.critical }}>
                  Analysis failed
                </h3>
                <p className="text-sm text-black/60 dark:text-white/60 max-w-sm mt-2">{error}</p>
                <button
                  onClick={runAnalysis}
                  className="mt-5 px-4 py-2 rounded-lg border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 text-sm font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Try again
                </button>
              </div>
            )}

            {/* Result */}
            {result && !isLoading && (
              <div className="flex flex-col gap-5">
                {demoMode && (
                  <div className="flex items-start gap-2 text-xs rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-2.5 text-blue-700 dark:text-blue-300">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      Demo mode: no Lamatic credentials configured, so this is representative mocked output. Add
                      `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, and `APPEAL_ANALYSIS_FLOW_ID` to run
                      the real flow.
                    </span>
                  </div>
                )}

                {/* Top row: category, urgency, strength */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-black/10 dark:border-white/10 p-3.5">
                    <p className="text-[11px] uppercase tracking-wide text-black/50 dark:text-white/50 font-medium mb-1.5">
                      Denial category
                    </p>
                    <p className="text-sm font-semibold">{CATEGORY_LABEL[result.denialCategory]}</p>
                    {result.claimNumber && (
                      <p className="text-xs text-black/50 dark:text-white/50 mt-0.5">Claim #{result.claimNumber}</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-black/10 dark:border-white/10 p-3.5">
                    <p className="text-[11px] uppercase tracking-wide text-black/50 dark:text-white/50 font-medium mb-1.5">
                      Deadline
                    </p>
                    {(() => {
                      const cfg = URGENCY_CONFIG[result.urgencyLevel];
                      const Icon = cfg.icon;
                      return (
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-4 w-4 shrink-0" style={{ color: cfg.color }} aria-hidden="true" />
                          <p className="text-sm font-semibold">
                            {result.daysRemaining !== null
                              ? result.daysRemaining >= 0
                                ? `${result.daysRemaining}d left`
                                : `${Math.abs(result.daysRemaining)}d overdue`
                              : "Unknown"}
                          </p>
                        </div>
                      );
                    })()}
                    <p className="text-xs text-black/50 dark:text-white/50 mt-0.5">{URGENCY_CONFIG[result.urgencyLevel].label}</p>
                  </div>

                  <div className="rounded-xl border border-black/10 dark:border-white/10 p-3.5">
                    <p className="text-[11px] uppercase tracking-wide text-black/50 dark:text-white/50 font-medium mb-1.5">
                      Appeal strength
                    </p>
                    {(() => {
                      const band = strengthBand(result.strengthScore);
                      return (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold" style={{ color: band.color }}>
                              {result.strengthScore}
                            </span>
                            <span className="text-xs text-black/50 dark:text-white/50">/10</span>
                          </div>
                          <div
                            className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 mt-1.5 overflow-hidden"
                            role="meter"
                            aria-valuenow={result.strengthScore}
                            aria-valuemin={1}
                            aria-valuemax={10}
                            aria-label="Appeal strength score"
                          >
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${(result.strengthScore / 10) * 100}%`, backgroundColor: band.color }}
                            />
                          </div>
                          <p className="text-xs mt-1" style={{ color: band.color }}>
                            {band.label}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Rationale */}
                <p className="text-sm text-black/70 dark:text-white/70">{result.rationale}</p>

                {/* Missing evidence */}
                {result.missingEvidence.length > 0 && (
                  <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
                    <h4 className="text-sm font-semibold mb-2.5 flex items-center gap-1.5">
                      <ClipboardList className="h-4 w-4 text-black/50 dark:text-white/50" aria-hidden="true" />
                      What would strengthen this appeal
                    </h4>
                    <ul className="flex flex-col gap-2">
                      {result.missingEvidence.map((item) => (
                        <li key={item} className="text-sm flex items-start gap-2">
                          <span
                            className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0"
                            style={{ backgroundColor: STATUS.warning }}
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Letter */}
                <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/10 dark:border-white/10">
                    <h4 className="text-sm font-semibold">Draft appeal letter</h4>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={copyLetter}
                        className="text-xs px-2.5 py-1.5 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1 cursor-pointer"
                      >
                        {copied ? <Check className="h-3 w-3" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={downloadLetter}
                        className="text-xs px-2.5 py-1.5 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="h-3 w-3" aria-hidden="true" />
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm p-4 font-sans max-h-96 overflow-y-auto">{result.appealLetter}</pre>
                </div>

                {/* Disclaimer */}
                <p className="text-xs text-black/50 dark:text-white/50 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  This is not medical or legal advice. Review the draft with your provider or a patient advocate before
                  submitting, and verify all placeholder fields.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-black/10 dark:border-white/10 py-6 text-center text-xs text-black/50 dark:text-white/50">
        Built on Lamatic.ai — Appeal Copilot is an AgentKit contribution.
      </footer>
    </div>
  );
}
