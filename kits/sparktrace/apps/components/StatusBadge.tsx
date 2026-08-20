import { CircleDot, CheckCircle2, XCircle, HelpCircle, type LucideIcon } from "lucide-react";
import { Badge, type BadgeVariant } from "./ui/badge";
import { cn } from "./ui/utils";
import type { HypothesisStatus, StepVerdict } from "../lib/contracts";

/**
 * Renders a colored status pill for a Hypothesis (open/confirmed/refuted/inconclusive)
 * or a step's StepVerdict (confirmed/refuted/inconclusive) — the two share three states.
 * Color mapping (per spec): open=slate, confirmed=green, refuted=red, inconclusive=amber.
 */
export type DisplayStatus = HypothesisStatus | StepVerdict;

const STATUS_META: Record<DisplayStatus, { label: string; variant: BadgeVariant; icon: LucideIcon }> = {
  open: { label: "Open", variant: "slate", icon: CircleDot },
  confirmed: { label: "Confirmed", variant: "success", icon: CheckCircle2 },
  refuted: { label: "Refuted", variant: "destructive", icon: XCircle },
  inconclusive: { label: "Inconclusive", variant: "warning", icon: HelpCircle },
};

export interface StatusBadgeProps {
  status: DisplayStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className={cn("capitalize", className)}>
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  );
}
