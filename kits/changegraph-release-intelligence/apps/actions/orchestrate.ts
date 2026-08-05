"use server";

import "server-only";

import { executeLamaticFlow } from "@/lib/lamatic-client";
import {
  parseReleasePlanPayload,
  parseSemanticAnalysisPayload,
} from "@/lib/schemas";
import { serializeChangePackage } from "@/lib/change-package";


import type {
  ChangeCategory,
  ChangePackage,
  PromotionDecision,
  ReleasePlan,
  SemanticAnalysis,
  SemanticFinding,
  TargetedTest,
} from "@/types/changegraph";

export interface OrchestrateChangeGraphInput {
  flowPurpose: string;
  baselineVersion: string;
  candidateVersion: string;
  releaseContext: string;
  changePackage: ChangePackage;
}

export interface OrchestrateChangeGraphResult {
  semanticAnalysis: SemanticAnalysis;
  releasePlan: ReleasePlan;
  warnings: string[];
}

interface LamaticResponseLike {
  status?: unknown;
  result?: unknown;
  message?: unknown;
  statusCode?: unknown;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function requireText(
  value: string,
  fieldName: string,
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalized;
}

function requireEnvironmentVariable(
  name: string,
): string {
  const value = process.env[name]?.trim();

  if (
    !value ||
    value.toLowerCase().startsWith("your_") ||
    value.toLowerCase().startsWith("replace_")
  ) {
    throw new Error(
      `Missing required server environment variable: ${name}`,
    );
  }

  return value;
}

/**
 * Lamatic SDK responses normally have:
 *
 * {
 *   status: "success" | "error",
 *   result: unknown,
 *   message?: string,
 *   statusCode?: number
 * }
 *
 * This function also accepts an already-unwrapped payload.
 */
function unwrapLamaticResult(
  response: unknown,
  flowLabel: string,
): unknown {
  if (!isRecord(response)) {
    return response;
  }

  const candidate =
    response as LamaticResponseLike;

  if (
    typeof candidate.status === "string" &&
    candidate.status.toLowerCase() === "error"
  ) {
    const message =
      typeof candidate.message === "string"
        ? candidate.message
        : `${flowLabel} returned an error.`;

    throw new Error(message);
  }

  if (
    "result" in candidate &&
    candidate.result !== undefined &&
    candidate.result !== null
  ) {
    return candidate.result;
  }

  return response;
}

function normalizeDecision(
  value: PromotionDecision,
): PromotionDecision {
  return value;
}

function uniqueSorted(
  values: string[],
): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right),
  );
}

function testTypeForCategory(
  category: ChangeCategory,
): TargetedTest["testType"] {
  switch (category) {
    case "schema":
      return "schema";

    case "prompt":
      return "prompt";

    case "model":
      return "model";

    case "fallback":
      return "fallback";

    case "permission":
      return "permission";

    case "tool":
      return "integration";

    default:
      return "regression";
  }
}

/**
 * Produces a conservative release plan when the AI-generated
 * release-plan response is missing or malformed.
 *
 * The deterministic score and promotion decision remain authoritative.
 */
