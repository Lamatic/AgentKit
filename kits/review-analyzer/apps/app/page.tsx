"use client"

import { ShieldCheck, ShieldAlert, Sparkles, AlertTriangle, ArrowRight, Chrome, Terminal, PlayCircle } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-[#07080e] text-[#f4f5f6] font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-[#e4e6eb] to-zinc-400 bg-clip-text text-transparent">
            Review Analyzer Agent
          </span>
        </div>
        <a 
          href="#setup"
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
        >
          Get Started
        </a>
      </nav>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Lamatic AgentKit Challenge</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.1] mb-6">
          The AI-Powered E-Commerce Shield For Shoppers
        </h1>
        <p className="text-base sm:text-lg text-zinc-400 max-w-xl mb-10 leading-relaxed">
          Stop scrolling through hundreds of comments. Instantly detect fake reviews, extract honest pros/cons, and get a Trust Score using Chrome & Lamatic AI.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full sm:w-auto justify-center">
          <a
            href="#setup"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-95 shadow-xl shadow-indigo-500/20 transition-opacity"
          >
            Install Extension <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="https://github.com/Lamatic/AgentKit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
          >
            Star on GitHub
          </a>
        </div>

        {/* Feature Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mb-32">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Consensus Synthesis</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Synthesize hundreds of user reviews into a brief, readable paragraph mapping the absolute consensus of real buyers.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Authenticity Audit</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Audits and assigns an aggregate Trust Score from 0 to 100 based on word patterns, repetitive feedback templates, and low-effort spam.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Chrome className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Chrome Action</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Scrapes review panels directly inside your active tab, bypassing strict server-side bot-blocking protections securely.
            </p>
          </div>
        </section>

        {/* Setup Steps Section */}
        <section id="setup" className="w-full max-w-4xl text-left bg-white/[0.02] border border-white/5 rounded-3xl p-8 sm:p-12 backdrop-blur-md">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-8 flex items-center gap-3">
            <Terminal className="w-7 h-7 text-indigo-400" /> Quickstart Setup
          </h2>
          
          <div className="flex flex-col gap-8">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/35 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                1
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">Create Environment Variables</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Create a `.env.local` file inside the Next.js app directory (`kits/review-analyzer/apps/`) and populate your Lamatic API Keys:
                </p>
                <pre className="p-4 rounded-xl bg-[#030408] border border-white/5 text-xs text-indigo-300 overflow-x-auto select-text font-mono">
                  {`REVIEW_ANALYZER_FLOW_ID="your-flow-id"\nLAMATIC_API_URL="https://studio.lamatic.ai/api/your-project"\nLAMATIC_PROJECT_ID="your-project-id"\nLAMATIC_API_KEY="your-api-key"`}
                </pre>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/35 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                2
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">Run Next.js locally</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Install node dependencies and launch the dev environment:
                </p>
                <pre className="p-4 rounded-xl bg-[#030408] border border-white/5 text-xs text-indigo-300 overflow-x-auto select-text font-mono">
                  cd kits/review-analyzer/apps && npm install && npm run dev
                </pre>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/35 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                3
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">Install the Chrome Extension</h4>
                <ol className="list-decimal list-inside text-sm text-zinc-400 space-y-1.5 pl-1">
                  <li>Navigate to <code className="text-indigo-300 font-mono">chrome://extensions/</code> in Chrome.</li>
                  <li>Enable **Developer mode** using the toggle in the top-right.</li>
                  <li>Click **Load unpacked** in the top-left.</li>
                  <li>Choose the folder: <code className="text-indigo-300 font-mono">kits/review-analyzer/apps/extension</code>.</li>
                  <li>Open any product page and click the extension icon to run analysis!</li>
                </ol>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
