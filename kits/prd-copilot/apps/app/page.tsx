"use client"

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { 
  Sparkles, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Copy, 
  Download, 
  RefreshCw, 
  HelpCircle, 
  ArrowLeft,
  ChevronRight
} from "lucide-react";
import { orchestratePRD } from "../actions/orchestrate";
import MermaidDiagram from "../components/MermaidDiagram";

type Step = "input" | "questions" | "result";

export default function PRDCopilotPage() {
  const [step, setStep] = useState<Step>("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [idea, setIdea] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  
  // Response State
  const [draftPrd, setDraftPrd] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [finalPrd, setFinalPrd] = useState("");
  const [mermaidCode, setMermaidCode] = useState("");

  const [activeTab, setActiveTab] = useState<"prd" | "flowchart">("prd");
  const [copied, setCopied] = useState(false);

  // Step 1: Trigger Draft Generation
  const handleGenerateDraft = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setError(null);

    const response = await orchestratePRD("draft", idea);

    if (response.success) {
      setDraftPrd(response.prd || "");
      setQuestions(response.questions || []);
      // Initialize empty answers array matching the number of questions
      setAnswers(new Array(response.questions?.length || 0).fill(""));
      setStep("questions");
    } else {
      setError(response.error || "Failed to generate PRD draft.");
    }
    setLoading(false);
  };

  // Step 2: Trigger Refinement
  const handleFinalizePRD = async () => {
    setLoading(true);
    setError(null);

    // Format the questions and answers into a clear prompt block for the LLM
    const answersBlock = questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || "N/A"}`).join("\n\n");
    const response = await orchestratePRD("refine", draftPrd, answersBlock);

    if (response.success) {
      setFinalPrd(response.prd || "");
      setMermaidCode(response.mermaid || "");
      setStep("result");
      setActiveTab("prd");
    } else {
      setError(response.error || "Failed to finalize PRD.");
    }
    setLoading(false);
  };

  const handleAnswerChange = (index: number, val: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = val;
    setAnswers(newAnswers);
  };

  const handleCopyPRD = () => {
    const textToCopy = step === "result" ? finalPrd : draftPrd;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPRD = () => {
    const textToDownload = step === "result" ? finalPrd : draftPrd;
    const blob = new Blob([textToDownload], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PRD_Specification.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestart = () => {
    setStep("input");
    setIdea("");
    setAnswers([]);
    setDraftPrd("");
    setQuestions([]);
    setFinalPrd("");
    setMermaidCode("");
    setError(null);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600/30 selection:text-blue-200">
      {/* Background Gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-900/10 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 h-[500px] w-[500px] rounded-full bg-indigo-900/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                PRD Copilot
              </span>
              <span className="ml-2 rounded-full border border-blue-500/20 bg-blue-950/40 px-2 py-0.5 text-xs text-blue-400">
                AgentKit
              </span>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Design & specs in minutes
          </div>
        </div>
      </header>

      {/* Main Container */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        {error && (
          <div className="mb-8 rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-sm text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step 1: Input Product Idea */}
        {step === "input" && (
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-500 bg-clip-text text-transparent">
              Turn your raw ideas into <br />
              comprehensive PRDs & Flowcharts
            </h1>
            <p className="mt-4 text-base text-slate-400 max-w-xl mx-auto">
              Describe your app, website, or feature idea. The agent will draft a PRD, ask clarifying questions, and compile a finalized visual user flowchart.
            </p>

            <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm shadow-xl">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g. A marketplace app where local bakers can list custom cakes, and users can place orders, chat, and schedule deliveries..."
                className="w-full min-h-[160px] rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-slate-100 placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition font-sans text-sm resize-y"
              />
              
              <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-4">
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <HelpCircle className="h-4 w-4" />
                  <span>Be detailed to get better results.</span>
                </div>
                <button
                  onClick={handleGenerateDraft}
                  disabled={loading || !idea.trim()}
                  className="flex items-center space-x-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:hover:bg-blue-600 transition"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Drafting PRD...</span>
                    </>
                  ) : (
                    <>
                      <span>Draft PRD</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Clarification Questions */}
        {step === "questions" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Left: Draft PRD Preview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm h-[650px] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <h2 className="font-semibold text-lg">Initial PRD Draft</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleCopyPRD}
                    className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                    title="Copy Markdown"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={handleDownloadPRD}
                    className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                    title="Download Markdown"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-sm text-slate-300 leading-relaxed prose prose-invert max-w-none">
                <ReactMarkdown>{draftPrd}</ReactMarkdown>
              </div>
            </div>

            {/* Right: Clarifying Questions */}
            <div className="rounded-2xl border border-blue-500/20 bg-slate-900/40 p-6 backdrop-blur-sm shadow-lg shadow-blue-500/5">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-4 mb-6">
                <HelpCircle className="h-5 w-5 text-blue-500" />
                <h2 className="font-semibold text-lg">Clarification Questions</h2>
              </div>
              
              <p className="text-slate-400 text-sm mb-6">
                The agent has analyzed your product idea and drafted an initial spec. Answer these clarifying questions to finalize details like scope, APIs, and custom flows.
              </p>

              <div className="space-y-6">
                {questions.map((q, index) => (
                  <div key={index} className="space-y-2">
                    <label className="text-sm font-medium text-slate-200 flex items-start space-x-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                      <span>{q}</span>
                    </label>
                    <input
                      type="text"
                      value={answers[index] || ""}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      placeholder="Your answer..."
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-100 placeholder:text-slate-700 focus:border-blue-500/50 focus:outline-none transition"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-800/80 pt-6">
                <button
                  onClick={handleRestart}
                  className="flex items-center space-x-1.5 text-sm text-slate-500 hover:text-slate-300 transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Start over</span>
                </button>
                
                <button
                  onClick={handleFinalizePRD}
                  disabled={loading}
                  className="flex items-center space-x-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 shadow-lg shadow-blue-600/20 disabled:opacity-40 transition"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Finalizing PRD...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Final PRD</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Step 3: Result View */}
        {step === "result" && (
          <div className="space-y-6">
            
            {/* Action Bar / Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">PRD Copilot Output</h2>
                <p className="text-slate-400 text-sm mt-1">Review the final PRD specification and the generated application flowchart.</p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button 
                  onClick={handleRestart}
                  className="flex items-center space-x-1.5 px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded-xl text-sm text-slate-300 transition"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>New Project</span>
                </button>
                <button 
                  onClick={handleCopyPRD}
                  className="flex items-center space-x-1.5 px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded-xl text-sm text-slate-300 transition"
                >
                  <Copy className="h-4 w-4" />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
                <button 
                  onClick={handleDownloadPRD}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm text-white font-medium shadow-lg shadow-blue-600/10 transition"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PRD</span>
                </button>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setActiveTab("prd")}
                className={`px-6 py-3 font-semibold text-sm border-b-2 transition ${
                  activeTab === "prd"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Product Specification (PRD)
              </button>
              {mermaidCode && (
                <button
                  onClick={() => setActiveTab("flowchart")}
                  className={`px-6 py-3 font-semibold text-sm border-b-2 transition ${
                    activeTab === "flowchart"
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  User Flowchart
                </button>
              )}
            </div>

            {/* Content Container */}
            <div className="mt-6">
              {activeTab === "prd" ? (
                <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-8 min-h-[600px] text-sm text-slate-300 leading-relaxed prose prose-invert max-w-none">
                  <ReactMarkdown>{finalPrd}</ReactMarkdown>
                </div>
              ) : (
                <div className="space-y-4">
                  <MermaidDiagram code={mermaidCode} />
                </div>
              )}
            </div>

          </div>
        )}
      </section>
    </main>
  );
}
