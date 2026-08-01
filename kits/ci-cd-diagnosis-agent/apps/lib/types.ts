import { z } from "zod";

// ─── Inbound request ────────────────────────────────────────────────────────

export const DiagnoseRequestSchema = z.object({
  logContent: z
    .string()
    .min(10, "Log content is too short to diagnose.")
    .max(5_000_000, "Log content exceeds the 5 MB limit."),
  ciProvider: z.enum(["github", "gitlab"]).default("github"),
});

export type DiagnoseRequest = z.infer<typeof DiagnoseRequestSchema>;

// ─── Fix snippet ─────────────────────────────────────────────────────────────

export const FixSnippetSchema = z.object({
  description: z.string(),
  language: z.string(),
  code: z.string(),
});

export type FixSnippet = z.infer<typeof FixSnippetSchema>;

// ─── Full diagnosis response ─────────────────────────────────────────────────

export const DiagnosisSchema = z.object({
  metadata: z.object({
    job_id: z.string(),
    timestamp: z.string(),
    ci_provider: z.string(),
  }),
  classification: z.object({
    category: z.string(),
    sub_category: z.string().optional(),
    confidence_score: z.number().min(0).max(1),
  }),
  analysis: z.object({
    root_cause_summary: z.string(),
    detailed_explanation: z.string(),
    evidence_cited: z.array(z.string()),
  }),
  resolution: z.object({
    is_fix_valid: z.boolean(),
    verification_notes: z.string(),
    fixes: z.array(FixSnippetSchema),
    security_warnings: z.string().optional(),
  }),
  risk: z.object({
    level: z.enum(["Low", "Medium", "High", "Unknown"]),
    warning: z.string().optional(),
  }),
});

export type Diagnosis = z.infer<typeof DiagnosisSchema>;

// ─── API error ───────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  details?: string;
}

// ─── GitHub Repository Models ───────────────────────────────────────────────

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
  isPrivate: boolean;
  description: string | null;
  language: string | null;
  defaultBranch: string;
  stargazersCount: number;
  updatedAt: string;
  htmlUrl: string;
}

export interface GitHubRepoSelection {
  repo: GitHubRepo;
  selectedAt: string;
}

// ─── GitHub Actions Workflow & Run Models ───────────────────────────────────

export type WorkflowStatus =
  | "queued"
  | "in_progress"
  | "completed"
  | "waiting"
  | "requested"
  | "pending";

export type WorkflowConclusion =
  | "success"
  | "failure"
  | "neutral"
  | "cancelled"
  | "timed_out"
  | "action_required"
  | "skipped"
  | "stale"
  | null;

export interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  htmlUrl: string;
  badgeUrl: string;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  runNumber: number;
  event: string;
  status: WorkflowStatus;
  conclusion: WorkflowConclusion;
  workflowId: number;
  headBranch: string;
  headSha: string;
  headCommitMessage: string;
  actor: {
    login: string;
    avatarUrl: string;
  };
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  durationSeconds: number;
}

export interface GitHubRunSelection {
  run: GitHubWorkflowRun;
  repo: GitHubRepo;
  selectedAt: string;
}

export const GitHubDiagnoseRunRequestSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repo is required"),
  runId: z.number().int().positive("Run ID must be a positive integer"),
});

export type GitHubDiagnoseRunRequest = z.infer<typeof GitHubDiagnoseRunRequestSchema>;

// ─── Workspace & Export Models ─────────────────────────────────────────────

export type ExportFormat = "markdown" | "json" | "text";

export interface WorkspaceMetadata {
  repoOwner?: string;
  repoName?: string;
  branch?: string;
  commitSha?: string;
  commitMessage?: string;
  actorLogin?: string;
  actorAvatar?: string;
  runNumber?: number;
  durationSeconds?: number;
  timestamp?: string;
}

export interface KnowledgeArticle {
  title: string;
  category: string;
  url: string;
  summary: string;
}

// ─── Dashboard & Diagnosis History Models ───────────────────────────────────

export interface DiagnosisHistoryItem {
  id: string;
  repoOwner: string;
  repoName: string;
  workflowName: string;
  runNumber: number;
  branch: string;
  commitSha: string;
  commitMessage: string;
  actorLogin: string;
  actorAvatar: string;
  timestamp: string;
  diagnosis: Diagnosis;
  isBookmarked: boolean;
}

export interface DashboardMetrics {
  totalDiagnoses: number;
  activeReposCount: number;
  successRatePercentage: number;
  avgDiagnosisSpeedSeconds: number;
  primaryFailureCategory: string;
}

export interface RepositoryHealth {
  repoFullName: string;
  failureCount: number;
  successCount: number;
  healthStatus: "healthy" | "needs_attention" | "high_failures";
  lastFailureTime: string;
  topErrorCategory: string;
}

// ─── Autonomous AI Recovery Models ──────────────────────────────────────────

export interface RecoveryStep {
  stepNumber: number;
  title: string;
  command: string;
  expectedOutcome: string;
  riskLevel: "Low" | "Medium" | "High";
}

export interface GitPatchDetails {
  targetFilename: string;
  patchDiff: string;
  commitMessage: string;
  prTitle: string;
  prDescription: string;
}

export interface RecoveryPlan {
  estimatedSuccessRate: number; // e.g. 98%
  overallRiskLevel: "Low" | "Medium" | "High";
  steps: RecoveryStep[];
  gitPatch: GitPatchDetails;
  rollbackSteps: string[];
  verificationChecklist: string[];
}






