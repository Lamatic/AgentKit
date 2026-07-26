"use client";

import { useState } from "react";
import { analyzePrompt } from "@/actions/orchestrate";
import PromptAnalysisForm from "@/components/PromptAnalysisForm";
import AnalysisResult from "@/components/AnalysisResult";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { PromptAnalysisOutput } from "@/types";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PromptAnalysisOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(prompt: string) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzePrompt({ prompt });

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || "Analysis failed.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setLoading(false);
    setResult(null);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <header className="mb-12 text-center">
          <div className="mb-4 text-6xl">🛡️</div>

          <h1 className="text-5xl font-bold text-slate-900">
            PromptShield AI
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Detect prompt injection, jailbreak attempts, system prompt
            extraction, role override and other prompt attacks using Lamatic AI.
          </p>
        </header>

        {!loading && !result && !error && (
          <PromptAnalysisForm onSubmit={handleAnalyze} />
        )}

        {loading && <LoadingSpinner />}

        {error && (
          <ErrorMessage
            message={error}
            onRetry={handleReset}
          />
        )}

        {result && !loading && (
          <>
            <AnalysisResult data={result} />

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleReset}
                className="rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-800"
              >
                Analyze Another Prompt
              </button>
            </div>
          </>
        )}

        <footer className="mt-20 border-t pt-8 text-center text-sm text-slate-500">
          Powered by Lamatic • PromptShield AI
        </footer>
      </div>
    </main>
  );
}