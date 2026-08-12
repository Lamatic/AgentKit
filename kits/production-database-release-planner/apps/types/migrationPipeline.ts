export type ReleaseStatus = "APPROVE" | "APPROVE_WITH_CAUTION" | "REJECT";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";
export type StrategyType =
  | "DIRECT_MIGRATION"
  | "ONLINE_MIGRATION"
  | "PHASED_ROLLOUT"
  | "EXPAND_CONTRACT";

export type MigrationPipelineResult = {
  behavior_analysis: {
    blocking_risk: RiskLevel;
    lock_type: string;
    production_risk: RiskLevel;
    reasoning: string;
    table_rewrite: boolean | "UNKNOWN";
  };
  data_loss_potential: RiskLevel;
  deployment_strategy: {
    deployment_order: string[];
    estimated_downtime: RiskLevel;
    maintenance_window_required: boolean;
    recommendation: {
      best_practice: string;
      summary: string;
      why: string;
    };
    strategy: StrategyType;
  };
  explanation: string;
  is_destructive: boolean;
  operations: string[];
  release_plan: {
    release_decision: {
      confidence: ConfidenceLevel;
      status: ReleaseStatus;
    };
    rollback_strategy: {
      rollback_order: string[];
      rollback_possible: boolean;
      rollback_warning: string;
    };
  };
  target_columns: string[][];
  target_table: string[];
};