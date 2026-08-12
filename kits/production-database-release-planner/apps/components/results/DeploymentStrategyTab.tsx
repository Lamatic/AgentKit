import type { RiskLevel, StrategyType } from "@/types/migrationPipeline";
import DeploymentTimeline from "./DeploymentTimeline";
import StatusBadge from "./StatusBadge";

type DeploymentStrategyTabProps = {
  estimatedDowntime: RiskLevel;
  maintenanceWindowRequired: boolean;
  recommendation: {
    summary: string;
    why: string;
    best_practice: string;
  };
  strategy: StrategyType;
  strategyTone: "green" | "amber" | "red";
  toneMap: Record<RiskLevel, "gray" | "green" | "amber" | "red">;
  deploymentOrder: string[];
};

export default function DeploymentStrategyTab({
  estimatedDowntime,
  maintenanceWindowRequired,
  recommendation,
  strategy,
  strategyTone,
  toneMap,
  deploymentOrder,
}: DeploymentStrategyTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Strategy
          </p>
          <div className="mt-2">
            <StatusBadge tone={strategyTone}>{strategy}</StatusBadge>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Maintenance Window Required
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {maintenanceWindowRequired ? "Required" : "Not required"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Estimated Downtime
          </p>
          <div className="mt-2">
            <StatusBadge tone={toneMap[estimatedDowntime]}>
              {estimatedDowntime === "UNKNOWN" ? "Unknown" : estimatedDowntime}
            </StatusBadge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Deployment Order
          </p>
          <div className="mt-3">
            <DeploymentTimeline steps={deploymentOrder} />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Recommendation
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">{recommendation.summary}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Why
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">{recommendation.why}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Best Practice
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">{recommendation.best_practice}</p>
          </div>
        </div>
      </div>
    </div>
  );
}