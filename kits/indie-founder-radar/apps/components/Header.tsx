import React from 'react';
import { Radar, Sparkles, Activity, ShieldCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="text-center space-y-4 pt-6 pb-2">
      {/* Top Status Pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium backdrop-blur-md animate-pulse">
        <Activity className="w-3.5 h-3.5" />
        <span>Live Market Intelligence Active</span>
      </div>

      {/* Main Title & Icon */}
      <div className="flex items-center justify-center gap-3">
        <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-teal-500/20 border border-primary/30 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
          <Radar className="w-8 h-8 text-primary animate-spin [animation-duration:8s]" />
          <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-sm -z-10" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-muted-foreground to-primary bg-clip-text text-transparent">
          Indie Founder Radar
        </h1>
      </div>

      {/* Subtitle */}
      <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
        Validate your startup idea before writing code. We scan live web discussions, uncover competitor blindspots, and deliver a data-backed{' '}
        <span className="font-semibold text-primary">BUILD ✅</span> or{' '}
        <span className="font-semibold text-destructive">SKIP ❌</span> verdict.
      </p>

      {/* Feature tags */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-card/80 border border-border">
          <Sparkles className="w-3 h-3 text-amber-400" /> Real-time Serper Web Search
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-card/80 border border-border">
          <ShieldCheck className="w-3 h-3 text-cyan-400" /> Gap & Saturation Analysis
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-card/80 border border-border">
          <Radar className="w-3 h-3 text-primary" /> Powered by Lamatic Flow
        </span>
      </div>
    </header>
  );
}
