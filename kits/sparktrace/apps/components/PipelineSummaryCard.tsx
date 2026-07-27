import { Database, GitBranch, FileCode2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import type { PipelineContext, TableKind } from "../lib/contracts";

export interface PipelineSummaryCardProps {
  pipeline: PipelineContext;
  className?: string;
}

const TABLE_KIND_VARIANT: Record<TableKind, "secondary" | "outline" | "default"> = {
  source: "outline",
  sink: "default",
  intermediate: "secondary",
};

/** Summarizes the ingested PipelineContext: repo, files scanned, tables, DAG size. */
export function PipelineSummaryCard({ pipeline, className }: PipelineSummaryCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="size-4 text-muted-foreground" />
          Pipeline
        </CardTitle>
        {pipeline.repoUrl && (
          <CardDescription className="font-mono text-xs">{pipeline.repoUrl}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-foreground">{pipeline.summary}</p>

        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-md border border-border p-2">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <FileCode2 className="size-3.5" />
              Files
            </div>
            <div className="mt-1 font-mono text-base font-semibold">{pipeline.files.length}</div>
          </div>
          <div className="rounded-md border border-border p-2">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Database className="size-3.5" />
              Tables
            </div>
            <div className="mt-1 font-mono text-base font-semibold">{pipeline.tables.length}</div>
          </div>
          <div className="rounded-md border border-border p-2">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <GitBranch className="size-3.5" />
              DAG nodes
            </div>
            <div className="mt-1 font-mono text-base font-semibold">{pipeline.dag.length}</div>
          </div>
        </div>

        {pipeline.tables.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {pipeline.tables.map((t) => (
              <Badge
                key={`${t.database}.${t.name}`}
                variant={TABLE_KIND_VARIANT[t.kind]}
                className="font-mono"
                title={t.location}
              >
                {t.database}.{t.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