function buildDeterministicFallbackReleasePlan(
  input: OrchestrateChangeGraphInput,
  semanticAnalysis: SemanticAnalysis,
  failureReason: string,
): ReleasePlan {
  const risk =
    input.changePackage.riskAssessment;

  const changes =
    input.changePackage.changes;

  const findingsByChangeId = new Map(
    semanticAnalysis.findings.map(
      (finding) => [
        finding.changeId,
        finding,
      ],
    ),
  );

  const blockers =
    risk.decision === "safe_to_promote"
      ? []
      : risk.contributions.map(
          (contribution, index) => ({
            blockerId:
              `deterministic-blocker-${String(
                index + 1,
              ).padStart(2, "0")}`,

            relatedChangeIds:
              contribution.relatedChangeIds,

            reason:
              `${contribution.label} contributed +${contribution.points} deterministic risk points.`,

            resolutionRequired:
              "Provide mitigation evidence, complete the related targeted tests, and rerun ChangeGraph before promotion.",
          }),
        );

  const targetedTests: TargetedTest[] =
    changes.slice(0, 12).map(
      (change, index) => {
        const finding =
          findingsByChangeId.get(
            change.changeId,
          );

        return {
          testId:
            `deterministic-test-${String(
              index + 1,
            ).padStart(2, "0")}`,

          name:
            `Validate ${change.category} change`,

          objective:
            finding
              ?.recommendedValidation[0] ??
            `Verify that the change to ${change.component} does not introduce unintended behavior.`,

          relatedChangeIds: [
            change.changeId,
          ],

          testType:
            testTypeForCategory(
              change.category,
            ),

          priority:
            finding?.severity ??
            risk.level,

          expectedEvidence:
            finding?.evidence[0] ??
            `Passing regression evidence for ${change.component}.`,
        };
      },
    );

  const changedComponents =
    uniqueSorted(
      changes.map(
        (change) =>
          change.component,
      ),
    );

  const environmentChanges =
    uniqueSorted(
      changes
        .filter(
          (change) =>
            change.category ===
            "environment",
        )
        .map(
          (change) =>
            change.component,
        ),
    );

  const deploymentChecklist =
    risk.decision === "safe_to_promote"
      ? [
          "Review all semantic findings.",
          "Execute every targeted test.",
          "Confirm rollback readiness.",
          "Promote the candidate using normal release controls.",
        ]
      : [
          "Do not promote the candidate release.",
          "Resolve every deterministic blocker.",
          "Execute every targeted test and capture evidence.",
          "Confirm the baseline rollback package is available.",
          "Rerun ChangeGraph after mitigation.",
        ];

  const safeFailureReason =
    failureReason.length > 400
      ? `${failureReason.slice(0, 400)}…`
      : failureReason;

  return {
    decisionSummary:
      risk.decision ===
      "block_release"
        ? `Release blocked by the deterministic engine with a risk score of ${risk.score}/100.`
        : risk.decision ===
            "manual_review_required"
          ? `Manual review is required before promotion. Deterministic risk score: ${risk.score}/100.`
          : `The deterministic engine classified the candidate as safe to promote with a score of ${risk.score}/100.`,

    promotionDecision:
      risk.decision,

    riskScore:
      risk.score,

    blockers,

    targetedTests,

    deploymentChecklist,

    rollbackManifest: {
      rollbackTarget:
        input.baselineVersion,

      componentsToRestore:
        changedComponents,

      environmentChangesToRevert:
        environmentChanges,

      postRollbackChecks: [
        `Confirm baseline version ${input.baselineVersion} is restored.`,
        "Verify the deployed flow responds successfully.",
        "Verify output schemas and downstream integrations.",
        "Run an identical baseline comparison in ChangeGraph.",
      ],
    },

    releaseNotes: [
      `${changes.length} structural change(s) were detected.`,
      `Deterministic decision: ${risk.decision}.`,
      `Deterministic risk score: ${risk.score}/100.`,
      "A deterministic fallback release plan was generated because the AI release-plan response could not be validated.",
    ],

    assumptions:
      semanticAnalysis.assumptions,

    unknowns: uniqueSorted([
      ...semanticAnalysis.unknowns,
      `Release-plan flow validation failure: ${safeFailureReason}`,
    ]),
  };
}
function summarizeEvidence(
  value: unknown,
  maximumLength = 350,
): string {
  let text: string;

  if (typeof value === "string") {
    text = value;
  } else {
    try {
      text = JSON.stringify(value);
    } catch {
      text = String(value);
    }
  }

  if (!text) {
    return "No value present.";
  }

  return text.length > maximumLength
    ? `${text.slice(0, maximumLength)}…`
    : text;
}

function impactForCategory(
  category: ChangeCategory,
): string {
  switch (category) {
    case "schema":
      return "The change may break downstream consumers or alter the response contract.";

    case "permission":
      return "The change may expand access or allow operations that were previously restricted.";

    case "tool":
      return "The change may introduce new external side effects or integration behavior.";

    case "fallback":
      return "The change may reduce workflow resilience when the primary execution path fails.";

    case "retry":
      return "The change may reduce recovery from temporary provider or network failures.";

    case "edge":
      return "The change may alter execution order, remove a processing path, or redirect downstream data.";

    case "prompt":
      return "The change may alter model instructions and generated behavior.";

    case "model":
      return "The change may alter output consistency, latency, cost, or model behavior.";

    case "environment":
      return "The change may affect deployment configuration or runtime behavior.";

    default:
      return "The change may alter workflow behavior and requires regression validation.";
  }
}

/**
 * Conservative semantic analysis used when the Lamatic analysis flow
 * returns malformed or incomplete structured output.
 */
function buildDeterministicFallbackSemanticAnalysis(
  input: OrchestrateChangeGraphInput,
  failureReason: string,
): SemanticAnalysis {
  const risk =
    input.changePackage.riskAssessment;

  const findings: SemanticFinding[] =
    input.changePackage.changes
      .slice(0, 20)
      .map((change) => ({
        changeId: change.changeId,
        category: change.category,

        observedFact:
          `A ${change.category} change was detected in ${change.component}.`,

        possibleImpact:
          impactForCategory(change.category),

        severity: risk.level,

        confidence: 1,

        evidence: [
          `Before: ${summarizeEvidence(change.before)}`,
          `After: ${summarizeEvidence(change.after)}`,
        ],

        affectedComponents: [
          change.component,
          ...change.affectedPaths,
        ],

        recommendedValidation: [
          `Validate ${change.component} against the baseline behavior.`,
          "Capture passing regression evidence before promotion.",
        ],
      }));

  const safeFailureReason =
    failureReason.length > 400
      ? `${failureReason.slice(0, 400)}…`
      : failureReason;

  return {
    analysisSummary:
      `${input.changePackage.changes.length} deterministic change(s) were detected. ` +
      `The calculated risk score is ${risk.score}/100 with decision "${risk.decision}". ` +
      "A deterministic semantic fallback was used because the Lamatic analysis response could not be validated.",

    overallImpactLevel:
      risk.level,

    requiresHumanReview:
      risk.decision !== "safe_to_promote",

    findings,

    crossCuttingRisks:
      risk.contributions.map(
        (contribution) =>
          `${contribution.label} (+${contribution.points})`,
      ),

    assumptions: [
      "The submitted ZIP exports accurately represent the baseline and candidate workflows.",
      "Uploaded content was redacted before analysis.",
    ],

    unknowns: [
      `Semantic-analysis flow validation failure: ${safeFailureReason}`,
      "Runtime execution evidence was not provided unless explicitly listed in the change package.",
    ],

    recommendedNextChecks: [
      "Resolve all deterministic risk contributions.",
      "Run the generated targeted tests.",
      "Verify output schemas and downstream integrations.",
      "Rerun ChangeGraph after mitigation.",
    ],
  };
}
/**
 * Runs ChangeGraph's two deployed Lamatic flows:
 *
 * 1. analyze-change-impact
 * 2. generate-release-plan
 *
 * The deterministic risk score and promotion decision always remain
 * authoritative. The AI-generated release plan cannot override them.
 */
