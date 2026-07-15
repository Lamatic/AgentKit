import { ArrowRight, ShieldAlert } from "lucide-react";

import type { Customer, RiskLevel, TreatmentLane } from "@/app/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QueueCustomer extends Customer {
  rank: number;
  priorityScore: number;
  riskLevel: RiskLevel;
  treatmentLane: TreatmentLane;
  priorityExplanation: string;
  approvalRequired: boolean;
}

interface CollectorQueueProps {
  customers: Customer[];
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const previewRanking: Record<string, Omit<QueueCustomer, keyof Customer>> = {
  "CUST-001": {
    rank: 1,
    priorityScore: 94,
    riskLevel: "CRITICAL",
    treatmentLane: "IMMEDIATE_ESCALATION",
    priorityExplanation:
      "Severe ageing, high overdue exposure and two broken promises require immediate escalation.",
    approvalRequired: false,
  },
  "CUST-003": {
    rank: 2,
    priorityScore: 86,
    riskLevel: "HIGH",
    treatmentLane: "MANAGER_REVIEW",
    priorityExplanation:
      "A missed payment promise on a strategic account requires a controlled, manager-reviewed escalation.",
    approvalRequired: true,
  },
  "CUST-002": {
    rank: 3,
    priorityScore: 74,
    riskLevel: "HIGH",
    treatmentLane: "DISPUTE_RESOLUTION",
    priorityExplanation:
      "Large overdue exposure is partially disputed, so resolution should precede aggressive collections.",
    approvalRequired: true,
  },
  "CUST-004": {
    rank: 4,
    priorityScore: 61,
    riskLevel: "MEDIUM",
    treatmentLane: "COLLECTOR_FOLLOW_UP",
    priorityExplanation:
      "The account has received no recent follow-up and is likely recoverable through direct outreach.",
    approvalRequired: false,
  },
  "CUST-005": {
    rank: 5,
    priorityScore: 24,
    riskLevel: "LOW",
    treatmentLane: "STANDARD_REMINDER",
    priorityExplanation:
      "The balance is recently overdue with no adverse collection history.",
    approvalRequired: false,
  },
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getRiskVariant(
  riskLevel: RiskLevel,
): "destructive" | "default" | "secondary" | "outline" {
  if (riskLevel === "CRITICAL") return "destructive";
  if (riskLevel === "HIGH") return "default";
  if (riskLevel === "MEDIUM") return "secondary";
  return "outline";
}

export function CollectorQueue({ customers }: CollectorQueueProps) {
  const rankedCustomers: QueueCustomer[] = customers
    .map((customer) => ({
      ...customer,
      ...previewRanking[customer.customerId],
    }))
    .sort((a, b) => a.rank - b.rank);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>AI-ranked collector queue</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Accounts ordered by collection urgency and recommended treatment
            </p>
          </div>

          <Badge variant="outline">5 accounts analyzed</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {rankedCustomers.map((customer) => (
          <div
            key={customer.customerId}
            className="group grid gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/40 lg:grid-cols-[56px_minmax(220px,1fr)_150px_140px_minmax(260px,1.4fr)_44px] lg:items-center"
          >
            <div className="flex size-10 items-center justify-center rounded-full border bg-background font-semibold">
              {customer.rank}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{customer.customerName}</p>

                {customer.isStrategicCustomer && (
                  <Badge variant="outline">Strategic</Badge>
                )}

                {customer.approvalRequired && (
                  <Badge variant="secondary" className="gap-1">
                    <ShieldAlert className="size-3" />
                    Approval
                  </Badge>
                )}
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {customer.customerId} · {customer.industry}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Overdue
              </p>
              <p className="mt-1 font-semibold">
                {currencyFormatter.format(customer.totalOverdue)}
              </p>
              <p className="text-xs text-muted-foreground">
                {customer.oldestDaysOverdue} days oldest
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Priority
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-semibold">
                  {customer.priorityScore}
                </span>
                <Badge variant={getRiskVariant(customer.riskLevel)}>
                  {customer.riskLevel}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">
                {formatLabel(customer.treatmentLane)}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {customer.priorityExplanation}
              </p>
            </div>

            <Button
              size="icon"
              variant="ghost"
              aria-label={`Open ${customer.customerName}`}
            >
              <ArrowRight className="size-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
