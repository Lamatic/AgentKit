import { Wrench, AlertTriangle, ListChecks, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { ConfidenceMeter } from "./ConfidenceMeter";
import type { RootCauseReport as RootCauseReportType } from "../lib/contracts";

export interface RootCauseReportProps {
  report: RootCauseReportType;
  className?: string;
}

/** Terminal panel of the investigation timeline: synthesized root cause + fix. */
export function RootCauseReport({ report, className }: RootCauseReportProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-4 text-muted-foreground" />
          Root cause
        </CardTitle>
        <CardDescription>Synthesized from the confirmed investigation steps</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-base font-medium leading-relaxed text-foreground">{report.rootCause}</p>

        <ConfidenceMeter value={report.confidence} label="Report confidence" />

        {report.evidence.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ListChecks className="size-3.5" />
              Evidence
            </div>
            <ul className="space-y-1.5">
              {report.evidence.map((e, i) => (
                <li
                  key={i}
                  className="rounded-md border border-border bg-muted/30 p-2.5 text-sm leading-relaxed"
                >
                  <span className="mr-1.5 font-mono text-xs text-muted-foreground">
                    [{e.hypothesisId}/{e.queryId}]
                  </span>
                  {e.finding}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Wrench className="size-3.5" />
            Suggested fix
          </div>
          <p className="rounded-md border border-success/30 bg-success/10 p-3 text-sm leading-relaxed">
            {report.suggestedFix}
          </p>
        </div>

        {report.caveats.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <AlertTriangle className="size-3.5" />
              Caveats
            </div>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {report.caveats.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
