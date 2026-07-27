"use client";

import { useState, useRef, useCallback } from "react";
import type { Diagnosis } from "@/lib/types";
import { cn, formatConfidence, riskToBadgeBg } from "@/lib/utils";

// ─── Agent step labels (used for progress stepper) ───────────────────────────
const AGENT_STEPS = [
  "Cleaning log",
  "Extracting evidence",
  "Classifying error",
  "Planning retrieval",
  "Querying knowledge base",
  "Analysing root cause",
  "Generating fix",
  "Verifying fix",
  "Reviewing risk",
  "Formatting report",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass-panel rounded-[24px] p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
      {children}
    </h2>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity=".25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Progress Stepper ────────────────────────────────────────────────────────
function AgentStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex flex-col gap-2">
      {AGENT_STEPS.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={label} className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-500",
                done && "bg-[var(--emerald)] text-black",
                active && "bg-[var(--cyan)] text-black pulse-glow",
                !done && !active && "border border-[var(--border)] text-[var(--muted)]"
              )}
            >
              {done ? "✓" : active ? <Spinner size={14} /> : i + 1}
            </div>
            <span
              className={cn(
                "text-sm transition-colors duration-300",
                done && "text-[var(--text-dim)] line-through",
                active && "font-semibold text-[var(--cyan)]",
                !done && !active && "text-[var(--muted)]"
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Code Block ──────────────────────────────────────────────────────────────
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="group relative overflow-hidden rounded-lg border border-[var(--border)] bg-[#0d0d14]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
        <span className="font-mono text-xs text-[var(--muted)]">{language}</span>
        <button
          onClick={copy}
          className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--cyan)]"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-[var(--text)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Evidence Panel ──────────────────────────────────────────────────────────
