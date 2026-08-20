import { CircleHelp, ShieldCheck, ShieldAlert, ShieldQuestion, type LucideIcon } from "lucide-react";
import type { ReportAnomaly } from "../lib/types";

const CONFIDENCE: Record<string, { text: string; bg: string; icon: LucideIcon }> = {
  high: { text: "text-confidence-high", bg: "bg-confidence-high-soft", icon: ShieldCheck },
  medium: { text: "text-confidence-medium", bg: "bg-confidence-medium-soft", icon: ShieldQuestion },
  low: { text: "text-confidence-low", bg: "bg-confidence-low-soft", icon: ShieldAlert },
};

export function AttributionTrace({ anomaly }: { anomaly: ReportAnomaly }) {
  const { attribution } = anomaly;

  if (!attribution.causeEventId) {
    return (
      <div className="flex items-start gap-2.5 rounded-sm border border-edge bg-panel-2 p-3.5 text-sm">
        <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-muted-2" strokeWidth={2} />
        <div>
          <p className="font-medium text-muted">No change in the candidate window explains this anomaly.</p>
          <p className="mt-1 text-muted-2">{attribution.reasoning}</p>
        </div>
      </div>
    );
  }

  const c = CONFIDENCE[attribution.confidence] ?? CONFIDENCE.low;
  const Icon = c.icon;

  return (
    <div className={`rounded-sm border border-edge p-3.5 text-sm ${c.bg}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${c.text}`} strokeWidth={2.25} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${c.text}`}>
          {attribution.confidence} confidence
        </span>
        <span className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[11px] text-muted">
          {attribution.causeEventId}
        </span>
      </div>
      <p className="mt-2 text-ink">{attribution.reasoning}</p>
      {attribution.evidence.length > 0 && (
        <ul className="mt-2 space-y-1 pl-0.5">
          {attribution.evidence.map((e, i) => (
            <li key={i} className="flex gap-2 text-muted-2">
              <span className="select-none text-muted-2">&bull;</span>
              <span>{e}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
