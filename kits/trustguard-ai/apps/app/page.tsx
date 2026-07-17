"use client";
// app/page.tsx
// Single-page TrustGuard AI application.
// No routing, no login, no dashboard. One page only.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InputForm from "@/components/InputForm";
import ResultCards from "@/components/ResultCards";
import { runInvestigation } from "@/actions/runInvestigation";
import type { AnalyzeFormData } from "@/types/response";
import type { ValidatedInvestigationResponse } from "@/lib/schemas";

const DEFAULT_FORM: AnalyzeFormData = {
  input_type: "Email",
  content: "",
  attachment_url: "",
  language: "Auto",
  memory_enabled: false,
};

/**
 * Root page component for the TrustGuard AI single-page application.
 *
 * Manages the investigation lifecycle: holds form state, triggers the server
 * action, displays a loading indicator while the pipeline runs, and renders
 * the result cards once a validated response is available.
 *
 * @returns The full-page layout including the header, hero section, input
 *   form, loading animation, result cards, and footer.
 */
export default function HomePage() {
  const [formData, setFormData] = useState<AnalyzeFormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidatedInvestigationResponse | null>(null);

  /**
   * Validates the form, calls the `runInvestigation` server action, and
   * updates UI state based on the result.
   *
   * Shows a loading toast while the request is in-flight and swaps it for
   * a success or error toast depending on the outcome.  Guards against
   * duplicate submissions while a request is already loading.
   */
  const handleAnalyze = async () => {
    if (loading) return;
    if (!formData.content.trim()) {
      toast.error("Please enter content to analyze.");
      return;
    }

    setLoading(true);
    setResult(null);

    const toastId = toast.loading("Running investigation…");

    try {
      const response = await runInvestigation(formData);

      if (response.success) {
        setResult(response.data);
        toast.success("Investigation complete!", { id: toastId });
      } else {
        toast.error(
          response.error || "Unable to analyze. Please try again.",
          { id: toastId }
        );
      }
    } catch {
      toast.error("Unable to analyze. Please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-12">

        {/* Hero */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold text-cyan-400 tracking-wide uppercase">
              Powered by Lamatic AI &amp; Gemini
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            Detect Fraud &amp; Scams
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Instantly with AI
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-base text-slate-400 leading-relaxed">
            Paste any suspicious email, SMS, URL, or document. TrustGuard AI
            investigates it using multi-stage LLM analysis and returns a
            detailed threat assessment in seconds.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          className="flex flex-wrap justify-center gap-6 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {[
            { label: "Analysis Stages", value: "4" },
            { label: "Input Types", value: "5" },
            { label: "Languages", value: "4" },
            { label: "Evidence Types", value: "10" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Input Form */}
        <InputForm
          formData={formData}
          onChange={setFormData}
          onSubmit={handleAnalyze}
          loading={loading}
        />

        {/* Loading pulse */}
        <AnimatePresence>
          {loading && (
            <motion.div
              className="mt-10 flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-2 border-cyan-500/20 animate-ping absolute inset-0" />
                <div className="h-16 w-16 rounded-full border-2 border-transparent border-t-cyan-500 border-r-cyan-500/50 animate-spin relative" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-cyan-400">
                  Analyzing content…
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Running 4-stage AI investigation pipeline
                </p>
              </div>

              {/* Pipeline stages */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {[
                  "Investigation Planner",
                  "Evidence Extractor",
                  "Threat Analyzer",
                  "Decision Engine",
                ].map((stage, idx) => (
                  <motion.span
                    key={stage}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] px-3 py-1 text-xs text-slate-400"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{
                      delay: idx * 0.4,
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    {stage}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Cards */}
        <AnimatePresence>
          {result && !loading && (
            <ResultCards data={result} />
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