function EvidencePanel({ evidence }: { evidence: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <SectionTitle>Evidence ({evidence.length} lines cited)</SectionTitle>
        <span className="text-xs text-[var(--muted)]">{open ? "▲ Hide" : "▼ Show"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {evidence.map((line, i) => (
            <pre
              key={i}
              className="overflow-x-auto rounded-md bg-[#0d0d14] p-3 font-mono text-xs text-rose-300"
            >
              {line}
            </pre>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Result Dashboard ────────────────────────────────────────────────────────
function ResultDashboard({ result }: { result: Diagnosis }) {
  const { classification, analysis, resolution, risk } = result;
  return (
    <div className="animate-fade-in space-y-4">
      {/* Summary strip */}
      <Card className="flex flex-wrap items-center gap-3">
        <Badge className="bg-cyan-900/40 text-cyan-300 border-cyan-700">
          {classification.category}
        </Badge>
        {classification.sub_category && (
          <Badge className="bg-zinc-800 text-zinc-300 border-zinc-600">
            {classification.sub_category}
          </Badge>
        )}
        <Badge className={riskToBadgeBg(risk.level)}>
          ⚠ Risk: {risk.level}
        </Badge>
        <span className="ml-auto text-sm text-[var(--text-dim)]">
          Confidence:{" "}
          <strong className="text-[var(--text)]">
            {formatConfidence(classification.confidence_score)}
          </strong>
        </span>
      </Card>

      {/* Root Cause */}
      <Card>
        <SectionTitle>Root Cause</SectionTitle>
        <p className="font-semibold text-[var(--text)]">{analysis.root_cause_summary}</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">
          {analysis.detailed_explanation}
        </p>
      </Card>

      {/* Evidence */}
      <EvidencePanel evidence={analysis.evidence_cited} />

      {/* Fix snippets */}
      <Card>
        <SectionTitle>
          Suggested Fix{" "}
          {resolution.is_fix_valid ? (
            <span className="text-emerald-400">✓ Verified</span>
          ) : (
            <span className="text-amber-400">⚠ Unverified</span>
          )}
        </SectionTitle>
        <div className="space-y-3">
          {resolution.fixes.map((fix, i) => (
            <div key={i}>
              <p className="mb-1 text-sm text-[var(--text-dim)]">{fix.description}</p>
              <CodeBlock code={fix.code} language={fix.language} />
            </div>
          ))}
        </div>
        {resolution.verification_notes && (
          <p className="mt-3 text-xs text-[var(--text-dim)] italic">
            {resolution.verification_notes}
          </p>
        )}
      </Card>

      {/* Risk warning */}
      {risk.warning && (
        <Card className="border-rose-800/60 bg-rose-950/30">
          <SectionTitle>Security Warning</SectionTitle>
          <p className="text-sm text-rose-300">{risk.warning}</p>
        </Card>
      )}
    </div>
  );
}

// ─── Main Workspace ──────────────────────────────────────────────────────────
export function DiagnosisWorkspace() {
  const [logText, setLogText] = useState("");
  const [ciProvider, setCiProvider] = useState<"github" | "gitlab">("github");
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Simulate step progression while waiting for the Lamatic response
  const simulateSteps = useCallback(() => {
    const delays = [800, 1800, 1200, 1000, 2000, 3500, 3000, 2000, 1500, 500];
    let step = 0;
    const advance = () => {
      step++;
      setCurrentStep(step);
      if (step < AGENT_STEPS.length && delays[step]) {
        setTimeout(advance, delays[step]);
      }
    };
    setTimeout(advance, delays[0]);
  }, []);

  const diagnose = useCallback(async (log: string) => {
    if (!log.trim()) return;
    setStatus("loading");
    setCurrentStep(0);
    setResult(null);
    setErrorMsg("");
    simulateSteps();

    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logContent: log, ciProvider }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Unexpected error from the diagnostic service.");
      }
      setCurrentStep(AGENT_STEPS.length);
      setResult(data as Diagnosis);
      setStatus("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error.";
      setErrorMsg(msg);
      setStatus("error");
    }
  }, [ciProvider, simulateSteps]);

  const handleFile = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File exceeds 5 MB. Paste only the failing section instead.");
      setStatus("error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setLogText(text);
      diagnose(text);
    };
    reader.readAsText(file);
  }, [diagnose]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const reset = () => {
    setStatus("idle");
    setLogText("");
    setResult(null);
    setErrorMsg("");
    setCurrentStep(0);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <header className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-xs text-[var(--text)] shadow-sm backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)] pulse-glow" />
          Powered by Lamatic AgentKit
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text)]">
          CI/CD Diagnosis Agent
        </h1>
        <p className="mt-2 text-[var(--text-dim)]">
          Drop a GitHub Actions or GitLab CI log. Get a verified root cause and fix.
        </p>
      </header>

      {/* Upload area — shown only when idle or error */}
      {(status === "idle" || status === "error") && (
        <div className="animate-fade-in space-y-4">
          {/* Provider selector */}
          <div className="flex gap-2">
            {(["github", "gitlab"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setCiProvider(p)}
                className={cn(
                  "rounded-[14px] border px-5 py-2.5 text-sm font-medium transition-all backdrop-blur-md shadow-sm",
                  ciProvider === p
                    ? "border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)]"
                    : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
                )}
              >
                {p === "github" ? "GitHub Actions" : "GitLab CI"}
              </button>
            ))}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[24px] border border-dashed p-12 transition-all duration-300 glass-panel",
              isDragging
                ? "border-[var(--cyan)] bg-[var(--cyan-dim)]"
                : "border-[var(--border)] hover:bg-[var(--surface)] hover:border-[var(--text-dim)]"
            )}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-[var(--muted)]">
              <path d="M12 16V8m0 0-3 3m3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <p className="text-sm text-[var(--text-dim)]">
              Drop your <strong className="text-[var(--text)]">.log</strong> or{" "}
              <strong className="text-[var(--text)]">.txt</strong> file here, or{" "}
              <span className="text-[var(--cyan)]">click to browse</span>
            </p>
            <p className="text-xs text-[var(--muted)]">Max 5 MB</p>
            <input
              ref={fileRef}
              type="file"
              accept=".log,.txt,text/plain"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          {/* Text area fallback */}
          <div>
            <p className="mb-1.5 text-xs text-[var(--muted)]">Or paste raw log output:</p>
            <textarea
              rows={8}
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              placeholder="Paste your CI/CD log here..."
              className="w-full resize-y rounded-[20px] glass-panel p-4 font-mono text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)] focus:outline-none"
            />
            <button
              disabled={!logText.trim()}
              onClick={() => diagnose(logText)}
              className="apple-button mt-3 w-full rounded-[16px] py-3.5 text-sm font-semibold shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
            >
              Diagnose Log →
            </button>
          </div>

          {/* Error message */}
          {status === "error" && (
            <div className="rounded-lg border border-rose-800/60 bg-rose-950/30 p-4 text-sm text-rose-300">
              <strong>Error:</strong> {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* Loading state with stepper */}
      {status === "loading" && (
        <div className="animate-fade-in">
          <Card className="mb-6">
            <SectionTitle>Running 10-Agent Diagnostic Pipeline</SectionTitle>
            <AgentStepper currentStep={currentStep} />
          </Card>
          <p className="text-center text-xs text-[var(--muted)]">
            Analysing your log with multi-agent RAG orchestration…
          </p>
        </div>
      )}

      {/* Results */}
      {status === "done" && result && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Diagnosis Complete</h2>
            <button
              onClick={reset}
              className="text-xs text-[var(--muted)] underline hover:text-[var(--text)]"
            >
              ← New Diagnosis
            </button>
          </div>
          <ResultDashboard result={result} />
        </div>
      )}
    </div>
  );
}
