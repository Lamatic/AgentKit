import type {
  BlastRadiusAnalysis,
  ChangeCategory,
  ChangePackage,
  ParsedWorkflowExport,
  RiskAssessment,
  StructuralDiff,
  WorkflowPackageSummary,
} from "@/types/changegraph";

interface BuildChangePackageInput {
  flowPurpose: string;
  baselineVersion: string;
  candidateVersion: string;
  baseline: ParsedWorkflowExport;
  candidate: ParsedWorkflowExport;
  structuralDiff: StructuralDiff;
  blastRadius: BlastRadiusAnalysis;
  riskAssessment: RiskAssessment;
}

export const CHANGE_CATEGORIES = [
  "prompt",
  "model",
  "schema",
  "tool",
  "permission",
  "node",
  "edge",
  "fallback",
  "retry",
  "branching",
  "environment",
  "other",
] as const satisfies readonly ChangeCategory[];

function uniqueSorted(
  values: string[],
): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right),
  );
}

function requireText(
  value: string,
  fieldName: string,
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(
      `${fieldName} is required.`,
    );
  }

  return normalized;
}

function summarizeWorkflow(
  workflow: ParsedWorkflowExport,
  version: string,
): WorkflowPackageSummary {
  return {
    version,
    name: workflow.name,
    flowIds: uniqueSorted(
      workflow.flows.map((flow) => flow.id),
    ),
    flowPaths: uniqueSorted(
      workflow.flows.map((flow) => flow.path),
    ),
    promptFiles: uniqueSorted(
      workflow.prompts.map((file) => file.path),
    ),
    modelConfigFiles: uniqueSorted(
      workflow.modelConfigs.map(
        (file) => file.path,
      ),
    ),
    constitutionFiles: uniqueSorted(
      workflow.constitutions.map(
        (file) => file.path,
      ),
    ),
    environmentReferences: uniqueSorted(
      workflow.environmentReferences,
    ),
    warnings: uniqueSorted(workflow.warnings),
  };
}

export function createCategoryCounts(
  structuralDiff: StructuralDiff,
): Record<ChangeCategory, number> {
  const counts = Object.fromEntries(
    CHANGE_CATEGORIES.map((category) => [
      category,
      0,
    ]),
  ) as Record<ChangeCategory, number>;

  for (const change of structuralDiff.changes) {
    counts[change.category] += 1;
  }

  return counts;
}

/**
 * Creates the sanitized, deterministic payload passed to the
 * analyze-change-impact Lamatic flow.
 *
 * It intentionally excludes complete ZIP contents. Only structured
 * summaries, detected changes and already-redacted snapshots are sent.
 */
export function buildChangePackage(
  input: BuildChangePackageInput,
): ChangePackage {
  const flowPurpose = requireText(
    input.flowPurpose,
    "Flow purpose",
  );

  const baselineVersion = requireText(
    input.baselineVersion,
    "Baseline version",
  );

  const candidateVersion = requireText(
    input.candidateVersion,
    "Candidate version",
  );

  return {
    schemaVersion: "1.0",
    flowPurpose,

    baseline: summarizeWorkflow(
      input.baseline,
      baselineVersion,
    ),

    candidate: summarizeWorkflow(
      input.candidate,
      candidateVersion,
    ),

    summary: {
      totalChanges:
        input.structuralDiff.changes.length,

      categoryCounts: createCategoryCounts(
        input.structuralDiff,
      ),

      addedFiles: uniqueSorted(
        input.structuralDiff.addedFiles,
      ),

      removedFiles: uniqueSorted(
        input.structuralDiff.removedFiles,
      ),

      modifiedFiles: uniqueSorted(
        input.structuralDiff.modifiedFiles,
      ),

      directlyAffectedNodes:
        input.blastRadius
          .directlyAffectedNodeIds.length,

      downstreamAffectedNodes:
        input.blastRadius
          .indirectlyAffectedNodeIds.length,
    },

    changes: [...input.structuralDiff.changes]
      .sort((left, right) =>
        left.changeId.localeCompare(
          right.changeId,
        ),
      ),

    blastRadius: input.blastRadius,

    riskAssessment: input.riskAssessment,

    evidence: {
      runtimeEvidence: uniqueSorted(
        input.structuralDiff.runtimeEvidence,
      ),

      testsExecuted: uniqueSorted(
        input.structuralDiff.testsExecuted,
      ),
    },
  };
}

export function serializeChangePackage(
  changePackage: ChangePackage,
): string {
  return JSON.stringify(
    changePackage,
    null,
    2,
  );
}
