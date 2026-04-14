import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stat } from "@/types";

type Props = {
  stat: Stat;
};

export function StatCard({ stat }: Props) {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {stat.label}
        </CardTitle>
        <span className="text-muted-foreground">{stat.icon}</span>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-xl font-bold tabular-nums">{stat.value}</p>
      </CardContent>
    </Card>
  );
}
