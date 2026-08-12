import { cn } from "./ui/utils";

export interface ConfidenceMeterProps {
  /** 0..1 */
  value: number;
  label?: string;
  className?: string;
}

/** Small horizontal meter for a 0..1 confidence score (planner priors, report confidence). */
export function ConfidenceMeter({ value, label = "Confidence", className }: ConfidenceMeterProps) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const tone = pct >= 70 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-destructive";

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
