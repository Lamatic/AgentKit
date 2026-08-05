export type ChangeCategory =
  | "prompt"
  | "model"
  | "schema"
  | "tool"
  | "permission"
  | "node"
  | "edge"
  | "fallback"
  | "retry"
  | "branching"
  | "environment"
  | "other";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type PromotionDecision =
  | "safe_to_promote"
  | "manual_review_required"
  | "block_release";

export interface ExportedFile {
  path: string;
  content: string;
  size: number;
}

export interface ExportedWorkflow {
  name: string;
  files: ExportedFile[];
}

export interface WorkflowChange {
  changeId: string;
  category: ChangeCategory;
  component: string;
  before: unknown;
  after: unknown;
  affectedPaths: string[];
}

export interface StructuralDiff {
  changes: WorkflowChange[];
  addedFiles: string[];
  removedFiles: string[];
  modifiedFiles: string[];
  affectedPaths: string[];
  runtimeEvidence: string[];
  testsExecuted: string[];
}

export interface SemanticFinding {
  changeId: string;
  category: ChangeCategory;
  observedFact: string;
  possibleImpact: string;
  severity: RiskLevel;
  confidence: number;
  evidence: string[];
  affectedComponents: string[];
  recommendedValidation: string[];
}

export interface SemanticAnalysis {
  analysisSummary: string;
  overallImpactLevel: RiskLevel;
  requiresHumanReview: boolean;
  findings: SemanticFinding[];
  crossCuttingRisks: string[];
  assumptions: string[];
  unknowns: string[];
  recommendedNextChecks: string[];
}

export interface RiskContribution {
  ruleId: string;
  label: string;
  points: number;
  relatedChangeIds: string[];
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  decision: PromotionDecision;
  contributions: RiskContribution[];
}

export interface ReleaseBlocker {
  blockerId: string;
  relatedChangeIds: string[];
  reason: string;
  resolutionRequired: string;
}

export interface TargetedTest {
  testId: string;
  name: string;
  objective: string;
  relatedChangeIds: string[];
  testType:
    | "schema"
    | "prompt"
    | "model"
    | "integration"
    | "fallback"
    | "safety"
    | "permission"
    | "regression"
    | "performance"
    | "other";
  priority: RiskLevel;
  expectedEvidence: string;
}

export interface RollbackManifest {
  rollbackTarget: string;
  componentsToRestore: string[];
  environmentChangesToRevert: string[];
  postRollbackChecks: string[];
}

export interface ReleasePlan {
  decisionSummary: string;
  promotionDecision: PromotionDecision;
  riskScore: number;
  blockers: ReleaseBlocker[];
  targetedTests: TargetedTest[];
  deploymentChecklist: string[];
  rollbackManifest: RollbackManifest;
  releaseNotes: string[];
  assumptions: string[];
  unknowns: string[];
}

export interface ChangeGraphReport {
  baselineVersion: string;
  candidateVersion: string;
  structuralDiff: StructuralDiff;
  blastRadius: BlastRadiusAnalysis;
  semanticAnalysis: SemanticAnalysis;
  riskAssessment: RiskAssessment;
  releasePlan: ReleasePlan;
}

export interface ParsedNode {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
}

export interface ParsedEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  config: Record<string, unknown>;
}

export interface ParsedSchemaEntry {
  path: string;
  value: unknown;
}

export interface ParsedFlow {
  id: string;
  name: string;
  path: string;
  nodes: ParsedNode[];
  edges: ParsedEdge[];
  schemas: ParsedSchemaEntry[];
  raw: Record<string, unknown> | null;
}

export interface ParsedWorkflowExport {
  name: string;
  flows: ParsedFlow[];
  prompts: ExportedFile[];
  modelConfigs: ExportedFile[];
  constitutions: ExportedFile[];
  otherFiles: ExportedFile[];
  environmentReferences: string[];
  warnings: string[];
}

export type BlastImpact = "direct" | "downstream";

export interface BlastRadiusNode {
  flowId: string;
  flowName: string;
  nodeId: string;
  nodeName: string;
  impact: BlastImpact;
  distance: number;
  relatedChangeIds: string[];
  paths: string[][];
}

export interface BlastRadiusAnalysis {
  nodes: BlastRadiusNode[];
  directlyAffectedNodeIds: string[];
  indirectlyAffectedNodeIds: string[];
  affectedPaths: string[];
  warnings: string[];
}

export interface WorkflowPackageSummary {
  version: string;
  name: string;
  flowIds: string[];
  flowPaths: string[];
  promptFiles: string[];
  modelConfigFiles: string[];
  constitutionFiles: string[];
  environmentReferences: string[];
  warnings: string[];
}

export interface ChangePackageSummary {
  totalChanges: number;
  categoryCounts: Record<ChangeCategory, number>;
  addedFiles: string[];
  removedFiles: string[];
  modifiedFiles: string[];
  directlyAffectedNodes: number;
  downstreamAffectedNodes: number;
}

export interface ChangePackage {
  schemaVersion: "1.0";
  flowPurpose: string;
  baseline: WorkflowPackageSummary;
  candidate: WorkflowPackageSummary;
  summary: ChangePackageSummary;
  changes: WorkflowChange[];
  blastRadius: BlastRadiusAnalysis;
  riskAssessment: RiskAssessment;
  evidence: {
    runtimeEvidence: string[];
    testsExecuted: string[];
  };
}