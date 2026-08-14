"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../components/header";
import { ADRForm } from "../components/adr-form";
import { ADRDisplay } from "../components/adr-display";
import { generateADR, ADRResult } from "../actions/orchestrate";
import { PRESETS } from "../components/preset-picker";
import { Cpu, Terminal, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  const [data, setData] = useState<ADRResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | undefined>(undefined);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  // Auto-generate initial preview ADR on first load
  useEffect(() => {
    handleFormSubmit(PRESETS[0].instructions, PRESETS[0].constraints);
  }, []);

  const handleFormSubmit = async (instructions: string, constraints: string) => {
    setIsLoading(true);
    setErrorNotice(undefined);
    try {
      const res = await generateADR(instructions, constraints);
      if (res.success && res.data) {
        setData(res.data);
        setIsFallback(!!res.isFallback);
        if (res.error) {
          setErrorNotice(res.error);
        }
      } else {
        setErrorNotice(res.error || "Failed to generate ADR document.");
      }
    } catch (err: any) {
      setErrorNotice("An unexpected client error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Zap className="h-3.5 w-3.5" />
            <span>Agentic Architecture Decision Intelligence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Turn Technical Proposals into <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              MADR 3.0 Standard Records
            </span>
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Eliminate documentation friction. Evaluate technical alternatives, calculate latency & cost trade-offs, and generate visual Mermaid diagrams automatically with Lamatic AgentKit.
          </p>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <ADRForm onSubmit={handleFormSubmit} isLoading={isLoading} />

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-cyan-400" />
                <span>Lamatic Studio Integration</span>
              </div>
              <p>
                This kit invokes the <code className="text-cyan-300 font-mono">adr-copilot</code> flow via the Lamatic TypeScript SDK. You can customize prompts in <code className="text-purple-300 font-mono">kits/adr-copilot/prompts/</code>.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            {data ? (
              <ADRDisplay data={data} isFallback={isFallback} errorNotice={errorNotice} />
            ) : (
              <div className="h-96 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center text-slate-500 text-sm">
                Submit proposal notes to view generated ADR document...
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>Built for the Lamatic AgentKit Challenge</div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>MADR 3.0 Compatible</span>
            <span>•</span>
            <span>Powered by Lamatic.ai</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
