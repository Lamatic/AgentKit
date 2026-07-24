"use client";

import { useRef, useState } from "react";
import {
  ShieldCheck,
  TriangleAlert,
  SearchX,
  Loader2,
  FileText,
  FileUp,
  Quote,
  ChevronDown,
  Sparkles,
  FlaskConical,
} from "lucide-react";
import { runPipeline, type FieldVerdict, type PipelineResult } from "@/actions/orchestrate";
import { MAX_DOCUMENT_CHARACTERS, type VerificationValue } from "@/lib/pipeline";

const SAMPLE_INVOICE = `INVOICE  #A-2231

From:      Brightline Studios
Bill To:   Acme Co.

Description                         Amount
-------------------------------------------
Brand identity design               $900.00
Landing page mockups                $340.00
-------------------------------------------
Total Due:                        $1,240.00

Due Date:  03/18/2026
Terms:     Net 30. A late fee of 1.5% per month applies to any balance
           unpaid after the due date.

Remit to account ending 4471. Questions? billing@brightline.studio`;

const SAMPLE_FINANCIAL = `STATEMENT OF ACCOUNT — Q1 2026

Account Holder: Rowan Freelance LLC
Statement Period: Jan 1 – Mar 31, 2026

Opening balance ............................ $2,100.00
Payments received .......................... ($3,450.00)
New charges ................................ $1,875.00
Closing balance ............................ $525.00

Minimum payment due: $75.00
Payment due by: April 15, 2026
Interest rate (APR): 19.99% on unpaid balances.

Note: A "paperless credit" of $10 is applied to accounts on autopay.
Ref: STMT-2026-Q1-0098`;

type Tone = "verified" | "review" | "notfound";

const fieldLabel = (f: string) => (f || "field").replace(/_/g, " ");
const pct = (c: number) => `${Math.round((typeof c === "number" ? c : 0) * 100)}%`;
const displayValue = (value: VerificationValue) => {
  if (value === null) return "—";
  return Array.isArray(value) ? value.join(" · ") : String(value);
};

