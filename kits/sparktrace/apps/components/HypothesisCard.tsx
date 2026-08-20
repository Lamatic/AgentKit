import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { StatusBadge } from "./StatusBadge";
import { ConfidenceMeter } from "./ConfidenceMeter";
import type { Hypothesis } from "../lib/contracts";

export interface HypothesisCardProps {
  hypothesis: Hypothesis;
  className?: string;
}

/** One card per Hypothesis — used in the plan list before/alongside step panels. */
export function HypothesisCard({ hypothesis, className }: HypothesisCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-balance">{hypothesis.title}</CardTitle>
          <StatusBadge status={hypothesis.status} />
        </div>
        <Badge variant="outline" className="w-fit font-mono">
          {hypothesis.category}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{hypothesis.rationale}</p>
        <ConfidenceMeter value={hypothesis.confidence} label="Prior confidence" />
      </CardContent>
    </Card>
  );
}
