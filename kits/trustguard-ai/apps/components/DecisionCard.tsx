// components/DecisionCard.tsx
"use client";

import { motion } from "framer-motion";
import { CheckCircle2, UserCheck, ClipboardList, Target, Zap } from "lucide-react";
import { getDecisionColor } from "@/lib/utils";
import type { DecisionData } from "@/types/response";

interface DecisionCardProps {
  readonly decision: DecisionData;
  readonly delay?: number;
}

/**
 * Result card that presents the AI's final decision for an investigation.
 *
 * Displays the classification badge (e.g. "SCAM", "SAFE") with colour
 * coding derived from `getDecisionColor`, followed by the final verdict,
 * recommended action, priority level, and a human-review flag.  Animates
 * in with a configurable entry delay to stagger the result card grid.
 *
 * @param decision - Validated decision data returned by the Lamatic flow.
 * @param delay    - Framer Motion entry delay in seconds (default `0`).
 * @returns An animated card element with the full decision breakdown.
 */
export default function DecisionCard({ decision, delay = 0 }: DecisionCardProps) {
  const colors = getDecisionColor(decision.classification);

  return (
    <div
      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 shadow-xl h-full"
    >
      {/* Card header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
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
          icon={<ClipboardList className="h-3 w-3" aria-hidden="true" />}
          label="Final Verdict"
          value={decision.final_verdict}
        />
        <DetailRow
          icon={<Target className="h-3 w-3" aria-hidden="true" />}
          label="Recommended Action"
          value={decision.recommended_action}
        />
        <DetailRow
          icon={<Zap className="h-3 w-3" aria-hidden="true" />}
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
            <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Needs Human Review
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${decision.human_review
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
              : "bg-green-500/20 text-green-300 border-green-500/40"
              }`}
          >
            {decision.human_review ? "Yes" : "No"}
          </span>
        </div>
      </div>
    </div>
  );
}

interface DetailRowProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
  readonly valueClass?: string;
}

/**
 * Renders a single labelled field row inside the DecisionCard details grid.
 *
 * Displays a small icon, an uppercase label, and the field value beneath
 * it.  An optional `valueClass` prop allows callers to apply custom colour
 * styles to the value text (e.g. red for high priority).
 *
 * @param icon       - Emoji or icon character shown before the label.
 * @param label      - Uppercase section label for the field.
 * @param value      - String value to display; falls back to `"—"` if falsy.
 * @param valueClass - Tailwind CSS class applied to the value `<p>` element.
 * @returns A two-line label + value row element.
 */
function DetailRow({
  icon,
  label,
  value,
  valueClass = "text-slate-200",
}: DetailRowProps) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
        {icon} {label}
      </div>
      <p className={`text-sm leading-relaxed ${valueClass}`}>{value ?? "—"}</p>
    </div>
  );
}
