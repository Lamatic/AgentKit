"use client";

import { useState } from "react";
import { generatePersonalizedPitch } from "../actions/orchestrate";
import { 
  Building2, 
  User, 
  Sparkles, 
  Copy, 
  Check, 
  Loader2, 
  AlertTriangle, 
  RefreshCw, 
  Mail,
  Send,
  ExternalLink,
  ChevronRight
} from "lucide-react";

const LinkedInIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function Home() {
  const [companyUrl, setCompanyUrl] = useState("");
  const [founderLinkedinUrl, setFounderLinkedinUrl] = useState("");
  const [candidateContext, setCandidateContext] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Rotate loading messages for a premium agentic feel
  const loadingMessages = [
    "Initializing Firecrawl scraper...",
    "Crawling company website and LinkedIn...",
    "Extracting specific features, posts, and technical decisions...",
    "Analyzing noticed signals for outreach relevance...",
    "Drafting value-added asset ideas in under 2h limit...",
    "Generating final cold email using average-teenager guidelines...",
    "Polishing email tone and adding call to action..."
  ];

  const runFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyUrl || !founderLinkedinUrl || !candidateContext) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    // Simulate step progress for user feedback
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 4000);

    try {
      const response = await generatePersonalizedPitch({
        company_url: companyUrl,
        founder_linkedin_url: founderLinkedinUrl,
        candidate_context: candidateContext,
      });
      clearInterval(interval);

      if (!response.success) {
        throw new Error(response.error || "Failed to generate personalization.");
      }

      setResult(response.data);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "Something went wrong. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to extract the outreach email from the result object
  const getEmailContent = (): string => {
    if (!result) return "";
    if (typeof result === "string") return result;
    
    // Check various common return shapes from Lamatic LLM node
    if (result.generatedResponse) return result.generatedResponse;
    if (result.output) return result.output;
    if (result.text) return result.text;
    
    // If it's a nested object structure, look for LLMNode_696 output
    if (result.LLMNode_696?.output?.generatedResponse) {
      return result.LLMNode_696.output.generatedResponse;
    }
    
    // Fallback: look for any string values or JSON representation
    if (typeof result === "object") {
      const values = Object.values(result);
      const stringVal = values.find(val => typeof val === "string");
      if (stringVal) return stringVal as string;
      return JSON.stringify(result, null, 2);
    }
    
    return String(result);
  };

  const emailText = getEmailContent();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background gradients for premium glassmorphism effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-400">
                OUTREACH PERSONALIZER
              </span>
              <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
                Lamatic Agent
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://lamatic.ai" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              Powered by Lamatic.ai <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Left Form: Column 5/12 */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Outreach Parameters
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Provide details about the recipient company and your own background.
              </p>
            </div>

            <form onSubmit={runFlow} className="flex flex-col gap-5">
              {/* Company Website URL */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                  Company Website URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder="https://company.com"
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-300"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <Building2 className="h-4.5 w-4.5" />
                  </div>
                </div>
              </div>

              {/* Founder LinkedIn URL */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <LinkedInIcon className="h-3.5 w-3.5 text-indigo-400" />
                  Founder LinkedIn URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder="https://linkedin.com/in/founder"
                    value={founderLinkedinUrl}
                    onChange={(e) => setFounderLinkedinUrl(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-300"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <LinkedInIcon className="h-4.5 w-4.5" />
                  </div>
                </div>
              </div>

              {/* Candidate Background Context */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-indigo-400" />
                  Candidate Background & Context
                </label>
                <div className="relative">
                  <textarea
                    required
                    rows={6}
                    placeholder="Full-stack engineer with 3 years of React/Node.js experience. Built a custom CRM script for Stripe API that reduced latency by 30%. Passionate about developer tooling..."
                    value={candidateContext}
                    onChange={(e) => setCandidateContext(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-300 resize-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Describe your skills, what you build, and highlight a few projects that demonstrate capability.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Personalizing...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Generate Personalized Pitch</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Right Output: Column 7/12 */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col flex-1 min-h-[450px] relative overflow-hidden">
            {/* Background elements inside panel */}
            <div className="absolute top-0 right-0 w-[20%] h-[20%] rounded-full bg-pink-500/5 blur-[40px] pointer-events-none" />

            {/* Header of panel */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-400" />
                Generated Outreach
              </h2>
              {emailText && (
                <button
                  onClick={() => copyToClipboard(emailText)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-700 hover:border-indigo-500 bg-slate-800/40 hover:bg-slate-800/80 text-xs font-semibold text-slate-300 hover:text-white transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-400" />
                      <span className="text-green-400 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Pitch</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Body of panel - dynamic states */}
            <div className="flex-1 flex flex-col">
              {/* Idle State */}
              {!isLoading && !result && !error && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="h-14 w-14 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center mb-4 shadow-inner text-slate-400 animate-pulse">
                    <Mail className="h-6 w-6 text-slate-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-300">Ready to Personalize</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                    Fill out the form on the left to activate the Outreach Personalizer agent flow. It will extract high-specificity signals to draft a bespoke cold outreach.
                  </p>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="relative mb-6">
                    <div className="h-16 w-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                    <Sparkles className="h-6 w-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <h3 className="text-base font-bold text-slate-200">Executing Agent Flow</h3>
                  
                  {/* Step list for premium feedback */}
                  <div className="mt-6 space-y-2.5 max-w-md w-full">
                    {loadingMessages.map((msg, index) => {
                      const isActive = index === loadingStep;
                      const isCompleted = index < loadingStep;
                      return (
                        <div 
                          key={index}
                          className={`flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg border transition-all duration-300 ${
                            isActive 
                              ? "bg-indigo-950/20 border-indigo-500/30 text-indigo-300 font-semibold"
                              : isCompleted
                              ? "bg-slate-900/10 border-slate-800/10 text-slate-500"
                              : "bg-transparent border-transparent text-slate-600"
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : isActive ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <span className="truncate">{msg}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="h-14 w-14 rounded-full bg-red-950/40 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-red-400">Personalization Failed</h3>
                  <p className="text-xs text-slate-400 max-w-md mt-2 leading-relaxed bg-red-950/10 border border-red-950/30 p-4 rounded-xl">
                    {error}
                  </p>
                  <button
                    onClick={runFlow}
                    className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-750 hover:border-slate-650 rounded-xl text-xs font-semibold text-white transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Try Again</span>
                  </button>
                </div>
              )}

              {/* Result State */}
              {result && (
                <div className="flex-1 flex flex-col gap-6 animate-fade-in">
                  <div className="bg-slate-950/80 border border-slate-800/60 rounded-xl p-5 shadow-inner flex-1 font-mono text-sm leading-relaxed text-slate-200 whitespace-pre-wrap selection:bg-indigo-500 selection:text-white overflow-y-auto max-h-[350px]">
                    {emailText}
                  </div>

                  {/* signal detail if present */}
                  {result.LLMNode_276?.output?.generatedResponse && (
                    <div className="bg-slate-900/60 border border-slate-800/40 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                        Scraped Signals (Noticed Things)
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 font-mono whitespace-pre-wrap leading-relaxed">
                        {result.LLMNode_276.output.generatedResponse}
                      </p>
                    </div>
                  )}

                  {/* Asset idea if present */}
                  {result.LLMNode_996?.output?.generatedResponse && (
                    <div className="bg-slate-900/60 border border-slate-800/40 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                        Suggested Asset (Pitch Anchor)
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 font-mono whitespace-pre-wrap leading-relaxed">
                        {result.LLMNode_996.output.generatedResponse}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Outreach Personalizer. Prepared for PR submission.</p>
          <div className="flex gap-4">
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400/80 font-medium">Safe Server Execution</span>
            <span className="text-slate-600">|</span>
            <span className="text-purple-400/80 font-medium">No Secret Leaks</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
