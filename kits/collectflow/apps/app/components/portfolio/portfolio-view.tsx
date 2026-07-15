"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  Loader2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import type { PortfolioSummary } from "@/app/actions/orchestrate";
import type { Customer, RankedCustomer } from "@/app/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PortfolioViewProps {
  customers: Array<Customer | RankedCustomer>;
  portfolioSummary: PortfolioSummary | null;
  isLoading: boolean;
  error: string;
  hasAnalyzedPortfolio: boolean;
  onAnalyzePortfolio: () => void;
  onGenerateStrategy: (customer: Customer) => void;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * Type guard that determines whether a customer includes
 * AI-generated portfolio ranking information.
 */
function isRankedCustomer(
  customer: Customer | RankedCustomer,
): customer is RankedCustomer {
  return (
    "rank" in customer &&
    "priorityScore" in customer &&
    "riskLevel" in customer &&
    "treatmentLane" in customer &&
    "priorityExplanation" in customer
  );
}

/**
 * Converts a treatment lane identifier into a human-readable label.
 * Example: "MANAGER_REVIEW" -> "Manager Review".
 */
function formatTreatmentLane(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Maps portfolio risk levels to the corresponding badge variant.
 */
function getRiskVariant(
  risk: string,
): "destructive" | "default" | "secondary" | "outline" {
  if (risk === "CRITICAL") return "destructive";
  if (risk === "HIGH") return "default";
  if (risk === "MEDIUM") return "secondary";
  return "outline";
}

export function PortfolioView({
  customers,
  portfolioSummary,
  isLoading,
  error,
  hasAnalyzedPortfolio,
  onAnalyzePortfolio,
  onGenerateStrategy,
}: PortfolioViewProps) {
  const rankedCustomers = customers
    .filter(isRankedCustomer)
    .sort((firstCustomer, secondCustomer) => {
      return firstCustomer.rank - secondCustomer.rank;
    });

  const hasRankingResults = rankedCustomers.length > 0;
  const showRankedResults = hasAnalyzedPortfolio && hasRankingResults;

  const fallbackTotalOverdue = customers.reduce(
    (total, customer) => total + customer.totalOverdue,
    0,
  );

  const brokenPromises = customers.filter(
    (customer) => customer.brokenPromiseCount > 0,
  ).length;

  const activeDisputes = customers.filter(
    (customer) => customer.hasActiveDispute,
  ).length;

  const customerCount =
    portfolioSummary?.customers_analyzed ?? customers.length;

  const totalOverdue = portfolioSummary?.total_overdue ?? fallbackTotalOverdue;

  return (
    <div className="pt-10">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <Badge
          variant="outline"
          className="mb-5 rounded-full border-slate-300/70 bg-white/60 px-4 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
        >
          AI-native Accounts Receivable intelligence
        </Badge>

        <h1 className="text-balance text-5xl font-medium tracking-tight sm:text-6xl">
          Know who to collect from
          <span className="block text-muted-foreground">
            and what to do next.
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          CollectFlow analyzes portfolio risk, payment behavior, disputes and
          collection history to create an explainable collector worklist.
        </p>
      </div>

      <Card className="overflow-hidden border-white/60 bg-white/85 p-0 shadow-2xl shadow-slate-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/85 dark:shadow-black/20">
        <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 dark:from-slate-900 dark:to-gray-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-white shadow-sm dark:bg-gray-950">
                <Database className="size-5 text-muted-foreground" />
              </div>

              <div>
                <p className="font-semibold">
                  Synchronized Accounts Receivable Portfolio
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Demo accounting data synchronized for intelligent collections
                  analysis.
                </p>
              </div>
            </div>

            <Badge
              variant="secondary"
              className="w-fit gap-1.5 rounded-full px-3 py-1 text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2 className="size-3.5" />
              Successfully synchronized
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 border-y bg-muted/10 px-8 py-6 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem label="Customers" value={String(customerCount)} />

          <SummaryItem
            label="Total overdue"
            value={currencyFormatter.format(totalOverdue)}
          />

          <SummaryItem label="Broken promises" value={String(brokenPromises)} />

          <SummaryItem label="Active disputes" value={String(activeDisputes)} />
        </div>

        <div className="px-8 py-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {showRankedResults
                  ? "AI collector queue"
                  : "Customer Portfolio"}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {showRankedResults
                  ? "Customers ranked by urgency, risk and recommended treatment"
                  : "Review the synced customers, then run AI analysis to generate the prioritized collector queue."}
              </p>
            </div>

            {!hasAnalyzedPortfolio && (
              <Button
                onClick={onAnalyzePortfolio}
                disabled={isLoading}
                className="w-fit gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Analyzing portfolio
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Analyze Portfolio
                  </>
                )}
              </Button>
            )}

            {showRankedResults && (
              <Badge variant="outline" className="w-fit rounded-full">
                {rankedCustomers.length}{" "}
                {rankedCustomers.length === 1 ? "account" : "accounts"} analyzed
              </Badge>
            )}
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />

              <div>
                <p className="font-medium">
                  Portfolio analysis could not be completed.
                </p>

                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {!hasAnalyzedPortfolio && (
            <div className="space-y-4">
              {customers.map((customer) => (
                <div
                  key={customer.customerId}
                  className="rounded-2xl border bg-background/80 p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700"
                >
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_150px_130px_150px] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{customer.customerName}</p>

                        {customer.isStrategicCustomer && (
                          <Badge variant="outline" className="rounded-full">
                            <ShieldAlert className="mr-1 size-3" />
                            Strategic
                          </Badge>
                        )}

                        {customer.hasActiveDispute && (
                          <Badge variant="secondary" className="rounded-full">
                            Active dispute
                          </Badge>
                        )}

                        {customer.brokenPromiseCount > 0 && (
                          <Badge variant="destructive" className="rounded-full">
                            {customer.brokenPromiseCount} broken{" "}
                            {customer.brokenPromiseCount === 1
                              ? "promise"
                              : "promises"}
                          </Badge>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {customer.customerId} · {customer.industry}
                      </p>

                      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                        {customer.collectorNotes}
                      </p>
                    </div>

                    <MetricCell
                      label="Overdue"
                      value={currencyFormatter.format(customer.totalOverdue)}
                    />

                    <MetricCell
                      label="Oldest"
                      value={`${customer.oldestDaysOverdue} days`}
                    />

                    <MetricCell
                      label="Last contact"
                      value={`${customer.lastContactDaysAgo} days ago`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {showRankedResults && (
            <div className="space-y-4">
              {rankedCustomers.map((customer) => (
                <div
                  key={customer.customerId}
                  className="group rounded-2xl border bg-background/80 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700"
                >
                  <div className="grid gap-5 lg:grid-cols-[48px_minmax(0,1.5fr)_140px_110px_180px] lg:items-center">
                    <div className="flex size-11 items-center justify-center rounded-full border bg-muted/40 text-sm font-semibold">
                      {customer.rank}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">
                          {customer.customerName}
                        </p>

                        <Badge
                          variant={getRiskVariant(customer.riskLevel)}
                          className="rounded-full"
                        >
                          {customer.riskLevel}
                        </Badge>

                        {customer.isStrategicCustomer && (
                          <Badge variant="outline" className="rounded-full">
                            <ShieldAlert className="mr-1 size-3" />
                            Strategic
                          </Badge>
                        )}

                        {customer.approvalRequired && (
                          <Badge variant="secondary" className="rounded-full">
                            Approval required
                          </Badge>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {customer.customerId} ·{" "}
                        {currencyFormatter.format(customer.totalOverdue)}{" "}
                        overdue · {customer.oldestDaysOverdue} days oldest
                      </p>

                      <p className="mt-3 text-sm font-medium">
                        {formatTreatmentLane(customer.treatmentLane)}
                      </p>

                      <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                        {customer.priorityExplanation}
                      </p>
                    </div>

                    <MetricCell
                      label="Overdue"
                      value={currencyFormatter.format(customer.totalOverdue)}
                    />

                    <MetricCell
                      label="Score"
                      value={String(customer.priorityScore)}
                      emphasize
                    />

                    <Button
                      onClick={() => onGenerateStrategy(customer)}
                      className="w-full gap-2 lg:w-auto"
                    >
                      Generate Strategy
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasAnalyzedPortfolio && !hasRankingResults && (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
              <p className="font-medium">No ranked customers were returned.</p>

              <p className="mt-2 text-sm text-muted-foreground">
                The portfolio analysis completed without usable ranking results.
                Please run the analysis again.
              </p>

              <Button
                onClick={onAnalyzePortfolio}
                disabled={isLoading}
                variant="outline"
                className="mt-5 gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Analyzing portfolio
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Retry Analysis
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>

      <section id="how-it-works" className="scroll-mt-24 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            How CollectFlow works
          </h2>

          <p className="mt-2 text-muted-foreground">
            From synchronized receivables data to an actionable collection
            strategy.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              number: "01",
              title: "Analyze the portfolio",
              description:
                "CollectFlow evaluates balances, ageing, disputes, contact history and broken promises.",
            },
            {
              number: "02",
              title: "Prioritize customers",
              description:
                "The Lamatic portfolio intelligence workflow generates an explainable ranked queue.",
            },
            {
              number: "03",
              title: "Generate strategy",
              description:
                "The customer strategy workflow recommends the next action, controls and draft outreach.",
            },
          ].map((step) => (
            <Card
              key={step.number}
              className="border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-gray-900/70"
            >
              <p className="text-sm font-semibold text-primary">
                {step.number}
              </p>

              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
/**
 * Displays a portfolio summary metric.
 */
function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/80 p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

/**
 * Displays an individual portfolio metric value.
 */
function MetricCell({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p
        className={
          emphasize
            ? "mt-1 text-3xl font-semibold tracking-tight"
            : "mt-1 text-lg font-semibold"
        }
      >
        {value}
      </p>
    </div>
  );
}
