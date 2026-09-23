import type { AssessedChange, Risk } from "../lib/types";

const RISK_COLOR: Record<Risk, string> = {
  critical: "var(--block)",
  high: "var(--risk-high)",
  medium: "var(--approve)",
  low: "var(--allow)",
  unclassified: "var(--muted)",
};

const ORDER: Risk[] = ["critical", "high", "medium", "unclassified", "low"];

export function ChangeTable({ changes }: { changes: AssessedChange[] }) {
  const sorted = [...changes].sort((a, b) => ORDER.indexOf(a.risk) - ORDER.indexOf(b.risk));
  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--panel)" }}>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase" style={{ color: "var(--muted)" }}>
          <tr>
            <th className="px-4 py-2">Risk</th>
            <th className="px-4 py-2">Resource</th>
            <th className="px-4 py-2">Action</th>
            <th className="px-4 py-2">Flags</th>
            <th className="px-4 py-2">Assessment</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.address} className="border-t align-top" style={{ borderColor: "var(--border)" }}>
              <td className="px-4 py-3">
                <span
                  className="rounded px-2 py-0.5 text-xs font-semibold"
                  style={{ color: RISK_COLOR[c.risk], border: `1px solid ${RISK_COLOR[c.risk]}` }}
                >
                  {c.risk}
                </span>
                {c.confidence !== null && (
                  <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                    conf {Math.round(c.confidence * 100)}%
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <code className="text-xs">{c.address}</code>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  {c.type}
                </div>
              </td>
              <td className="px-4 py-3 text-xs">
                {c.actions.join(" → ")}
                {c.actionReason && <div style={{ color: "var(--muted)" }}>{c.actionReason.replaceAll("_", " ")}</div>}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {c.flags.map((f) => (
                    <span
                      key={f}
                      className="rounded px-1.5 py-0.5 text-xs"
                      style={{ background: "var(--surface-deep)", border: "1px solid var(--border)" }}
                    >
                      {f}
                    </span>
                  ))}
                  {c.policyIds.map((p) => (
                    <span
                      key={p}
                      className="rounded px-1.5 py-0.5 text-xs font-medium"
                      style={{ border: "1px solid var(--approve)", color: "var(--approve)" }}
                    >
                      {p}
                    </span>
                  ))}
                  {c.policyFloor && (
                    <span className="text-xs" style={{ color: "var(--muted)" }} title="The policy's minimum_risk overrode the model's rating">
                      raised to {c.risk} by {c.policyFloor}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-xs">
                {c.reason ?? (
                  <span style={{ color: "var(--muted)" }}>
                    The classifier returned no assessment for this change; it counts as unknown risk.
                  </span>
                )}
                {c.mitigation && c.mitigation.toLowerCase() !== "none needed" && (
                  <div className="mt-1" style={{ color: "var(--muted)" }}>
                    Fix: {c.mitigation}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
