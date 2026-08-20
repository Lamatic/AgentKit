"use client";

import { useMemo, useState } from "react";
import { analyzeDenial } from "../actions/orchestrate";
import { getExampleScenarios } from "../lib/demo-data";
import { MAX_ADDITIONAL_CONTEXT_CHARS, MAX_DENIAL_TEXT_CHARS } from "../lib/limits";
import type { AppealResult, DenialCategory } from "../lib/types";
import type { UrgencyLevel } from "../lib/deadline-urgency";
import {
  FileWarning,
  Sparkles,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  Download,
  ShieldAlert,
  ShieldCheck,
  Clock,
  ChevronDown,
  Info,
  ArrowLeft,
  Stethoscope,
  FileClock,
  Building2,
  RefreshCw,
  Pencil,
} from "lucide-react";

// Status palette — values live in app/globals.css, split by role. STATUS is for
// graphical objects (icons, gauge stroke, markers, borders) at a 3:1 floor; STATUS_TEXT
// is for anything rendered as text and clears 4.5:1. They are not interchangeable: see
// the contrast note in globals.css.
const STATUS = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  serious: "var(--status-serious)",
  critical: "var(--status-critical)",
  muted: "var(--status-neutral)",
} as const;

const STATUS_TEXT = {
  good: "var(--status-good-text)",
  warning: "var(--status-warning-text)",
  serious: "var(--status-serious-text)",
  critical: "var(--status-critical-text)",
  muted: "var(--status-neutral-text)",
} as const;

const CATEGORY_LABEL: Record<DenialCategory, string> = {
  "medical-necessity": "Medical necessity",
  administrative: "Administrative",
  coverage: "Coverage",
  other: "Other",
};

const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; color: string; icon: typeof Clock }> = {
  critical: { label: "7 days or less", color: STATUS.critical, icon: ShieldAlert },
  moderate: { label: "Within 30 days", color: STATUS.warning, icon: Clock },
  low: { label: "More than 30 days out", color: STATUS.good, icon: ShieldCheck },
  expired: { label: "May have already passed", color: STATUS.critical, icon: ShieldAlert },
  unknown: { label: "Not stated in the letter", color: STATUS.muted, icon: Clock },
};

/** `color` paints the gauge ring (graphical, 3:1); `textColor` paints the label (4.5:1). */
function strengthBand(score: number | null): { label: string; color: string; textColor: string } {
  if (score === null) return { label: "Not scored", color: STATUS.muted, textColor: STATUS_TEXT.muted };
  if (score >= 7) return { label: "Strong appeal", color: STATUS.good, textColor: STATUS_TEXT.good };
  if (score >= 4)
    return { label: "Needs more evidence", color: STATUS.warning, textColor: STATUS_TEXT.warning };
  return { label: "Weak — significant gaps", color: STATUS.critical, textColor: STATUS_TEXT.critical };
}

const LOADING_STEPS = [
  "Classifying the denial reason",
  "Checking the appeal deadline",
  "Drafting a category-specific appeal letter",
  "Scoring appeal strength and evidence gaps",
];

const EXAMPLE_META: Record<string, { icon: typeof Stethoscope; blurb: string }> = {
  "medical-necessity": {
    icon: Stethoscope,
    blurb: "Insurer says the treatment wasn't medically necessary — strategy: request a peer-to-peer review.",
  },
  administrative: {
    icon: FileClock,
    blurb: "Missing prior authorization for an urgent visit — strategy: request retroactive authorization.",
  },
  coverage: {
    icon: Building2,
    blurb: "Out-of-network denial with no in-network option nearby — strategy: request a network exception.",
  },
};

