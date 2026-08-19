import { ShieldAlert, ShieldCheck, Terminal, Gauge, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { StatusBadge } from "./StatusBadge";
import { ResultsTable } from "./ResultsTable";
import { StatsStrip } from "./StatsStrip";
import type { InvestigationStep } from "../lib/contracts";

export interface StepPanelProps {
  step: InvestigationStep;
  /** 1-based index for display, e.g. "Step 2" */
  index?: number;
  className?: string;
}

/**
 * One InvestigationStep: hypothesis being tested, the generated DiagnosticQuery,
 * the deterministic QueryGuard result (blocks execution + shows the read-only/cost
 * guard state when it fails, or a small "LIMIT injected" note when it rewrote the
 * query), the compacted result (sample rows + stats strip — never the raw
 * execution rows, mirroring what the analyst model actually saw), and the
 * analyst's verdict + reasoning.
 */
export function StepPanel({ step, index, className }: StepPanelProps) {
  const { hypothesis, query, guard, execution, compact, analysis } = step;
  const blocked = !guard.ok;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-balance">
            {index !== undefined && (
              <span className="text-muted-foreground">Step {index}</span>
            )}
            {hypothesis.title}
          </CardTitle>
          {analysis ? (
            <StatusBadge status={analysis.verdict} />
          ) : (
            <StatusBadge status="open" />
          )}
        </div>
        <CardDescription>{query.purpose}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Terminal className="size-3.5" />
            Diagnostic query
            <Badge variant="outline" className="ml-auto font-mono">
              {query.engine}
            </Badge>
          </div>
          <pre className="max-w-full overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
            <code>{guard.normalizedSql ?? query.sql}</code>
          </pre>
          {guard.ok && guard.rewritten && (
            <div className="flex items-center gap-1.5 text-xs text-warning">
              <ShieldCheck className="size-3.5 shrink-0" />
              LIMIT injected by the query guard before execution
            </div>
          )}
        </div>

        {blocked ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Blocked by read-only/cost guard</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs opacity-90">
                {guard.violations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <>
            {compact && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Gauge className="size-3.5" />
                  Compacted results
                  <span className="ml-auto font-mono">
                    {compact.runtimeMs}ms
                    {compact.bytesScanned ? ` · ${formatBytes(compact.bytesScanned)}` : ""}
                  </span>
                </div>
                {compact.error ? (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {compact.error}
                  </p>
                ) : (
                  <>
                    <StatsStrip stats={compact.stats} rowCount={compact.rowCount} />
                    <ResultsTable
                      columns={compact.columns}
                      rows={compact.sampleRows}
                      truncated={compact.truncated}
                    />
                  </>
                )}
              </div>
            )}

            {!compact && execution?.error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {execution.error}
              </p>
            )}

            {analysis && (
              <div className="space-y-1.5 rounded-md border border-border p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  Verdict
                  <StatusBadge status={analysis.verdict} />
                  {analysis.hint && (
                    <span className="ml-auto inline-flex items-center gap-1">
                      <ArrowRight className="size-3.5" />
                      {analysis.hint.replace("-", " ")}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed">{analysis.reasoning}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)}${units[unit]}`;
}
