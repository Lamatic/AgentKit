import { CheckCircle2, Database } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataSourceCardProps {
  customerCount: number;
}

export function DataSourceCard({ customerCount }: DataSourceCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Connected data source</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Synthetic accounting data used for the AgentKit demo
          </p>
        </div>

        <Badge
          variant="secondary"
          className="gap-1.5 text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle2 className="size-3.5" />
          Synced
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
          <div className="flex size-11 items-center justify-center rounded-lg border bg-background">
            <Database className="size-5 text-muted-foreground" />
          </div>

          <div className="flex-1">
            <p className="font-medium">Demo QuickBooks Dataset</p>
            <p className="text-sm text-muted-foreground">
              {customerCount} customers imported · Last synced just now
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
