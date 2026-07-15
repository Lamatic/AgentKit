"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import type { CustomerStrategyResult } from "@/app/actions/orchestrate";
import {
  ApprovalCard,
  type ApprovalStatus,
} from "@/app/components/strategy/approval-card";
import { OutcomeCard } from "@/app/components/strategy/outcome-card";
import type { RecordedOutcome } from "@/app/lib/outcomes";
import type { Customer } from "@/app/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface StrategyViewProps {
  customer: Customer;
  strategy: CustomerStrategyResult | null;
  isLoading: boolean;
  error: string;

  approvalStatus: ApprovalStatus;
  rejectionReason: string;
  recordedOutcomes: RecordedOutcome[];

  onApproveStrategy: () => void;
  onRejectStrategy: (reason: string) => void;
  onOutcomeRecorded: (outcome: RecordedOutcome) => void;
  onBack: () => void;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * Converts enum-style values into human-readable labels.
 * Example: "PHONE_AND_EMAIL" -> "Phone And Email".
 */
function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Displays the AI-generated customer collection strategy,
 * approval workflow, outreach draft, execution outcomes,
 * and collection journey for the selected customer.
 */
export function StrategyView({
  customer,
  strategy,
  isLoading,
  error,
  approvalStatus,
  rejectionReason,
  recordedOutcomes,
  onApproveStrategy,
  onRejectStrategy,
  onOutcomeRecorded,
  onBack,
}: StrategyViewProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const handleCopy = async () => {
    if (!strategy) return;

    const draft = `Subject: ${strategy.draft_subject}

${strategy.draft_message}`;

    setCopyError("");

    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
      setCopyError("The draft could not be copied. Please copy it manually.");
    }
  };

  const canExecuteStrategy =
    !strategy?.approval_required || approvalStatus === "APPROVED";

  const latestOutcome = recordedOutcomes.at(-1);

  const isCollectionComplete = latestOutcome?.outcome === "PAYMENT_RECEIVED";

  return (
    <div className="pt-10">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <Badge
          variant="outline"
          className="mb-5 rounded-full border-slate-300/70 bg-white/60 px-4 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
        >
          AI-generated collection strategy
        </Badge>

        <h1 className="text-balance text-4xl font-medium tracking-tight sm:text-5xl">
          Turn portfolio intelligence
          <span className="block text-muted-foreground">
            into the next best action.
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          Review the recommended action, approval controls and outreach for{" "}
          {customer.customerName}.
        </p>
      </div>

      <Card className="overflow-hidden border-white/60 bg-white/85 p-0 shadow-2xl shadow-slate-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/85 dark:shadow-black/20">
        <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 dark:from-slate-900 dark:to-gray-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {customer.customerId} · {customer.industry}
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                {customer.customerName}
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                {currencyFormatter.format(customer.totalOverdue)} overdue ·{" "}
                {customer.oldestDaysOverdue} days oldest ·{" "}
                {customer.overdueInvoiceCount} overdue invoices
              </p>
            </div>

            <Badge
              variant={
                customer.brokenPromiseCount > 1
                  ? "destructive"
                  : customer.hasActiveDispute
                    ? "secondary"
                    : "outline"
              }
              className="w-fit rounded-full"
            >
              {customer.hasActiveDispute
                ? "Dispute-sensitive"
                : customer.brokenPromiseCount > 1
                  ? "Critical priority"
                  : "Collection review"}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 border-y bg-muted/10 px-8 py-6 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem
            label="Overdue"
            value={currencyFormatter.format(customer.totalOverdue)}
          />

          <SummaryItem
            label="Oldest invoice"
            value={`${customer.oldestDaysOverdue} days`}
          />

          <SummaryItem
            label="Broken promises"
            value={String(customer.brokenPromiseCount)}
          />

          <SummaryItem
            label="Last contact"
            value={`${customer.lastContactDaysAgo} days ago`}
          />
        </div>

        <div className="space-y-8 px-8 py-8">
          {isLoading && (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border bg-background/70 p-10 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <Loader2 className="size-7 animate-spin text-primary" />
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                Generating collection strategy
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                CollectFlow is evaluating payment behavior, disputes, account
                risk and operational controls.
              </p>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />

              <div>
                <p className="font-medium">
                  Customer strategy could not be generated.
                </p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && strategy && (
            <>
              <section>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-primary" />

                  <h3 className="text-xl font-semibold tracking-tight">
                    Next best action
                  </h3>
                </div>

                <div className="mt-4 rounded-2xl border bg-background/80 p-6 shadow-sm">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <p className="text-xl font-semibold">
                        {strategy.next_best_action}
                      </p>

                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {strategy.action_summary}
                      </p>
                    </div>

                    <Badge
                      variant="secondary"
                      className="w-fit rounded-full px-3 py-1"
                    >
                      {formatLabel(strategy.confidence)} confidence
                    </Badge>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full">
                      {strategy.recommended_channel.includes("PHONE") ? (
                        <Phone className="mr-1 size-3" />
                      ) : (
                        <Mail className="mr-1 size-3" />
                      )}

                      {formatLabel(strategy.recommended_channel)}
                    </Badge>

                    <Badge variant="outline" className="rounded-full">
                      Follow up in {strategy.next_follow_up_days}{" "}
                      {strategy.next_follow_up_days === 1 ? "day" : "days"}
                    </Badge>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold tracking-tight">
                  Why this action
                </h3>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {strategy.reasoning.map((reason) => (
                    <ReasonCard key={reason} text={reason} />
                  ))}
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-background/80 p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      className={
                        strategy.approval_required
                          ? "size-5 text-amber-600"
                          : "size-5 text-emerald-600"
                      }
                    />

                    <h3 className="font-semibold">Approval requirement</h3>
                  </div>

                  <p className="mt-3 text-sm font-medium">
                    {strategy.approval_required
                      ? "Manager approval required"
                      : "No approval required"}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {strategy.approval_reason}
                  </p>
                </div>

                <div className="rounded-2xl border bg-background/80 p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-emerald-600" />

                    <h3 className="font-semibold">Operational controls</h3>
                  </div>

                  <ul className="mt-3 space-y-2">
                    {strategy.operational_controls.map((control) => (
                      <li
                        key={control}
                        className="flex items-start gap-2 text-sm leading-6 text-muted-foreground"
                      >
                        <Check className="mt-1 size-3.5 shrink-0 text-emerald-600" />
                        <span>{control}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {strategy.approval_required && (
                <section>
                  <ApprovalCard
                    approvalReason={strategy.approval_reason}
                    status={approvalStatus}
                    onApprove={onApproveStrategy}
                    onReject={onRejectStrategy}
                  />
                </section>
              )}

              {strategy.approval_required && approvalStatus === "REJECTED" && (
                <section className="rounded-2xl border border-red-200 bg-red-50/70 p-5 text-sm dark:border-red-900 dark:bg-red-950/30">
                  <p className="font-medium text-red-800 dark:text-red-200">
                    This strategy cannot be executed.
                  </p>

                  <p className="mt-2 text-red-700 dark:text-red-300">
                    {rejectionReason ||
                      "The manager rejected the recommendation and requested a revised strategy."}
                  </p>
                </section>
              )}

              <section>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="size-5 text-primary" />

                    <h3 className="text-xl font-semibold tracking-tight">
                      Draft outreach
                    </h3>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!canExecuteStrategy}
                    className="w-fit gap-2 bg-transparent"
                  >
                    {copied ? (
                      <>
                        <Check className="size-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" />
                        Copy draft
                      </>
                    )}
                  </Button>
                </div>

                {copyError && (
                  <p className="mt-2 text-sm text-destructive">{copyError}</p>
                )}

                <div className="mt-4 rounded-2xl border bg-muted/40 p-6">
                  <p className="text-sm font-semibold">
                    Subject: {strategy.draft_subject}
                  </p>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7">
                    {strategy.draft_message}
                  </p>
                </div>
              </section>

              {canExecuteStrategy && !isCollectionComplete && (
                <section>
                  <OutcomeCard onOutcomeRecorded={onOutcomeRecorded} />
                </section>
              )}

              <section>
                <div className="flex items-center gap-2">
                  <Clock3 className="size-5 text-primary" />

                  <h3 className="text-xl font-semibold tracking-tight">
                    Collection journey
                  </h3>
                </div>

                <div className="mt-5">
                  <JourneyStep
                    title="Portfolio prioritized"
                    description="Customer selected from the AI-ranked collector queue."
                    status="complete"
                  />

                  <JourneyStep
                    title="Strategy generated"
                    description={`${strategy.next_best_action} was recommended with ${strategy.confidence.toLowerCase()} confidence.`}
                    status="complete"
                  />

                  {strategy.approval_required && (
                    <JourneyStep
                      title={
                        approvalStatus === "APPROVED"
                          ? "Manager approved"
                          : approvalStatus === "REJECTED"
                            ? "Manager rejected"
                            : "Awaiting manager approval"
                      }
                      description={
                        approvalStatus === "APPROVED"
                          ? "The strategy is approved and ready for execution."
                          : approvalStatus === "REJECTED"
                            ? rejectionReason ||
                              "The recommendation was rejected and requires revision."
                            : strategy.approval_reason
                      }
                      status={
                        approvalStatus === "APPROVED" ? "complete" : "current"
                      }
                    />
                  )}

                  {canExecuteStrategy && recordedOutcomes.length === 0 && (
                    <>
                      <JourneyStep
                        title={formatLabel(strategy.journey_state)}
                        description={`The account is ready for the recommended ${formatLabel(
                          strategy.recommended_channel,
                        ).toLowerCase()} outreach.`}
                        status="current"
                      />

                      <JourneyStep
                        title="Follow-up checkpoint"
                        description={`Reassess the account in ${strategy.next_follow_up_days} ${
                          strategy.next_follow_up_days === 1 ? "day" : "days"
                        } based on the customer response.`}
                        status="upcoming"
                        isLast
                      />
                    </>
                  )}

                  {canExecuteStrategy && recordedOutcomes.length > 0 && (
                    <>
                      {recordedOutcomes.map((outcome) => (
                        <JourneyStep
                          key={outcome.id}
                          title={outcome.label}
                          description={getOutcomeDescription(outcome)}
                          status="complete"
                        />
                      ))}

                      <JourneyStep
                        title={getCurrentJourneyTitle(
                          recordedOutcomes[recordedOutcomes.length - 1],
                        )}
                        description={getCurrentJourneyDescription(
                          recordedOutcomes[recordedOutcomes.length - 1],
                          strategy.next_follow_up_days,
                        )}
                        status={isCollectionComplete ? "complete" : "current"}
                        isLast
                      />
                    </>
                  )}
                </div>
              </section>
            </>
          )}

          <Button
            variant="outline"
            onClick={onBack}
            className="h-12 w-full gap-2 bg-transparent"
          >
            <ArrowLeft className="size-4" />
            Back to Portfolio
          </Button>
        </div>
      </Card>
    </div>
  );
}

/**
 * Displays a summary metric for the selected customer.
 */
function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

/**
 * Renders a single AI reasoning statement explaining
 * why the recommended collection strategy was selected.
 */
function ReasonCard({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-background/70 p-4">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />

      <p className="text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

/**
 * Generates a human-readable description for a recorded
 * collection outcome displayed in the journey timeline.
 */
function getOutcomeDescription(outcome: RecordedOutcome): string {
  const note = outcome.note ? ` Note: ${outcome.note}` : "";

  if (outcome.outcome === "PROMISE_TO_PAY" && outcome.promiseDate) {
    return `Customer committed to payment by ${new Date(
      `${outcome.promiseDate}T00:00:00`,
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}.${note}`;
  }

  const descriptions: Record<RecordedOutcome["outcome"], string> = {
    CONTACTED: "The accounts team successfully reached the customer.",
    PROMISE_TO_PAY: "The customer provided a new promise to pay.",
    DISPUTE_RAISED: "The customer raised a dispute requiring internal review.",
    NO_RESPONSE: "The outreach attempt did not receive a customer response.",
    PAYMENT_RECEIVED:
      "Payment was received and the collection case was resolved.",
  };

  return `${descriptions[outcome.outcome]}${note}`;
}

/**
 * Returns the current collection journey title based on
 * the latest recorded customer outcome.
 */
function getCurrentJourneyTitle(outcome: RecordedOutcome): string {
  const titles: Record<RecordedOutcome["outcome"], string> = {
    CONTACTED: "Awaiting customer response",
    PROMISE_TO_PAY: "Monitoring payment commitment",
    DISPUTE_RAISED: "Dispute review in progress",
    NO_RESPONSE: "Follow-up required",
    PAYMENT_RECEIVED: "Collection completed",
  };

  return titles[outcome.outcome];
}

/**
 * Generates the next-step description shown in the
 * collection journey timeline after the latest outcome.
 */
function getCurrentJourneyDescription(
  outcome: RecordedOutcome,
  followUpDays: number,
): string {
  if (outcome.outcome === "PROMISE_TO_PAY" && outcome.promiseDate) {
    return `Monitor the account until the promised payment date of ${new Date(
      `${outcome.promiseDate}T00:00:00`,
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}.`;
  }

  const descriptions: Record<RecordedOutcome["outcome"], string> = {
    CONTACTED: `Review the customer response and reassess the account within ${followUpDays} days.`,
    PROMISE_TO_PAY:
      "Monitor the commitment and escalate if the payment is missed.",
    DISPUTE_RAISED:
      "Coordinate with the relevant internal team before further collection activity.",
    NO_RESPONSE: `Attempt the next approved follow-up within ${followUpDays} days.`,
    PAYMENT_RECEIVED: "No further collection action is currently required.",
  };

  return descriptions[outcome.outcome];
}

interface JourneyStepProps {
  title: string;
  description: string;
  status: "complete" | "current" | "upcoming";
  isLast?: boolean;
}

/**
 * Renders a single step in the customer collection journey
 * with complete, current, or upcoming status.
 */
function JourneyStep({
  title,
  description,
  status,
  isLast = false,
}: JourneyStepProps) {
  const isComplete = status === "complete";
  const isCurrent = status === "current";

  return (
    <div className="relative flex gap-4">
      {!isLast && (
        <div className="absolute left-[15px] top-8 h-full w-px bg-border" />
      )}

      <div
        className={`relative z-10 mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border ${
          isComplete
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950"
            : isCurrent
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground"
        }`}
      >
        {isComplete ? (
          <Check className="size-4" />
        ) : (
          <span className="size-2 rounded-full bg-current" />
        )}
      </div>

      <div className={isLast ? "pb-0" : "pb-7"}>
        <p className="font-medium">{title}</p>

        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
