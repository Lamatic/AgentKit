// components/DecisionCard.tsx
"use client";

import { motion } from "framer-motion";
import { getDecisionColor } from "@/lib/utils";
import type { DecisionData } from "@/types/response";

interface DecisionCardProps {
  decision: DecisionData;
  delay?: number;
}

export default function DecisionCard({ decision, delay = 0 }: DecisionCardProps) {
  const colors = getDecisionColor(decision.classification);

  return (
    <motion.div
      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 shadow-xl h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-white">Decision</h3>
      </div>

      {/* Large classification badge */}
      <div className="flex justify-center mb-5">
        <motion.span
          className={`inline-flex items-center rounded-2xl px-8 py-3 text-2xl font-black tracking-widest border shadow-lg ${colors.bg} ${colors.text} ${colors.border} ${colors.glow}`}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: delay + 0.15, type: "spring", stiffness: 260, damping: 20 }}
        >
          {decision.classification?.toUpperCase() ?? "UNKNOWN"}
        </motion.span>
      </div>

      {/* Details grid */}
      <div className="space-y-3">
        <DetailRow
          icon="📋"
          label="Final Verdict"
          value={decision.final_verdict}
        />
        <DetailRow
          icon="🎯"
          label="Recommended Action"
          value={decision.recommended_action}
        />
        <DetailRow
          icon="⚡"
          label="Priority"
          value={decision.priority}
          valueClass={
            decision.priority?.toUpperCase() === "HIGH"
              ? "text-red-400 font-semibold"
              : decision.priority?.toUpperCase() === "MEDIUM"
              ? "text-orange-400 font-semibold"
              : "text-green-400 font-semibold"
          }
        />

        {/* Human Review flag */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.06] mt-3">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Needs Human Review
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
              decision.human_review
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-green-500/20 text-green-300 border-green-500/40"
            }`}
          >
            {decision.human_review ? "Yes" : "No"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueClass = "text-slate-200",
}: {
  icon: string;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
        {icon} {label}
      </p>
      <p className={`text-sm leading-relaxed ${valueClass}`}>{value ?? "—"}</p>
    </div>
  );
}
