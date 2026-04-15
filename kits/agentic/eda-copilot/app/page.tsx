"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import { computeDatasetSummary, DatasetSummary } from "@/lib/utils";
import FileUpload from "@/components/FileUpload";
import DataPreview from "@/components/DataPreview";
import AnalysisProgress from "@/components/AnalysisProgress";
import AnalysisResults from "@/components/AnalysisResults";
import { Github, BookOpen, BarChart2 } from "lucide-react";

type AnalysisStep = "idle" | "parsing" | "schema" | "statistical" | "mlReadiness" | "done" | "error";

export interface AnalysisState {
  step: AnalysisStep;
  fileName: string;
  datasetSummary: DatasetSummary | null;
  schemaResult: unknown;
  statisticalResult: unknown;
  mlResult: unknown;
  error: string | null;
}

const EXAMPLE_QUERIES = [
  "Titanic passenger data — survival patterns",
  "Housing prices — market trends",
  "Customer churn — behavioral signals",
];

export default function Home() {
  const [state, setState] = useState<AnalysisState>({
    step: "idle",
    fileName: "",
    datasetSummary: null,
    schemaResult: null,
    statisticalResult: null,
    mlResult: null,
    error: null,
  });

  const runAnalysis = useCallback(async (summary: DatasetSummary, fileName: string) => {
    // ── Step 1: Schema Analysis ─────────────────────────────────────────
    setState((s) => ({ ...s, step: "schema" }));
    let schemaResult: unknown;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetSummary: summary, fileName, step: "schema" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      schemaResult = data.result;
    } catch (e) {
      setState((s) => ({ ...s, step: "error", error: String(e) }));
      return;
    }

    // ── Step 2: Statistical Insights ────────────────────────────────────
    setState((s) => ({ ...s, step: "statistical", schemaResult }));
    let statisticalResult: unknown;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetSummary: summary,
          schemaInsights: schemaResult,
          step: "statistical",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      statisticalResult = data.result;
    } catch (e) {
      setState((s) => ({ ...s, step: "error", error: String(e) }));
      return;
    }

    // ── Step 3: ML Readiness ────────────────────────────────────────────
    setState((s) => ({ ...s, step: "mlReadiness", statisticalResult }));
    let mlResult: unknown;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetSummary: summary,
          schemaInsights: schemaResult,
          statisticalInsights: statisticalResult,
          step: "mlReadiness",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      mlResult = data.result;
    } catch (e) {
      setState((s) => ({ ...s, step: "error", error: String(e) }));
      return;
    }

    setState((s) => ({
      ...s,
      step: "done",
      mlResult,
    }));
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      setState({
        step: "parsing",
        fileName: file.name,
        datasetSummary: null,
        schemaResult: null,
        statisticalResult: null,
        mlResult: null,
        error: null,
      });

      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const summary = computeDatasetSummary(results.data);
          setState((s) => ({ ...s, datasetSummary: summary }));
          runAnalysis(summary, file.name);
        },
        error: (err) => {
          setState((s) => ({
            ...s,
            step: "error",
            error: `CSV parse error: ${err.message}`,
          }));
        },
      });
    },
    [runAnalysis]
  );

  const reset = () =>
    setState({
      step: "idle",
      fileName: "",
      datasetSummary: null,
      schemaResult: null,
      statisticalResult: null,
      mlResult: null,
      error: null,
    });

  const isProcessing = ["parsing", "schema", "statistical", "mlReadiness"].includes(state.step);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">EDA Copilot</span>
              <span className="ml-2 text-xs text-slate-400 hidden sm:inline">
                powered by Lamatic.ai
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm text-slate-400">
            <a
              href="https://lamatic.ai/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Docs</span>
            </a>
            <a
              href="https://github.com/Lamatic/AgentKit/tree/main/kits/agentic/eda-copilot"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {/* Hero — shown only when idle */}
        {state.step === "idle" && (
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5 text-sky-400 text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              AI-Powered Data Analysis
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
              Understand your data
              <br />
              <span className="bg-gradient-to-r from-sky-400 to-violet-500 bg-clip-text text-transparent">
                in seconds
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-4">
              Drop any CSV file. EDA Copilot runs schema analysis, statistical profiling,
              correlation detection, outlier flagging, and ML readiness — all powered by Lamatic.ai flows.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {EXAMPLE_QUERIES.map((q) => (
                <span
                  key={q}
                  className="text-xs bg-slate-800 text-slate-300 border border-slate-700 rounded-full px-3 py-1"
                >
                  {q}
                </span>
              ))}
            </div>
            <FileUpload onFile={handleFile} />
          </div>
        )}

        {/* Data preview while parsing */}
        {state.step === "parsing" && (
          <div className="text-center py-20 text-slate-400 animate-pulse">
            <BarChart2 className="w-10 h-10 mx-auto mb-4 text-sky-400" />
            Parsing {state.fileName}…
          </div>
        )}

        {/* Progress + live preview */}
        {isProcessing && state.step !== "parsing" && state.datasetSummary && (
          <div className="space-y-6 animate-slide-up">
            <DataPreview summary={state.datasetSummary} fileName={state.fileName} />
            <AnalysisProgress step={state.step} />
          </div>
        )}

        {/* Error state */}
        {state.step === "error" && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-400 font-medium mb-2">Analysis failed</p>
            <p className="text-slate-400 text-sm mb-4">{state.error}</p>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Full results */}
        {state.step === "done" && state.datasetSummary && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{state.fileName}</h2>
                <p className="text-slate-400 text-sm">
                  {state.datasetSummary.rowCount.toLocaleString()} rows ·{" "}
                  {state.datasetSummary.colCount} columns
                </p>
              </div>
              <button
                onClick={reset}
                className="px-4 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              >
                Analyze another file
              </button>
            </div>
            <AnalysisResults
              summary={state.datasetSummary}
              schemaResult={state.schemaResult}
              statisticalResult={state.statisticalResult}
              mlResult={state.mlResult}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-4 text-center text-slate-600 text-xs">
        Built with{" "}
        <a
          href="https://lamatic.ai"
          className="text-sky-500 hover:text-sky-400 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Lamatic.ai
        </a>{" "}
        AgentKit ·{" "}
        <a
          href="https://github.com/Lamatic/AgentKit"
          className="text-sky-500 hover:text-sky-400 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Source
        </a>
      </footer>
    </div>
  );
}
