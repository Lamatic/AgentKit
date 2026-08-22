import type { RiskLevel } from "@/types/migrationPipeline";
import StatusBadge from "./StatusBadge";

type RiskAnalysisTabProps = {
  blockingRisk: RiskLevel;
  lockType: string;
  productionRisk: RiskLevel;
  reasoning: string;
  tableRewrite: boolean | "UNKNOWN";
  toneMap: Record<RiskLevel, "gray" | "green" | "amber" | "red">;
};

export default function RiskAnalysisTab({
  blockingRisk,
  lockType,
  productionRisk,
  reasoning,
  tableRewrite,
  toneMap,
}: RiskAnalysisTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Lock Type
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{lockType}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Table Rewrite
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {tableRewrite === "UNKNOWN" ? "UNKNOWN" : tableRewrite ? "YES" : "NO"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Blocking Risk
          </p>
          <div className="mt-2">
            <StatusBadge tone={toneMap[blockingRisk]}>
              {blockingRisk === "UNKNOWN" ? "Unknown" : blockingRisk}
            </StatusBadge>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Production Risk
          </p>
          <div className="mt-2">
            <StatusBadge tone={toneMap[productionRisk]}>
              {productionRisk === "UNKNOWN" ? "Unknown" : productionRisk}
            </StatusBadge>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Reasoning
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-700">{reasoning}</p>
      </div>
    </div>
  );
}