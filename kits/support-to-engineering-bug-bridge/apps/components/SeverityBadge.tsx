import type { ClusterSummary } from "@/lib/types";

const SEVERITY_COLORS: Record<ClusterSummary["severity"], string> = {
  P1: "var(--sev-p1)",
  P2: "var(--sev-p2)",
  P3: "var(--sev-p3)",
  P4: "var(--sev-p4)",
};

export function SeverityBadge({ severity }: { severity: ClusterSummary["severity"] }) {
  return (
    <span
      className="severity-badge"
      style={{ backgroundColor: SEVERITY_COLORS[severity] }}
    >
      {severity}
    </span>
  );
}
