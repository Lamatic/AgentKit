'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Copy, Check, Rocket, RefreshCw } from 'lucide-react';
import { MarketReport } from '@/lib/types';

interface VerdictBadgeProps {
  report: MarketReport;
  onReset: () => void;
}

export function VerdictBadge({ report, onReset }: VerdictBadgeProps) {
  const [copied, setCopied] = useState(false);
  const isBuild = report.verdict === 'BUILD';
  const isSkip = report.verdict === 'SKIP';

  const handleCopyMarkdown = () => {
    const md = `
# 📡 Indie Founder Radar Report
**Idea:** ${report.idea}
**Date:** ${new Date(report.timestamp).toLocaleDateString()}

---

### 1. Top 3 Pain Points
${report.painPoints.map((p) => `- ${p}`).join('\n')}

### 2. Competitor Weaknesses
${report.competitorWeaknesses.map((w) => `- ${w}`).join('\n')}

### 3. Target Audience
${report.targetAudience}

### 4. Market Opportunity
${report.marketOpportunity}

### 5. Verdict
**${report.verdict === 'BUILD' ? 'BUILD ✅' : report.verdict === 'SKIP' ? 'SKIP ❌' : 'VERDICT UNCLEAR'}**
${report.verdictReason}
    `.trim();

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className={`relative rounded-3xl p-6 sm:p-8 backdrop-blur-2xl border transition-all duration-500 overflow-hidden shadow-2xl ${
        isBuild
          ? 'bg-gradient-to-b from-primary/20 via-card/90 to-background border-primary/40 shadow-[0_0_50px_rgba(16,185,129,0.2)]'
          : isSkip
          ? 'bg-gradient-to-b from-destructive/20 via-card/90 to-background border-destructive/40 shadow-[0_0_50px_rgba(244,63,94,0.2)]'
          : 'bg-gradient-to-b from-amber-500/20 via-card/90 to-background border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.2)]'
      }`}
    >
      {/* Background Decorative Blur */}
      <div
        className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isBuild ? 'bg-primary' : isSkip ? 'bg-destructive' : 'bg-amber-400'
        }`}
      />

      <div className="flex flex-col items-center text-center space-y-5">
        {/* Section 5 Tag */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
            Section 5 • Final Verdict
          </span>
        </div>

        {/* Big Verdict Badge */}
        <div className="flex flex-col items-center gap-3">
          <div
            className={`inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl border-2 text-2xl sm:text-4xl font-black tracking-tight shadow-xl ${
              isBuild
                ? 'bg-primary/20 text-primary border-primary shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-bounce [animation-duration:3s]'
                : isSkip
                ? 'bg-destructive/20 text-destructive border-destructive shadow-[0_0_30px_rgba(244,63,94,0.4)]'
                : 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
            }`}
          >
            {isBuild && <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />}
            {isSkip && <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-destructive" />}
            {!isBuild && !isSkip && <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />}

            <span>
              {isBuild ? 'BUILD ✅' : isSkip ? 'SKIP ❌' : 'MORE RESEARCH NEEDED ⚠️'}
            </span>
          </div>
        </div>

        {/* Verdict Rationale (2 sentences) */}
        <div className="max-w-2xl bg-background/50 rounded-2xl p-5 border border-border text-card-foreground text-base sm:text-lg leading-relaxed">
          <p className="font-medium">{report.verdictReason}</p>
        </div>

        {/* Strategic Next Steps */}
        <div className="w-full max-w-2xl text-left bg-card/60 rounded-xl p-4 border border-border text-xs sm:text-sm text-card-foreground space-y-1.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Rocket className="w-4 h-4 text-primary" />
            <span>{isBuild ? 'Recommended Next Steps' : 'Pivot / Alternative Direction'}</span>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {isBuild
              ? '1. Create a 1-page waiting list to capture target audience emails. 2. Interview 5 potential users experiencing pain point #1. 3. Scope MVP strictly around competitor weaknesses.'
              : '1. Re-evaluate customer willingness-to-pay. 2. Look for adjacent enterprise niches or high-friction workflows. 3. Test narrower vertical positioning.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted hover:bg-card-muted border border-border text-foreground text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-primary" />
                <span className="text-primary font-semibold">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Full Report (Markdown)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card hover:bg-card-muted border border-border text-muted-foreground hover:text-foreground text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Validate Another Idea</span>
          </button>
        </div>
      </div>
    </div>
  );
}