function StrengthGauge({
  score,
  color,
  textColor,
}: {
  score: number | null;
  color: string;
  textColor: string;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = score === null ? 0 : Math.max(0, Math.min(10, score)) / 10;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" className="stroke-black/[0.07] dark:stroke-white/[0.09]" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          // stroke goes through style, not the presentation attribute: var() does not
          // resolve in SVG presentation attributes.
          style={{ stroke: color, transition: "stroke-dashoffset 700ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* 30px bold clears WCAG's large-text bar, but use the text token anyway so the
            figure holds up if the type scale ever shrinks. */}
        <span className="text-3xl font-bold tabular-nums" style={{ color: textColor }}>
          {score ?? "—"}
        </span>
        <span className="text-[11px] text-muted -mt-0.5">out of 10</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [denialText, setDenialText] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AppealResult | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editedLetter, setEditedLetter] = useState("");
  const [isEditingLetter, setIsEditingLetter] = useState(false);

  // Resolved once per page load so the example deadlines stay relative to today.
  const exampleScenarios = useMemo(() => getExampleScenarios(), []);

  const performAnalysis = async () => {
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
      setEditedLetter(response.data.appealLetter);
      setIsEditingLetter(false);
      setDemoMode(Boolean(response.demoMode));
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performAnalysis();
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      performAnalysis();
    }
  };

  const loadExample = (id: string) => {
    const scenario = exampleScenarios.find((s) => s.id === id);
    if (!scenario) return;
    setDenialText(scenario.denialText);
    setAdditionalContext(scenario.additionalContext);
    setShowContext(true);
    setError(null);
    setResult(null);
  };

  const startOver = () => {
    setResult(null);
    setError(null);
  };

  const isValidationError = error === "Paste the denial letter or EOB text before analyzing.";

  const copyLetter = () => {
    if (!result) return;
    navigator.clipboard.writeText(editedLetter || result.appealLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadLetter = () => {
    if (!result) return;
    const blob = new Blob([editedLetter || result.appealLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appeal-letter-${result.claimNumber || "draft"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-card-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-accent flex items-center justify-center shrink-0">
            <FileWarning className="h-4 w-4 text-accent-ink" aria-hidden="true" />
          </div>
          <span className="font-semibold text-sm tracking-tight">Appeal Copilot</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12">
        {!result && !isLoading && (
          <>
            <div className="mb-10">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.15]">
                Turn a denial letter into a scored appeal.
              </h1>
              <p className="text-muted mt-3 text-[15px] leading-relaxed max-w-xl">
                For patients, caregivers, and clinic billing staff. Paste what your insurer sent you — get back the
                denial reason, the appeal deadline, a drafted first-level appeal letter, and exactly what evidence
                would make it stronger.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label htmlFor="denial-text" className="sr-only">
                  Denial letter or Explanation of Benefits text
                </label>
                <textarea
                  id="denial-text"
                  rows={9}
                  maxLength={MAX_DENIAL_TEXT_CHARS}
                  placeholder="Paste the denial letter or Explanation of Benefits (EOB) text here…"
                  value={denialText}
                  onChange={(e) => setDenialText(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  className="w-full rounded-2xl border border-card-border bg-card px-4 py-3.5 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60 resize-y shadow-sm"
                />
                <div className="flex items-center justify-between mt-1.5 px-0.5">
                  <span className="text-xs text-muted">
                    {denialText.length.toLocaleString()} character{denialText.length === 1 ? "" : "s"}
                    {denialText.length > MAX_DENIAL_TEXT_CHARS * 0.9 && (
                      <> of {MAX_DENIAL_TEXT_CHARS.toLocaleString()} max</>
                    )}
                  </span>
                  <span className="text-xs text-muted hidden sm:inline">⌘ + Enter to analyze</span>
                </div>
              </div>

              {showContext ? (
                <textarea
                  rows={3}
                  maxLength={MAX_ADDITIONAL_CONTEXT_CHARS}
                  aria-label="Additional context (optional)"
                  placeholder="Anything relevant not in the letter — medical history, urgency, prior calls with the insurer…"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  className="w-full rounded-2xl border border-card-border bg-card px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60 resize-y"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowContext(true)}
                  className="self-start text-sm text-muted hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  Add context (optional)
                </button>
              )}

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border px-4 py-3 mt-1"
                  style={{
                    borderColor: "var(--status-critical-border)",
                    background: "var(--status-critical-surface)",
                  }}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: STATUS.critical }} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: STATUS_TEXT.critical }}>
                      {isValidationError ? "Add the denial letter" : "Analysis couldn't be completed"}
                    </p>
                    <p className="text-sm text-muted mt-0.5 leading-relaxed">
                      {isValidationError ? error : "We couldn't process this denial right now. " + error}
                    </p>
                  </div>
                  {!isValidationError && (
                    <button
                      type="submit"
                      className="shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-card-border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      Try again
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="self-start bg-accent hover:opacity-90 text-accent-ink font-medium text-sm py-2.5 px-5 rounded-xl transition-opacity flex items-center gap-2 cursor-pointer mt-1"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Analyze denial
              </button>
            </form>

            <div className="mt-14">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">Example cases</h2>
              <div className="border-t border-card-border">
                {exampleScenarios.map((s) => {
                  const meta = EXAMPLE_META[s.id];
                  const Icon = meta?.icon ?? Stethoscope;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => loadExample(s.id)}
                      className="w-full text-left flex items-start gap-3 py-3.5 px-1 -mx-1 rounded-md border-b border-card-border hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <Icon className="h-4 w-4 text-accent mt-0.5 shrink-0" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="text-sm font-medium block">{s.label}</span>
                        <span className="text-xs text-muted leading-relaxed">{meta?.blurb}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center text-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-accent mb-8" aria-hidden="true" />
            <div className="flex flex-col gap-2.5 max-w-xs w-full">
              {LOADING_STEPS.map((msg, i) => (
                <div
                  key={msg}
                  className={`flex items-center gap-2.5 text-sm text-left transition-colors ${
                    i === loadingStep ? "text-foreground font-medium" : i < loadingStep ? "text-muted" : "text-muted/40"
                  }`}
                >
                  {i < loadingStep ? (
                    <Check className="h-4 w-4 shrink-0" style={{ color: STATUS.good }} aria-hidden="true" />
                  ) : i === loadingStep ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" aria-hidden="true" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current ml-1.5 mr-1" />
                  )}
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result && !isLoading && (
          <div className="flex flex-col gap-6">
            <button
              type="button"
              onClick={startOver}
              className="self-start text-sm text-muted hover:text-foreground flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              New analysis
            </button>

            {demoMode && (
              <div className="flex items-start gap-2 text-xs rounded-xl border border-accent/25 bg-accent/[0.06] px-3.5 py-2.5 text-accent">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Demo mode — no Lamatic credentials configured, so this is representative mocked output. Add the four
                  env vars in <code>.env.local</code> to run the real flow.
                </span>
              </div>
            )}

            {/* Verdict header */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="text-lg font-semibold">{CATEGORY_LABEL[result.denialCategory]} denial</span>
              {result.claimNumber && <span className="text-sm text-muted">· Claim #{result.claimNumber}</span>}
            </div>

            {/* Gauge + deadline + rationale row */}
            <div className="rounded-2xl border border-card-border bg-card p-5 flex flex-col sm:flex-row gap-5 items-start">
              <StrengthGauge
                score={result.strengthScore}
                color={strengthBand(result.strengthScore).color}
                textColor={strengthBand(result.strengthScore).textColor}
              />
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                <div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: strengthBand(result.strengthScore).textColor }}
                  >
                    {strengthBand(result.strengthScore).label}
                  </span>
                  <p className="text-sm text-muted mt-1 leading-relaxed">{result.rationale}</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm pt-1 border-t border-card-border">
                  {(() => {
                    const cfg = URGENCY_CONFIG[result.urgencyLevel] ?? URGENCY_CONFIG.unknown;
                    const Icon = cfg.icon;
                    return (
                      <>
                        <Icon className="h-4 w-4 shrink-0 mt-2" style={{ color: cfg.color }} aria-hidden="true" />
                        <span className="mt-2">
                          <strong className="font-medium">Deadline: </strong>
                          {result.daysRemaining !== null
                            ? result.daysRemaining >= 0
                              ? `${result.daysRemaining} days left`
                              : `${Math.abs(result.daysRemaining)} days overdue`
                            : "Unknown"}
                          <span className="text-muted"> — {cfg.label}</span>
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Missing evidence */}
            {result.missingEvidence?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2.5">
                  What would strengthen this appeal
                </h3>
                <ul className="flex flex-col gap-2">
                  {result.missingEvidence.map((item) => (
                    <li key={item} className="text-sm flex items-start gap-2.5">
                      <span
                        className="h-4 w-4 rounded-full border-2 shrink-0 mt-0.5"
                        style={{ borderColor: STATUS.warning }}
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* The letter, as a document */}
            <div className="rounded-2xl border border-card-border bg-card overflow-hidden shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-5 py-3 border-b border-card-border bg-black/[0.015] dark:bg-white/[0.02]">
                <h3 className="text-sm font-semibold">Draft appeal letter</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={copyLetter}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-card-border hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="h-3 w-3" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={downloadLetter}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-card-border hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="h-3 w-3" aria-hidden="true" />
                    Download
                  </button>
                  <button
                    onClick={() => performAnalysis()}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-card-border hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    Regenerate
                  </button>
                  <button
                    onClick={() => setIsEditingLetter((v) => !v)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-card-border hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {isEditingLetter ? <Check className="h-3 w-3" aria-hidden="true" /> : <Pencil className="h-3 w-3" aria-hidden="true" />}
                    {isEditingLetter ? "Done" : "Edit"}
                  </button>
                </div>
              </div>
              {isEditingLetter ? (
                <textarea
                  value={editedLetter}
                  onChange={(e) => setEditedLetter(e.target.value)}
                  aria-label="Edit draft appeal letter"
                  className="w-full whitespace-pre-wrap text-[15px] leading-[1.75] p-6 sm:p-8 font-serif resize-y focus:outline-none min-h-[24rem]"
                />
              ) : (
                <pre className="whitespace-pre-wrap text-[15px] leading-[1.75] p-6 sm:p-8 font-serif">{editedLetter || result.appealLetter}</pre>
              )}
            </div>

            <p className="text-xs text-muted flex items-start gap-1.5 px-1">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              This is not medical or legal advice. Review the draft with your provider or a patient advocate before
              submitting, and fill in every placeholder field.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-card-border py-6 text-center text-xs text-muted">
        Built on Lamatic.ai — Appeal Copilot is an AgentKit contribution.
      </footer>
    </div>
  );
}
