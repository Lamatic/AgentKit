"use client";

import { useState } from "react";

import type {
  CustomerStrategyResult,
  PortfolioIntelligenceResult,
} from "@/app/actions/orchestrate";
import {
  analyzePortfolio,
  generateCustomerStrategy,
} from "@/app/actions/orchestrate";
import { Header } from "@/app/components/layout/app-header";
import { PortfolioView } from "@/app/components/portfolio/portfolio-view";
import type { ApprovalStatus } from "@/app/components/strategy/approval-card";
import { StrategyView } from "@/app/components/strategy/strategy-view";
import { demoPortfolio } from "@/app/data/demoPortfolio";
import type { RecordedOutcome } from "@/app/lib/outcomes";
import type { Customer, RankedCustomer } from "@/app/lib/types";

interface CustomerCaseState {
  strategy: CustomerStrategyResult;
  approvalStatus: ApprovalStatus;
  rejectionReason: string;
  recordedOutcomes: RecordedOutcome[];
}

export default function HomePage() {
  const [rankedCustomers, setRankedCustomers] = useState<RankedCustomer[]>([]);
  const [portfolioResult, setPortfolioResult] =
    useState<PortfolioIntelligenceResult | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const [customerCases, setCustomerCases] = useState<
    Record<string, CustomerCaseState>
  >({});

  const [isPortfolioLoading, setIsPortfolioLoading] = useState(false);
  const [isStrategyLoading, setIsStrategyLoading] = useState(false);

  const [portfolioError, setPortfolioError] = useState("");
  const [strategyError, setStrategyError] = useState("");

  const hasAnalyzedPortfolio = rankedCustomers.length > 0;

  const selectedCase = selectedCustomer
    ? (customerCases[selectedCustomer.customerId] ?? null)
    : null;

  const handleAnalyzePortfolio = async () => {
    setIsPortfolioLoading(true);
    setPortfolioError("");
    setPortfolioResult(null);
    setRankedCustomers([]);

    const response = await analyzePortfolio(demoPortfolio);

    if (!response.success) {
      setPortfolioError(response.error);
      setIsPortfolioLoading(false);
      return;
    }

    const mappedCustomers = response.data.ranked_queue
      .map((rankedItem) => {
        const sourceCustomer = demoPortfolio.find(
          (customer) => customer.customerId === rankedItem.customer_id,
        );

        if (!sourceCustomer) {
          return null;
        }

        const rankedCustomer: RankedCustomer = {
          ...sourceCustomer,
          rank: rankedItem.rank,
          priorityScore: rankedItem.priority_score,
          riskLevel: rankedItem.risk_level,
          treatmentLane: rankedItem.treatment_lane,
          priorityExplanation: rankedItem.priority_explanation,
          approvalRequired: rankedItem.approval_required,
        };

        return rankedCustomer;
      })
      .filter((customer): customer is RankedCustomer => customer !== null)
      .sort((a, b) => a.rank - b.rank);

    setPortfolioResult(response.data);
    setRankedCustomers(mappedCustomers);
    setIsPortfolioLoading(false);
  };

  const handleGenerateStrategy = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setStrategyError("");

    const existingCase = customerCases[customer.customerId];

    if (existingCase) {
      setIsStrategyLoading(false);
      return;
    }

    setIsStrategyLoading(true);

    const response = await generateCustomerStrategy(customer);

    if (!response.success) {
      setStrategyError(response.error);
      setIsStrategyLoading(false);
      return;
    }

    setCustomerCases((currentCases) => ({
      ...currentCases,
      [customer.customerId]: {
        strategy: response.data,
        approvalStatus: response.data.approval_required
          ? "PENDING"
          : "NOT_REQUIRED",
        rejectionReason: "",
        recordedOutcomes: [],
      },
    }));

    setIsStrategyLoading(false);
  };

  const handleApproveStrategy = () => {
    if (!selectedCustomer) return;

    setCustomerCases((currentCases) => {
      const currentCase = currentCases[selectedCustomer.customerId];

      if (!currentCase) {
        return currentCases;
      }

      return {
        ...currentCases,
        [selectedCustomer.customerId]: {
          ...currentCase,
          approvalStatus: "APPROVED",
        },
      };
    });
  };

  const handleRejectStrategy = (reason: string) => {
    if (!selectedCustomer) return;

    setCustomerCases((currentCases) => {
      const currentCase = currentCases[selectedCustomer.customerId];

      if (!currentCase) {
        return currentCases;
      }

      return {
        ...currentCases,
        [selectedCustomer.customerId]: {
          ...currentCase,
          approvalStatus: "REJECTED",
          rejectionReason: reason,
        },
      };
    });
  };

  const handleOutcomeRecorded = (outcome: RecordedOutcome) => {
    if (!selectedCustomer) return;

    setCustomerCases((currentCases) => {
      const currentCase = currentCases[selectedCustomer.customerId];

      if (!currentCase) {
        return currentCases;
      }

      return {
        ...currentCases,
        [selectedCustomer.customerId]: {
          ...currentCase,
          recordedOutcomes: [...currentCase.recordedOutcomes, outcome],
        },
      };
    });
  };

  const handleBack = () => {
    setSelectedCustomer(null);
    setStrategyError("");
    setIsStrategyLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-foreground dark:from-gray-950 dark:to-gray-900">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-10">
        {!selectedCustomer ? (
          <PortfolioView
            customers={hasAnalyzedPortfolio ? rankedCustomers : demoPortfolio}
            portfolioSummary={portfolioResult?.portfolio_summary ?? null}
            isLoading={isPortfolioLoading}
            error={portfolioError}
            hasAnalyzedPortfolio={hasAnalyzedPortfolio}
            onAnalyzePortfolio={handleAnalyzePortfolio}
            onGenerateStrategy={handleGenerateStrategy}
          />
        ) : (
          <StrategyView
            customer={selectedCustomer}
            strategy={selectedCase?.strategy ?? null}
            isLoading={isStrategyLoading}
            error={strategyError}
            approvalStatus={selectedCase?.approvalStatus ?? "NOT_REQUIRED"}
            rejectionReason={selectedCase?.rejectionReason ?? ""}
            recordedOutcomes={selectedCase?.recordedOutcomes ?? []}
            onApproveStrategy={handleApproveStrategy}
            onRejectStrategy={handleRejectStrategy}
            onOutcomeRecorded={handleOutcomeRecorded}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
}
