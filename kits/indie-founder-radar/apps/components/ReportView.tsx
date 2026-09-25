'use client';

import React, { useState } from 'react';
import {
  Flame,
  ShieldAlert,
  Users,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { MarketReport } from '@/lib/types';
import { SectionCard } from './SectionCard';
import { VerdictBadge } from './VerdictBadge';

interface ReportViewProps {
  report: MarketReport;
  onReset: () => void;
}

export function ReportView({ report, onReset }: ReportViewProps) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Overview Banner */}
      <div className="rounded-2xl bg-card/90 border border-border p-5 sm:p-6 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Market Validation Report</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
            &ldquo;{report.idea}&rdquo;
          </h2>
        </div>

        {report.latencyMs && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground text-xs font-medium whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{(report.latencyMs / 1000).toFixed(1)}s scan time</span>
          </div>
        )}
      </div>

      {/* 2x2 Grid for Sections 1 to 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Section 1: Pain Points */}
        <SectionCard
          number={1}
          title="Top 3 Pain Points"
          subtitle="Real friction users currently struggle with"
          icon={Flame}
          badgeColor="rose"
        >
          {report.painPoints.length > 0 ? (
            <ul className="space-y-2.5">
              {report.painPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-destructive/20 text-destructive font-bold text-xs flex items-center justify-center border border-destructive/30 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-card-foreground">{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-xs italic">
              No distinct pain points identified in search results.
            </p>
          )}
        </SectionCard>

        {/* Section 2: Competitor Weaknesses */}
        <SectionCard
          number={2}
          title="Competitor Weaknesses"
          subtitle="Gaps left open by current alternatives"
          icon={ShieldAlert}
          badgeColor="amber"
        >
          {report.competitorWeaknesses.length > 0 ? (
            <ul className="space-y-2.5">
              {report.competitorWeaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-warning/20 text-warning font-bold text-xs flex items-center justify-center border border-warning/30 mt-0.5">
                    ✕
                  </span>
                  <span className="text-card-foreground">{weakness}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-xs italic">
              No specific competitor weaknesses identified.
            </p>
          )}
        </SectionCard>

        {/* Section 3: Target Audience */}
        <SectionCard
          number={3}
          title="Target Audience"
          subtitle="Exact ideal customer profile (ICP)"
          icon={Users}
          badgeColor="cyan"
        >
          <div className="p-3.5 rounded-xl bg-background/60 border border-border text-card-foreground leading-relaxed font-normal">
            {report.targetAudience}
          </div>
        </SectionCard>

        {/* Section 4: Market Opportunity */}
        <SectionCard
          number={4}
          title="Market Opportunity"
          subtitle="Growth trajectory vs saturation analysis"
          icon={TrendingUp}
          badgeColor="purple"
        >
          <div className="p-3.5 rounded-xl bg-background/60 border border-border text-card-foreground leading-relaxed font-normal">
            {report.marketOpportunity}
          </div>
        </SectionCard>
      </div>

      {/* Section 5: The Big Verdict Badge at the bottom */}
      <VerdictBadge report={report} onReset={onReset} />

      {/* Collapsible Raw LLM Output */}
      <div className="border border-border rounded-2xl bg-background/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRaw(!showRaw)}
          className="w-full px-5 py-3 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground hover:bg-card/50 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2 font-medium">
            <FileText className="w-3.5 h-3.5" />
            <span>View Full Raw AI Model Response</span>
          </span>
          {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showRaw && (
          <div className="p-5 border-t border-border bg-background font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-96">
            {report.rawReport}
          </div>
        )}
      </div>
    </div>
  );
}
