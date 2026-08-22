"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import type {
  ConfidenceLevel,
  MigrationPipelineResult,
  ReleaseStatus,
  RiskLevel,
  StrategyType,
} from "@/types/migrationPipeline";
import DeploymentStrategyTab from "@/components/results/DeploymentStrategyTab";
import IntentScopeTab from "@/components/results/IntentScopeTab";
import ReleaseRollbackTab from "@/components/results/ReleaseRollbackTab";
import ResultSummary from "@/components/results/ResultSummary";
import RiskAnalysisTab from "@/components/results/RiskAnalysisTab";

type ResultsDashboardProps = {
  result: MigrationPipelineResult | null;
};

type ResultTab = "intent" | "risk" | "strategy" | "release";

const tabs: Array<{ id: ResultTab; label: string }> = [
  { id: "intent", label: "Intent & Scope" },
  { id: "risk", label: "Lock & Risk Analysis" },
  { id: "strategy", label: "Deployment Strategy" },
  { id: "release", label: "Release & Rollback" },
];

const riskToneMap: Record<RiskLevel, "gray" | "green" | "amber" | "red"> = {
  LOW: "green",
  MEDIUM: "amber",
  HIGH: "red",
  UNKNOWN: "gray",
};

const statusToneMap: Record<ReleaseStatus, "green" | "amber" | "red"> = {
  APPROVE: "green",
  APPROVE_WITH_CAUTION: "amber",
  REJECT: "red",
};

const confidenceToneMap: Record<ConfidenceLevel, "gray" | "green" | "amber"> = {
  LOW: "gray",
  MEDIUM: "amber",
  HIGH: "green",
};

const strategyToneMap: Record<StrategyType, "green" | "amber" | "red"> = {
  DIRECT_MIGRATION: "green",
  ONLINE_MIGRATION: "green",
  PHASED_ROLLOUT: "amber",
  EXPAND_CONTRACT: "amber",
};

function EmptyState() {
  return (
    <section className="panel-strong mt-6 overflow-hidden rounded-[22px] border border-slate-200/90">
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
        <h2 className="text-[1.15rem] font-bold tracking-[-0.03em] text-slate-950">
          Migration Safety Report
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Operational risk, deployment strategy, and release readiness for the analyzed migration.
        </p>
      </div>

      <div className="flex min-h-[200px] flex-col items-center justify-center px-6 py-10 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
          <FileText className="h-4 w-4" />
        </div>
        <p className="mt-5 text-sm font-semibold text-slate-900">
          No migration analysis available
        </p>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Run the pipeline to generate a release safety report.
        </p>
      </div>
    </section>
  );
}

export default function ResultsDashboard({ result }: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<ResultTab>("intent");

  if (!result) {
    return <EmptyState />;
  }

  const releaseStatus = result.release_plan.release_decision.status;
  const confidence = result.release_plan.release_decision.confidence;
  const rollbackPossible = result.release_plan.rollback_strategy.rollback_possible;

  return (
    <section className="panel-strong mt-6 overflow-hidden rounded-[22px] border border-slate-200/90">
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
        <h2 className="text-[1.15rem] font-bold tracking-[-0.03em] text-slate-950">
          Migration Safety Report
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Operational risk, deployment strategy, and release readiness for the analyzed migration.
        </p>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        <ResultSummary
          deploymentStrategy={result.deployment_strategy.strategy}
          releaseStatus={releaseStatus}
          releaseTone={statusToneMap[releaseStatus]}
          rollbackAvailable={rollbackPossible}
          rollbackTone={rollbackPossible ? "green" : "red"}
          riskLevel={result.behavior_analysis.production_risk}
          riskTone={riskToneMap[result.behavior_analysis.production_risk]}
        />

        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                className={[
                  "rounded-lg border px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                ].join(" ")}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "intent" ? (
          <IntentScopeTab
            dataLossPotential={result.data_loss_potential}
            destructive={result.is_destructive}
            explanation={result.explanation}
            operations={result.operations}
            targetColumns={result.target_columns}
            targetTables={result.target_table}
          />
        ) : null}

        {activeTab === "risk" ? (
          <RiskAnalysisTab
            blockingRisk={result.behavior_analysis.blocking_risk}
            lockType={result.behavior_analysis.lock_type}
            productionRisk={result.behavior_analysis.production_risk}
            reasoning={result.behavior_analysis.reasoning}
            tableRewrite={result.behavior_analysis.table_rewrite}
            toneMap={riskToneMap}
          />
        ) : null}

        {activeTab === "strategy" ? (
          <DeploymentStrategyTab
            deploymentOrder={result.deployment_strategy.deployment_order}
            estimatedDowntime={result.deployment_strategy.estimated_downtime}
            maintenanceWindowRequired={result.deployment_strategy.maintenance_window_required}
            recommendation={result.deployment_strategy.recommendation}
            strategy={result.deployment_strategy.strategy}
            strategyTone={strategyToneMap[result.deployment_strategy.strategy]}
            toneMap={riskToneMap}
          />
        ) : null}

        {activeTab === "release" ? (
          <ReleaseRollbackTab
            confidence={confidence}
            confidenceTone={confidenceToneMap[confidence]}
            releaseStatus={releaseStatus}
            releaseTone={statusToneMap[releaseStatus]}
            rollbackOrder={result.release_plan.rollback_strategy.rollback_order}
            rollbackPossible={rollbackPossible}
            rollbackWarning={result.release_plan.rollback_strategy.rollback_warning}
          />
        ) : null}
      </div>
    </section>
  );
}