export async function orchestrateChangeGraph(
  input: OrchestrateChangeGraphInput,
): Promise<OrchestrateChangeGraphResult> {
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

  const releaseContext = requireText(
    input.releaseContext,
    "Release context",
  );

  const analyzeFlowId =
    requireEnvironmentVariable(
      "ANALYZE_CHANGE_IMPACT_FLOW_ID",
    );

  const releasePlanFlowId =
    requireEnvironmentVariable(
      "GENERATE_RELEASE_PLAN_FLOW_ID",
    );

  const serializedChangePackage =
    serializeChangePackage(
      input.changePackage,
    );

  /*
   * Flow 1: semantic impact analysis
   */
  const analysisResponse =
    await executeLamaticFlow(
      analyzeFlowId,
      {
        flowPurpose,
        baselineVersion,
        candidateVersion,
        changePackage:
          serializedChangePackage,
        releaseContext,
      },
    );

  const analysisPayload =
  unwrapLamaticResult(
    analysisResponse,
    "Semantic analysis flow",
  );

const warnings: string[] = [];

let semanticAnalysis: SemanticAnalysis;

try {
  semanticAnalysis =
    parseSemanticAnalysisPayload(
      analysisPayload,
    );
} catch (error) {
  const reason =
    error instanceof Error
      ? error.message
      : "Unknown semantic-analysis validation error.";

  console.warn(
    "Semantic-analysis flow returned invalid structured output. Using deterministic fallback.",
    reason,
  );

  warnings.push(
    "The Lamatic semantic-analysis response was incomplete, so ChangeGraph generated a conservative deterministic fallback analysis.",
  );

  semanticAnalysis =
    buildDeterministicFallbackSemanticAnalysis(
      input,
      reason,
    );
}

  

  /*
   * Flow 2: release-plan generation
   */
  const deterministicRisk =
    input.changePackage.riskAssessment;

  const releasePlanResponse =
    await executeLamaticFlow(
      releasePlanFlowId,
      {
        flowPurpose,
        baselineVersion,
        candidateVersion,
        releaseContext,

        changePackage:
          serializedChangePackage,

        semanticAnalysis: JSON.stringify(
          semanticAnalysis,
          null,
          2,
        ),

        riskScore:
          deterministicRisk.score,

        promotionDecision:
          deterministicRisk.decision,
      },
    );

  const releasePlanPayload =
    unwrapLamaticResult(
      releasePlanResponse,
      "Release-plan flow",
    );

  

let generatedReleasePlan: ReleasePlan;

try {
  generatedReleasePlan =
    parseReleasePlanPayload(
      releasePlanPayload,
    );
} catch (error) {
  const reason =
    error instanceof Error
      ? error.message
      : "Unknown release-plan validation error.";

  console.warn(
    "Release-plan flow returned invalid structured output. Using deterministic fallback.",
    reason,
  );

  warnings.push(
    "The Lamatic release-plan response was incomplete, so ChangeGraph generated a conservative deterministic fallback plan.",
  );

  generatedReleasePlan =
    buildDeterministicFallbackReleasePlan(
      input,
      semanticAnalysis,
      reason,
    );
}

  if (
    generatedReleasePlan.riskScore !==
    deterministicRisk.score
  ) {
    warnings.push(
      `The release-plan flow returned risk score ${generatedReleasePlan.riskScore}, but the deterministic engine calculated ${deterministicRisk.score}. The deterministic score was preserved.`,
    );
  }

  if (
    generatedReleasePlan.promotionDecision !==
    deterministicRisk.decision
  ) {
    warnings.push(
      `The release-plan flow returned "${generatedReleasePlan.promotionDecision}", but the deterministic engine decided "${deterministicRisk.decision}". The deterministic decision was preserved.`,
    );
  }

  const releasePlan: ReleasePlan = {
    ...generatedReleasePlan,

    // AI output must not override deterministic safety controls.
    riskScore: deterministicRisk.score,

    promotionDecision: normalizeDecision(
      deterministicRisk.decision,
    ),
  };

  return {
    semanticAnalysis,
    releasePlan,
    warnings,
  };
}