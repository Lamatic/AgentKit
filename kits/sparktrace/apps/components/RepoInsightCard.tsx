import { FileSearch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { RepoInsight } from "../lib/contracts";

export interface RepoInsightCardProps {
  insight: RepoInsight;
  className?: string;
}

/** One RepoInsight — the Sonnet repo-reader's finding for a planner-chosen focus area. */
export function RepoInsightCard({ insight, className }: RepoInsightCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileSearch className="size-4 text-info" />
          <span className="font-mono text-xs font-normal text-muted-foreground">read_repo</span>
          <span className="text-balance">{insight.focus}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-foreground">{insight.insight}</p>
      </CardContent>
    </Card>
  );
}
