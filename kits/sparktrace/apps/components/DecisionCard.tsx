import { Brain, FlaskConical, FolderSearch, FlagTriangleRight, type LucideIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";
import type { PlannerAction, PlannerDecision } from "../lib/contracts";
import { PLANNER_TIER, tierForAction } from "../lib/model-tiers";

export interface DecisionCardProps {
  decision: PlannerDecision;
  /** 1-based turn index for display, e.g. "Turn 3" */
  index?: number;
  className?: string;
}

const ACTION_META: Record<PlannerAction, { label: string; icon: LucideIcon }> = {
  gen_query: { label: "gen_query", icon: FlaskConical },
  read_repo: { label: "read_repo", icon: FolderSearch },
  conclude: { label: "conclude", icon: FlagTriangleRight },
};

/**
 * The star of the demo: renders one PlannerDecision (Opus, per-turn) as an
 * agent "thought" — reasoning first and prominent, action badge secondary —
 * rather than as a generic log line. Distinct violet/indigo accent so the
 * planner's narration reads apart from hypothesis/step/report cards.
 */
export function DecisionCard({ decision, index, className }: DecisionCardProps) {
  const meta = ACTION_META[decision.action];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "rounded-xl border border-violet/30 bg-violet/5 p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-violet/15 text-violet">
          <Brain className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-violet">
              {index !== undefined ? `Planner · turn ${index}` : "Planner"}
            </span>
            {/* Which tier owns this turn in live mode. Stubbed in demo
                mode — the page-level ShowcaseNotice says so once, rather
                than repeating a caveat on every card. */}
            <span
              className="text-[11px] text-muted-foreground"
              title={`Live mode: the ${PLANNER_TIER.flow} flow (${PLANNER_TIER.model}) makes this decision`}
            >
              {PLANNER_TIER.shortModel}
            </span>
            <Badge variant="violet" className="gap-1 font-mono">
              <Icon className="size-3" />
              {meta.label}
            </Badge>
            <span
              className="text-[11px] text-muted-foreground"
              title={`Handled by the ${tierForAction(decision.action).flow} flow (${tierForAction(decision.action).model}) in live mode`}
            >
              → {tierForAction(decision.action).role} · {tierForAction(decision.action).shortModel}
            </span>
          </div>
          <p className="text-sm italic leading-relaxed text-foreground">&ldquo;{decision.reasoning}&rdquo;</p>
          {decision.action === "gen_query" && decision.hypothesis && (
            <div className="rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs">
              <span className="text-muted-foreground">Testing hypothesis: </span>
              <span className="font-medium text-foreground">{decision.hypothesis.title}</span>
            </div>
          )}
          {decision.action === "read_repo" && decision.focus && (
            <div className="rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs">
              <span className="text-muted-foreground">Focus: </span>
              <span className="font-mono font-medium text-foreground">{decision.focus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
