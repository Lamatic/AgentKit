export type CollectionOutcome =
  | "CONTACTED"
  | "PROMISE_TO_PAY"
  | "DISPUTE_RAISED"
  | "NO_RESPONSE"
  | "PAYMENT_RECEIVED";

export interface RecordedOutcome {
  id: string;
  outcome: CollectionOutcome;
  label: string;
  note: string;
  promiseDate?: string;
  createdAt: string;
}

export const OUTCOME_OPTIONS: Array<{
  value: CollectionOutcome;
  label: string;
  description: string;
}> = [
  {
    value: "CONTACTED",
    label: "Contacted customer",
    description: "The collector successfully reached the customer.",
  },
  {
    value: "PROMISE_TO_PAY",
    label: "Promise to pay received",
    description: "The customer committed to a future payment date.",
  },
  {
    value: "DISPUTE_RAISED",
    label: "Dispute raised",
    description: "The customer raised an invoice or account dispute.",
  },
  {
    value: "NO_RESPONSE",
    label: "No response",
    description: "The collector attempted outreach but received no response.",
  },
  {
    value: "PAYMENT_RECEIVED",
    label: "Payment received",
    description: "The overdue balance was paid or materially resolved.",
  },
];

export function getOutcomeLabel(outcome: CollectionOutcome): string {
  return (
    OUTCOME_OPTIONS.find((option) => option.value === outcome)?.label ?? outcome
  );
}
