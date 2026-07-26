export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type TreatmentLane =
  | "IMMEDIATE_ESCALATION"
  | "MANAGER_REVIEW"
  | "DISPUTE_RESOLUTION"
  | "COLLECTOR_FOLLOW_UP"
  | "STANDARD_REMINDER"
  | "MONITOR";

export type PromiseToPayStatus = "NONE" | "ACTIVE" | "BROKEN" | "KEPT";

export interface Customer {
  customerId: string;
  customerName: string;
  totalOutstanding: number;
  totalOverdue: number;
  oldestDaysOverdue: number;
  overdueInvoiceCount: number;
  lastContactDaysAgo: number;
  brokenPromiseCount: number;
  promiseToPayStatus: PromiseToPayStatus;
  hasActiveDispute: boolean;
  disputeAmount: number;
  isStrategicCustomer: boolean;
  collectorNotes: string;
  industry: string;
  preferredChannel: "EMAIL" | "PHONE";
}

export interface RankedCustomer extends Customer {
  rank: number;
  priorityScore: number;
  riskLevel: RiskLevel;
  treatmentLane: TreatmentLane;
  priorityExplanation: string;
  approvalRequired: boolean;
}
