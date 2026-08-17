"use client";

import { useState } from "react";
import { runComparison, type OrchestrateResult } from "../actions/orchestrate.ts";
import { LIMITS } from "../lib/validation.ts";
import { CUAD_SAMPLE } from "../lib/fixtures/cuad-sample.ts";
import type { Comparison } from "../lib/evidence/core.ts";
import { CaseEditor, type DraftCase } from "../components/CaseEditor.tsx";
import { ErrorPanel } from "../components/ErrorPanel.tsx";
import { ModeNotice } from "../components/ModeNotice.tsx";
import { VerdictBanner } from "../components/VerdictBanner.tsx";
import { StrategySummaryCard } from "../components/StrategySummaryCard.tsx";
import { CaseResultsTable } from "../components/CaseResultsTable.tsx";
import { BoundaryInspector } from "../components/BoundaryInspector.tsx";

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-blue-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

function newExperimentId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyCase(n: number): DraftCase {
  return { id: `case-${n}`, question: "", required: true, evidence: [{ quote: "" }] };
}

type EngineErrorState = { title: string; messages: string[] };

const NO_ENGINE_ERRORS: EngineErrorState = { title: "", messages: [] };

export default function Home() {
  const [documentId, setDocumentId] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [cases, setCases] = useState<DraftCase[]>([emptyCase(1)]);
  const [topK, setTopK] = useState(5);

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [engineErrors, setEngineErrors] = useState<EngineErrorState>(NO_ENGINE_ERRORS);
  const [upstreamError, setUpstreamError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [mode, setMode] = useState<"local" | "deployed" | null>(null);

  function resetResults() {
    setValidationErrors([]);
    setEngineErrors(NO_ENGINE_ERRORS);
    setUpstreamError(null);
    setComparison(null);
    setMode(null);
  }

  function loadDemo() {
    setDocumentId(CUAD_SAMPLE.documentId);
    setDocumentText(CUAD_SAMPLE.documentText);
    setTopK(CUAD_SAMPLE.topK);
    setCases(
      CUAD_SAMPLE.cases.map((c) => ({
        id: c.id,
        question: c.question,
        required: true,
        evidence: c.evidence.map((e) => ({ quote: e.quote })),
      }))
    );
    resetResults();
  }

  async function handleRun() {
    setLoading(true);
    resetResults();

    try {
      const result: OrchestrateResult = await runComparison({
        experimentId: newExperimentId(),
        documentId,
        documentText,
        topK,
        cases: cases.map((c) => ({
          id: c.id,
          question: c.question,
          required: c.required,
          evidence: c.evidence
            .filter((e) => e.quote.trim().length > 0)
            .map((e) => ({ quote: e.quote })),
        })),
      });

      if (!result.ok && result.kind === "validation") {
        setValidationErrors(result.errors);
        return;
      }
      if (!result.ok && result.kind === "engine") {
        const isAlignment = result.issues.every((i) => i.code === "alignment_error");
        setEngineErrors({
          title: isAlignment ? "Alignment error" : "Evidence could not be resolved",
          messages: result.issues.map((i) => i.message),
        });
        return;
      }
      if (!result.ok && result.kind === "upstream") {
        setUpstreamError(result.message);
        return;
      }
      if (result.ok) {
        setComparison(result.comparison);
        setMode(result.mode);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            EvidenceFit
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Compares fixed-width and clause-aware chunking against labelled evidence spans and
            issues a deterministic SHIP / TUNE / BLOCK verdict about whether a RAG retrieval
            config can return complete evidence. This is not an LLM evaluator: every metric and
            the verdict are computed by plain code, never judged by a model.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadDemo}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Load CUAD demo experiment
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            One-click sample contract and acceptance cases, sized so the baseline configuration
            severs required evidence.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="document-id"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Document ID
            </label>
            <input
              id="document-id"
              type="text"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              maxLength={LIMITS.maxIdChars}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="top-k"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              topK (chunks considered per question)
            </label>
            <input
              id="top-k"
              type="number"
              min={1}
              max={LIMITS.maxTopK}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="document-text"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Document text
          </label>
          <textarea
            id="document-text"
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            rows={10}
            maxLength={LIMITS.maxDocumentChars}
            className={inputClass}
          />
        </div>

        <CaseEditor cases={cases} onChange={setCases} />

        <ErrorPanel title="Fix these problems before running" messages={validationErrors} />
        <ErrorPanel title={engineErrors.title} messages={engineErrors.messages} />
        <ErrorPanel title="Deployed run failed" messages={upstreamError ? [upstreamError] : []} />

        <div>
          <button
            type="button"
            onClick={handleRun}
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
          >
            {loading ? "Comparing…" : "Compare strategies"}
          </button>
        </div>

        {comparison && mode && (
          <div className="space-y-6">
            <ModeNotice mode={mode} />
            <VerdictBanner comparison={comparison} />

            <div className="flex flex-wrap gap-4">
              <StrategySummaryCard result={comparison.baseline} />
              <StrategySummaryCard result={comparison.candidate} />
            </div>

            <CaseResultsTable baseline={comparison.baseline} candidate={comparison.candidate} />

            <BoundaryInspector
              documentText={documentText}
              strategy="fixed-width"
              chunks={comparison.baseline.chunks}
              cases={comparison.baseline.cases}
            />
            <BoundaryInspector
              documentText={documentText}
              strategy="clause-aware"
              chunks={comparison.candidate.chunks}
              cases={comparison.candidate.cases}
            />
          </div>
        )}
      </main>
    </div>
  );
}
