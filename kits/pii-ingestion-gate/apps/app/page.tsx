"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ScanSearch,
  EraserIcon,
  Loader2,
  Copy,
  Check,
  FileText,
} from "lucide-react";
import { scanDocument, redactDocument } from "@/actions/orchestrate";

const SAMPLE_DOCUMENT = `Meeting notes — Customer onboarding sync (2026-07-01)

Attendees: John Smith (john.smith@acme.com, +1 415-555-0132), Priya Patel

Action items:
- Rotate the prod API key sk-live-9f8a7b6c5d4e3f2a1b0c before Friday
- Update billing: card on file ends 4242, customer SSN 523-45-6789
- Ship the Q3 roadmap doc (INTERNAL ONLY — do not distribute)
- Approved budget: $250,000 for the data platform migration`;

const SAMPLE_POLICY =
  "Internal names are acceptable. Credentials, government IDs, and payment data are never acceptable.";

type Finding = {
  category: string;
  type: string;
  severity: string;
  masked_value: string;
  context?: string;
  recommendation?: string;
};

type Redaction = {
  placeholder: string;
  category: string;
  type: string;
  masked_original: string;
  reason?: string;
};

const VERDICT_STYLES: Record<
  string,
  { label: string; classes: string; Icon: typeof ShieldCheck }
> = {
  safe: {
    label: "Safe to index",
    classes: "bg-emerald-100 text-emerald-800 border-emerald-300",
    Icon: ShieldCheck,
  },
  needs_redaction: {
    label: "Needs redaction",
    classes: "bg-amber-100 text-amber-800 border-amber-300",
    Icon: ShieldAlert,
  },
  blocked: {
    label: "Blocked",
    classes: "bg-red-100 text-red-800 border-red-300",
    Icon: ShieldX,
  },
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-700",
};

/** Badge showing the scan verdict with a matching icon and color. */
function VerdictBadge({ verdict }: { verdict: string }) {
  const style = VERDICT_STYLES[verdict] ?? VERDICT_STYLES.needs_redaction;
  const Icon = style.Icon;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${style.classes}`}
    >
      <Icon className="h-4 w-4" />
      {style.label}
    </span>
  );
}

/** Small colored chip for a finding severity. */
function SeverityChip({ severity }: { severity: string }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase ${SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.low}`}
    >
      {severity}
    </span>
  );
}

export default function Home() {
  const [tab, setTab] = useState<"scan" | "redact">("scan");
  const [document, setDocument] = useState("");
  const [policy, setPolicy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [redactResult, setRedactResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const loadSample = () => {
    setDocument(SAMPLE_DOCUMENT);
    setPolicy(SAMPLE_POLICY);
    setError(null);
  };

  const run = async () => {
    if (!document.trim()) {
      setError("Paste a document first (or load the sample).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (tab === "scan") {
        setScanResult(null);
        const res = await scanDocument(document, policy);
        if (!res.success) throw new Error(res.error);
        setScanResult(res.data);
      } else {
        setRedactResult(null);
        const res = await redactDocument(document, policy);
        if (!res.success) throw new Error(res.error);
        setRedactResult(res.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const copyRedacted = async () => {
    const text = redactResult?.result?.redacted_document;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const analysis = scanResult?.analysis;
  const report = scanResult?.report;
  const result = redactResult?.result;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-900 p-2.5">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              PII Ingestion Gate
            </h1>
            <p className="text-sm text-slate-500">
              Scan &amp; redact documents before they reach your RAG vector
              index.
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1">
        <button
          onClick={() => setTab("scan")}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === "scan"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ScanSearch className="h-4 w-4" /> Scan
        </button>
        <button
          onClick={() => setTab("redact")}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === "redact"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <EraserIcon className="h-4 w-4" /> Redact
        </button>
      </div>

      {/* Input card */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="document-input"
            className="text-sm font-semibold text-slate-700"
          >
            Document
          </label>
          <button
            onClick={loadSample}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <FileText className="h-4 w-4" /> Load sample
          </button>
        </div>
        <textarea
          id="document-input"
          value={document}
          onChange={(e) => setDocument(e.target.value)}
          placeholder="Paste the document you want to check before ingesting it into your vector index…"
          className="h-48 w-full resize-y rounded-lg border border-slate-200 p-3 font-mono text-sm outline-none focus:border-slate-400"
        />
        <label
          htmlFor="policy-input"
          className="mt-3 block text-sm font-semibold text-slate-700"
        >
          Policy <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          id="policy-input"
          value={policy}
          onChange={(e) => setPolicy(e.target.value)}
          placeholder='e.g. "Internal names are acceptable. Credentials are never acceptable."'
          className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"
        />
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={run}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : tab === "scan" ? (
              <ScanSearch className="h-4 w-4" />
            ) : (
              <EraserIcon className="h-4 w-4" />
            )}
            {loading
              ? "Running…"
              : tab === "scan"
                ? "Scan document"
                : "Redact document"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </section>

      {/* Scan results */}
      {tab === "scan" && analysis && (
        <section className="mt-6 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <VerdictBadge verdict={analysis.verdict} />
              <span className="text-sm text-slate-600">
                Risk score:{" "}
                <strong className="text-slate-900">
                  {analysis.risk_score}/100
                </strong>
              </span>
              <span className="text-sm text-slate-600">
                Findings:{" "}
                <strong className="text-slate-900">
                  {analysis.findings?.length ?? 0}
                </strong>
              </span>
            </div>
            {analysis.summary && (
              <p className="mt-3 text-sm text-slate-600">{analysis.summary}</p>
            )}
          </div>

          {analysis.findings?.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Masked value</th>
                    <th className="px-4 py-3">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.findings.map((f: Finding, i: number) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="px-4 py-3">
                        <SeverityChip severity={f.severity} />
                      </td>
                      <td className="px-4 py-3 text-slate-700">{f.category}</td>
                      <td className="px-4 py-3 text-slate-700">{f.type}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        {f.masked_value}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {f.recommendation ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {report && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-slate-700">
                Audit summary
              </h2>
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600">
                {typeof report === "string"
                  ? report
                  : JSON.stringify(report, null, 2)}
              </pre>
            </div>
          )}
        </section>
      )}

      {/* Redact results */}
      {tab === "redact" && result && (
        <section className="mt-6 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <VerdictBadge
                verdict={result.safe_to_index ? "safe" : "needs_redaction"}
              />
              <span className="text-sm text-slate-600">
                Redactions:{" "}
                <strong className="text-slate-900">
                  {result.redactions?.length ?? 0}
                </strong>
              </span>
            </div>
            {result.notes && (
              <p className="mt-3 text-sm text-slate-600">{result.notes}</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                Redacted document (ingestion-safe)
              </h2>
              <button
                onClick={copyRedacted}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-mono text-xs text-slate-800">
              {result.redacted_document}
            </pre>
          </div>

          {result.redactions?.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Placeholder</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Masked original</th>
                    <th className="px-4 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {result.redactions.map((r: Redaction, i: number) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-mono text-xs text-slate-800">
                        {r.placeholder}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{r.category}</td>
                      <td className="px-4 py-3 text-slate-700">{r.type}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        {r.masked_original}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {r.reason ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <footer className="mt-10 text-center text-xs text-slate-400">
        Built on Lamatic flows — this app does not store document content
        locally. Documents are processed by your own Lamatic project; see the{" "}
        <a
          href="https://lamatic.ai/docs"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-slate-600"
        >
          Lamatic docs
        </a>{" "}
        for downstream data handling.
      </footer>
    </main>
  );
}
