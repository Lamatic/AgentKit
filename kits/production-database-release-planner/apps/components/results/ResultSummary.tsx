import StatusBadge from "./StatusBadge";

type ResultSummaryProps = {
  deploymentStrategy: string;
  releaseStatus: string;
  releaseTone: "green" | "amber" | "red";
  rollbackAvailable: boolean;
  rollbackTone: "green" | "amber" | "red";
  riskLevel: string;
  riskTone: "gray" | "green" | "amber" | "red";
};

function SummaryTile({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "gray" | "green" | "amber" | "red" | "blue";
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <div className="mt-2">
        <StatusBadge tone={tone}>{value}</StatusBadge>
      </div>
    </div>
  );
}

export default function ResultSummary({
  deploymentStrategy,
  releaseStatus,
  releaseTone,
  rollbackAvailable,
  rollbackTone,
  riskLevel,
  riskTone,
}: ResultSummaryProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryTile label="Release Status" tone={releaseTone} value={releaseStatus} />
      <SummaryTile label="Risk Level" tone={riskTone} value={riskLevel} />
      <SummaryTile label="Deployment Strategy" tone="blue" value={deploymentStrategy} />
      <SummaryTile
        label="Rollback Availability"
        tone={rollbackTone}
        value={rollbackAvailable ? "AVAILABLE" : "NOT AVAILABLE"}
      />
    </div>
  );
}