export default function Home() {
  const [documentText, setDocumentText] = useState("");
  const [simulateError, setSimulateError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadSample(sample: string) {
    setDocumentText(sample);
    setResult(null);
    setShowJson(false);
    setPdfNotice(null);
  }

  async function handlePdfFile(file: File | null | undefined) {
    if (!file) return;
    setPdfNotice(null);
    setResult(null);
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setPdfNotice("Please choose a .pdf file.");
      return;
    }
    setUploadingPdf(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/parse-pdf", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setPdfNotice(data.error || "Could not parse the PDF.");
        return;
      }
      setDocumentText(data.text || "");
      const pages = data.pageCount ? ` · ${data.pageCount} page${data.pageCount === 1 ? "" : "s"}` : "";
      setPdfNotice(`Extracted text from ${file.name}${pages}. Review it below, then Extract & Verify.`);
    } catch {
      setPdfNotice("Upload failed. Check your connection and try again.");
    } finally {
      setUploadingPdf(false);
    }
  }

  async function handleAnalyze() {
    setLoading(true);
    setResult(null);
    try {
      const res = await runPipeline(documentText, { simulateError });
      setResult(res);
    } catch (e) {
      setResult({ success: false, error: e instanceof Error ? e.message : "Unexpected error." });
    } finally {
      setLoading(false);
    }
  }

  const verified = result?.verified ?? [];
  const needsReview = result?.needsReview ?? [];
  const notFound = result?.notFound ?? [];

  return (
    <main className="min-h-screen px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text-muted)]">
            <ShieldCheck size={14} className="text-[var(--verified)]" />
            Lamatic AgentKit
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Self-Verifying Document Extractor
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--text-muted)]">
            It extracts key details, challenges them in a separate Lamatic flow, then enforces every
            claimed quote against the source in deterministic code. Anything that fails either check
            is flagged instead of guessed.
          </p>
        </header>

        {/* Input */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <label htmlFor="document-input" className="flex items-center gap-2 text-sm font-medium">
              <FileText size={16} className="text-[var(--accent)]" /> Document text
            </label>
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadSample(SAMPLE_INVOICE)}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--text)] transition hover:border-[var(--accent)]"
              >
                Load sample invoice
              </button>
              <button
                type="button"
                onClick={() => loadSample(SAMPLE_FINANCIAL)}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--text)] transition hover:border-[var(--accent)]"
              >
                Load financial statement
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPdf}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--text)] transition hover:border-[var(--accent)] disabled:opacity-50"
              >
                {uploadingPdf ? <Loader2 size={13} className="animate-spin" /> : <FileUp size={13} />}
                {uploadingPdf ? "Extracting…" : "Upload PDF"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  handlePdfFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <textarea
            id="document-input"
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handlePdfFile(e.dataTransfer.files?.[0]);
            }}
            placeholder="Paste an invoice, bill, receipt, or short contract here — or drop a text-based PDF to extract it…"
            rows={12}
            maxLength={MAX_DOCUMENT_CHARACTERS}
            className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 font-mono text-sm leading-relaxed text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />

          {pdfNotice && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-[var(--text-muted)]">
              <FileUp size={12} className="mt-0.5 shrink-0 text-[var(--accent)]" />
              {pdfNotice}
            </p>
          )}

          {/* Simulate extraction error toggle */}
          <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <input
              type="checkbox"
              checked={simulateError}
              onChange={(e) => setSimulateError(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--review)]"
            />
            <span className="text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5 font-medium text-[var(--text)]">
                <FlaskConical size={13} className="text-[var(--review)]" /> Simulate an extraction error
              </span>
              Deliberately corrupts one extracted value (a single-digit misread) before verification,
              so you can watch the verifier catch it and route it to review. Nothing pretends the model
              erred — the exact change is shown below.
            </span>
          </label>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-[var(--text-muted)]">
              <p>Every green result must pass both the model review and an exact code-level evidence check.</p>
              <p className="mt-1">
                {documentText.length.toLocaleString()} / {MAX_DOCUMENT_CHARACTERS.toLocaleString()} characters
              </p>
            </div>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading || !documentText.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {loading ? "Verifying…" : "Extract & Verify"}
            </button>
          </div>
        </section>

        {/* Error */}
        {result && !result.success && (
          <div
            className="mt-6 rounded-lg border border-[var(--review)] bg-[var(--review-bg)] p-4 text-sm text-[var(--text)]"
            role="alert"
          >
            <strong className="text-[var(--review)]">Something went wrong</strong>
            {result.failedStep ? ` during ${result.failedStep}` : ""}: {result.error}
          </div>
        )}

        {/* Simulated-error banner */}
        {result?.success && result.simulatedError && (
          <div className="mt-6 rounded-lg border border-[var(--review)] bg-[var(--review-bg)] p-4 text-sm text-[var(--text)]">
            <div className="flex items-center gap-2 font-medium text-[var(--review)]">
              <FlaskConical size={15} /> Simulated extraction error
            </div>
            <p className="mt-1 text-[var(--text-muted)]">
              <span className="font-medium text-[var(--text)]">{fieldLabel(result.simulatedError.field)}</span>{" "}
              was changed from &ldquo;{result.simulatedError.original}&rdquo; to{" "}
              &ldquo;{result.simulatedError.corrupted}&rdquo; before verification. It should appear under{" "}
              <span className="font-medium text-[var(--review)]">Needs your review</span> below.
            </p>
          </div>
        )}
        {result?.success && simulateError && !result.simulatedError && (
          <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)]">
            No corruptible numeric field was found in this document, so no error could be simulated.
          </div>
        )}

        {/* Results */}
        {result?.success && (
          <>
            <div
              className="mt-8 mb-4 flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]"
              aria-live="polite"
            >
              <span>
                {result.summary?.total ?? 0} fields checked ·{" "}
                <span className="text-[var(--verified)]">{verified.length} verified</span> ·{" "}
                <span className="text-[var(--review)]">{needsReview.length} need review</span> ·{" "}
                <span>{notFound.length} not found</span>
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Verified column */}
              <ResultColumn
                icon={<ShieldCheck size={18} className="text-[var(--verified)]" />}
                title="Verified"
                items={verified}
                tone="verified"
                emptyText="Nothing could be confidently verified against the source."
              />
              {/* Needs review column */}
              <ResultColumn
                icon={<TriangleAlert size={18} className="text-[var(--review)]" />}
                title="Needs your review"
                items={needsReview}
                tone="review"
                emptyText="Every extracted field was confirmed."
              />
              {/* Not found column */}
              <ResultColumn
                icon={<SearchX size={18} className="text-[var(--text-muted)]" />}
                title="Not found"
                items={notFound}
                tone="notfound"
                emptyText="Every expected field was present in the document."
              />
            </div>

            {/* Raw JSON */}
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <button
                type="button"
                onClick={() => setShowJson((s) => !s)}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm text-[var(--text-muted)]"
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform ${showJson ? "rotate-180" : ""}`}
                />
                Structured JSON output
              </button>
              {showJson && (
                <pre className="overflow-x-auto border-t border-[var(--border)] p-4 text-xs leading-relaxed text-[var(--text-muted)]">
                  {JSON.stringify(
                    {
                      extraction: result.extraction,
                      verified: result.verified,
                      needs_review: result.needsReview,
                      not_found: result.notFound,
                      summary: result.summary,
                      simulated_error: result.simulatedError ?? null,
                    },
                    null,
                    2
                  )}
                </pre>
              )}
            </div>
          </>
        )}

        <footer className="mt-12 border-t border-[var(--border)] pt-6 text-center text-xs text-[var(--text-muted)]">
          Built on{" "}
          <a href="https://lamatic.ai" className="text-[var(--accent)] hover:underline">
            Lamatic
          </a>{" "}
          · extract → verify → report
        </footer>
      </div>
    </main>
  );
}

function ResultColumn({
  icon,
  title,
  items,
  tone,
  emptyText,
}: {
  icon: React.ReactNode;
  title: string;
  items: FieldVerdict[];
  tone: Tone;
  emptyText: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="font-semibold">
          {title} ({items.length})
        </h2>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((v) => (
            <VerdictCard key={v.field} v={v} tone={tone} />
          ))}
        </ul>
      )}
    </div>
  );
}

function VerdictCard({ v, tone }: { v: FieldVerdict; tone: Tone }) {
  const isVerified = tone === "verified";
  const isNotFound = tone === "notfound";
  const accent = isVerified
    ? "var(--verified)"
    : isNotFound
      ? "var(--text-muted)"
      : "var(--review)";
  const background = isVerified
    ? "var(--verified-bg)"
    : isNotFound
      ? "transparent"
      : "var(--review-bg)";
  const verdict = (v.verdict || "").toLowerCase();
  const badge = isVerified ? "evidence checked" : isNotFound ? "not found" : verdict || "flagged";

  return (
    <li className="rounded-lg border p-3" style={{ borderColor: accent, background }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[var(--text-muted)]">
            {fieldLabel(v.field)}
            {v.simulated ? (
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-medium normal-case"
                style={{ color: "var(--review)", background: "var(--surface-2)" }}
              >
                simulated
              </span>
            ) : null}
          </div>
          <div className="text-sm font-medium">{displayValue(v.value)}</div>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ color: accent, background: "var(--surface-2)" }}
        >
          {badge}
          {isNotFound ? "" : ` · ${pct(v.confidence)}`}
        </span>
      </div>

      {isVerified && v.source_quote ? (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-[var(--text-muted)]">
          <Quote size={12} className="mt-0.5 shrink-0" />
          <span className="italic">
            Exact evidence{v.source_page ? ` (p.${v.source_page})` : ""}: &ldquo;{v.source_quote}&rdquo;
          </span>
        </div>
      ) : null}

      {!isVerified && v.reason ? (
        <p className="mt-2 text-xs text-[var(--text-muted)]">{v.reason}</p>
      ) : null}
    </li>
  );
}
