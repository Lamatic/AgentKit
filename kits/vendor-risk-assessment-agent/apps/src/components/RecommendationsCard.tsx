import React from 'react';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRightCircle,
  Check,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Recommendations } from '../types';
import { EmptyStateCard } from './EmptyStateCard';
import { renderItemContent } from '../utils';
import { motion } from 'motion/react';

interface RecommendationsCardProps {
  recommendations: Recommendations | null;
}

const getPriorityBadge = (text: string) => {
  const lower = text.toLowerCase();
  if (lower.includes('high') || lower.includes('p1') || lower.includes('urgent') || lower.includes('critical')) {
    return (
      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 shrink-0 shadow-2xs">
        High Priority
      </span>
    );
  }
  if (lower.includes('med') || lower.includes('p2') || lower.includes('moderate')) {
    return (
      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shrink-0 shadow-2xs">
        Medium Priority
      </span>
    );
  }
  if (lower.includes('low') || lower.includes('p3')) {
    return (
      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 shadow-2xs">
        Low Priority
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 shrink-0 shadow-2xs">
      High Priority
    </span>
  );
};

export const RecommendationsCard: React.FC<RecommendationsCardProps> = ({
  recommendations,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all"
    >
      {/* Card Header */}
      <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Mitigation & Action Roadmap
            </h3>
            <p className="text-xs text-slate-500">
              Executive synthesis, positive highlights, urgent priority actions, and next steps.
            </p>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 sm:p-7">
        {!recommendations ? (
          <EmptyStateCard
            title="Roadmap & Recommendations Pending"
            description="Submit vendor information to synthesize Executive Summary, Positive Findings, Priority Actions, Strategic Guidance, and Decision Steps."
          />
        ) : (
          <div className="space-y-6">
            {/* 1. Executive Summary */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/30 border border-blue-100 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <FileText className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                <span>Executive Summary</span>
              </div>
              <div className="text-xs text-slate-800 leading-relaxed font-medium">
                {renderItemContent(recommendations.executiveSummary) || (
                  <span className="text-slate-400 italic font-normal">Not Provided</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 2. Positive Findings */}
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <span>Positive Security Findings</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold">
                    {recommendations.positiveFindings ? recommendations.positiveFindings.length : 0} Items
                  </span>
                </div>

                {recommendations.positiveFindings && recommendations.positiveFindings.length > 0 ? (
                  <ul className="space-y-3 text-xs text-slate-800">
                    {recommendations.positiveFindings.map((finding, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-emerald-200/80 shadow-2xs"
                      >
                        <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        </span>
                        <div className="leading-snug flex-1 font-medium text-slate-900">
                          {renderItemContent(finding)}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 bg-white/80 rounded-xl border border-emerald-100 text-xs text-slate-400 italic">
                    Not Provided
                  </div>
                )}
              </div>

              {/* 3. Priority Actions (MUST STAND OUT) */}
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                    <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                    <span>Priority Remediation Actions</span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-800 font-bold">
                    {recommendations.priorityActions ? recommendations.priorityActions.length : 0} Required
                  </span>
                </div>

                {recommendations.priorityActions && recommendations.priorityActions.length > 0 ? (
                  <ul className="space-y-3 text-xs text-slate-800">
                    {recommendations.priorityActions.map((action, idx) => {
                      const actionText = String(
                        typeof action === 'object' ? JSON.stringify(action) : action
                      );
                      return (
                        <li
                          key={idx}
                          className="p-4 rounded-xl bg-white border border-amber-200 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                              <Zap className="h-3 w-3 text-amber-600" />
                              Action Item #{idx + 1}
                            </span>
                            {getPriorityBadge(actionText)}
                          </div>
                          <div className="leading-relaxed font-semibold text-slate-900 text-xs">
                            {renderItemContent(action)}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="p-3 bg-white/80 rounded-xl border border-amber-100 text-xs text-slate-400 italic">
                    Not Provided
                  </div>
                )}
              </div>

              {/* 4. Strategic Recommendations */}
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Lightbulb className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                    <span>Strategic Recommendations</span>
                  </div>
                </div>

                {recommendations.recommendations && recommendations.recommendations.length > 0 ? (
                  <ul className="space-y-3 text-xs text-slate-800">
                    {recommendations.recommendations.map((rec, idx) => (
                      <li
                        key={idx}
                        className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-start gap-3"
                      >
                        <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                        <div className="leading-snug flex-1 font-medium text-slate-800">
                          {renderItemContent(rec)}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-slate-200/60 text-xs text-slate-400 italic">
                    Not Provided
                  </div>
                )}
              </div>

              {/* 5. Next Steps */}
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <ArrowRightCircle className="h-4.5 w-4.5 text-purple-600 shrink-0" />
                    <span>Next Decision Steps</span>
                  </div>
                </div>

                {recommendations.nextSteps && recommendations.nextSteps.length > 0 ? (
                  <ol className="space-y-3 text-xs text-slate-800">
                    {recommendations.nextSteps.map((step, idx) => (
                      <li
                        key={idx}
                        className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-start gap-3"
                      >
                        <span className="h-5 w-5 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center text-[11px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <div className="leading-snug flex-1 font-medium text-slate-800">
                          {renderItemContent(step)}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-slate-200/60 text-xs text-slate-400 italic">
                    Not Provided
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
