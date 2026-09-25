'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { IdeaInput } from '@/components/IdeaInput';
import { ReportView } from '@/components/ReportView';
import { MarketReport } from '@/lib/types';
import { AlertTriangle, RefreshCw, Radar, Search, ShieldCheck, Sparkles } from 'lucide-react';

const SCAN_STEPS = [
  { icon: Search, label: 'Querying Serper for live user discussions & reviews...' },
  { icon: ShieldCheck, label: 'Auditing competitor weaknesses & saturation signals...' },
  { icon: Sparkles, label: 'Analyzing target audience & evaluating market gap...' },
  { icon: Radar, label: 'Generating data-backed 5-section report & BUILD/SKIP verdict...' },
];

export default function Home() {
  const [report, setReport] = useState<MarketReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastIdea, setLastIdea] = useState<string>('');

  // Rotate through scan steps while loading
  useEffect(() => {
    if (!isLoading) {
      setCurrentStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % SCAN_STEPS.length);
    }, 2800);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleAnalyze = async (idea: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setReport(null);
    setLastIdea(idea);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze idea. Please try again.');
      }

      setReport(data.report);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setReport(null);
    setErrorMessage(null);
  };

  return (
    <main className="min-h-screen bg-background text-foreground relative selection:bg-primary selection:text-primary-foreground font-sans pb-20">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-teal-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[350px] bg-cyan-600/10 rounded-full blur-[150px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 pt-4">
        {/* Header */}
        <Header />

        {/* Input Form (shown when no report or when scanning) */}
        {!report && (
          <div className="space-y-6">
            <IdeaInput onSubmit={handleAnalyze} isLoading={isLoading} />
          </div>
        )}

        {/* Live Loading State */}
        {isLoading && (
          <div className="w-full max-w-xl mx-auto rounded-2xl bg-card/90 border border-border p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
            {/* Animated Radar Pulse */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping [animation-duration:2s]" />
              <div className="absolute inset-2 rounded-full border border-primary/40 animate-pulse" />
              <div className="p-4 rounded-full bg-background border border-primary/50 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <Radar className="w-8 h-8 text-primary animate-spin [animation-duration:4s]" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground tracking-tight">
                Scanning Market Radar...
              </h3>
              <p className="text-sm text-primary font-medium h-6 transition-all duration-300">
                {SCAN_STEPS[currentStepIndex].label}
              </p>
              <p className="text-xs text-muted-foreground">
                Connecting to Lamatic Serper node & Gemini analyst
              </p>
            </div>

            {/* Progress indicators */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {SCAN_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? 'w-8 bg-primary shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                      : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && !isLoading && (
          <div className="w-full max-w-2xl mx-auto rounded-2xl bg-destructive/10 border border-destructive/30 p-5 backdrop-blur-xl space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-destructive">Analysis Failed</h4>
                <p className="text-xs text-card-foreground leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => handleAnalyze(lastIdea)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-destructive/20 hover:bg-destructive/30 border border-destructive/40 text-destructive text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Scan</span>
              </button>
            </div>
          </div>
        )}

        {/* Report View with 5 Sections and BUILD/SKIP Verdict */}
        {report && !isLoading && (
          <ReportView report={report} onReset={handleReset} />
        )}
      </div>

      {/* Footer */}
      <footer className="mt-20 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        <p>
          Indie Founder Radar • Built with Lamatic AgentKit, Next.js & Tailwind CSS
        </p>
      </footer>
    </main>
  );
}
