import * as z from "zod";

import {
  MAX_WORKFLOW_GRAPH_EDGES_PER_FLOW,
  MAX_WORKFLOW_GRAPH_NODES_PER_FLOW,
} from "@/lib/blast-radius";

import { CHANGE_CATEGORIES } from "@/lib/change-package";

import type {
  ReleasePlan,
  SemanticAnalysis,
} from "@/types/changegraph";

export const ChangeCategorySchema = z.enum(CHANGE_CATEGORIES);

export const RiskLevelSchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const PromotionDecisionSchema = z.enum([
  "safe_to_promote",
  "manual_review_required",
  "block_release",
]);

const StringArraySchema = z
  .array(z.string())
  .default([]);

const BooleanSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }

    return value;
  },
  z.boolean(),
);

const NumericInputSchema = z.union([
  z.number(),
  z.string().trim().min(1),
]);

const ConfidenceSchema = NumericInputSchema.transform(
  (value, context) => {
    const parsed =
      typeof value === "number"
        ? value
        : Number(value);

    if (
      !Number.isFinite(parsed) ||
      parsed < 0 ||
      parsed > 100
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Confidence must be a finite number from 0 to 1 or a percentage above 1 and up to 100.",
      });

      return z.NEVER;
    }

    /*
     * A bare value of 1 is ambiguous: it could mean 100% in normalized
     * form or 1% in percentage form. Resolve it to normalized full
     * confidence instead of rejecting the entire semantic payload.
     */
    if (parsed === 1) {
      return 1;
    }

    return parsed > 1
      ? parsed / 100
      : parsed;
  },
);

const RiskScoreSchema = NumericInputSchema.transform(
  (value, context) => {
    const parsed =
      typeof value === "number"
        ? value
        : Number(value);

    if (!Number.isFinite(parsed)) {
      context.addIssue({
        code: "custom",
        message:
          "Risk score must be a finite numeric value.",
      });

      return z.NEVER;
    }

    return parsed;
  },
)
  .pipe(z.number().min(0).max(100))
  .transform((value) => Math.round(value));

export const SemanticFindingSchema = z.object({
  changeId: z.string().min(1),
  category: ChangeCategorySchema,
  observedFact: z.string().min(1),
  possibleImpact: z.string().min(1),
  severity: RiskLevelSchema,
  confidence: ConfidenceSchema,
  evidence: StringArraySchema,
  affectedComponents: StringArraySchema,
  recommendedValidation: StringArraySchema,
});

export const SemanticAnalysisSchema = z.object({
  analysisSummary: z.string().min(1),
  overallImpactLevel: RiskLevelSchema,
  requiresHumanReview: BooleanSchema,
  findings: z
    .array(SemanticFindingSchema)
    .default([]),
  crossCuttingRisks: StringArraySchema,
  assumptions: StringArraySchema,
  unknowns: StringArraySchema,
  recommendedNextChecks: StringArraySchema,
});

export const ReleaseBlockerSchema = z.object({
  blockerId: z.string().min(1),
  relatedChangeIds: StringArraySchema,
  reason: z.string().min(1),
  resolutionRequired: z.string().min(1),
});

export const TargetedTestSchema = z.object({
  testId: z.string().min(1),
  name: z.string().min(1),
  objective: z.string().min(1),
  relatedChangeIds: StringArraySchema,
  testType: z.enum([
    "schema",
    "prompt",
    "model",
    "integration",
    "fallback",
    "safety",
    "permission",
    "regression",
    "performance",
    "other",
  ]),
  priority: RiskLevelSchema,
  expectedEvidence: z.string().min(1),
});

export const RollbackManifestSchema = z.object({
  rollbackTarget: z.string().min(1),
  componentsToRestore: StringArraySchema,
  environmentChangesToRevert: StringArraySchema,
  postRollbackChecks: StringArraySchema,
});

export const ReleasePlanSchema = z.object({
  decisionSummary: z.string().min(1),
  promotionDecision: PromotionDecisionSchema,
  riskScore: RiskScoreSchema,
  blockers: z
    .array(ReleaseBlockerSchema)
    .default([]),
  targetedTests: z
    .array(TargetedTestSchema)
    .default([]),
  deploymentChecklist: StringArraySchema,
  rollbackManifest: RollbackManifestSchema,
  releaseNotes: StringArraySchema,
  assumptions: StringArraySchema,
  unknowns: StringArraySchema,
});

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * Lamatic may return:
 *
 * 1. An ordinary JavaScript object
 * 2. A JSON string
 * 3. JSON inside a Markdown code block
 * 4. Text surrounding a JSON object
 *
 * This function extracts the JSON without evaluating code.
 */
export function parseJsonPayload(
  input: unknown,
): unknown {
  if (typeof input !== "string") {
    return input;
  }

  let text = input.trim();

  if (!text) {
    throw new Error(
      "The Lamatic flow returned an empty response.",
    );
  }

  const fencedMatch = text.match(
    /^```(?:json)?\s*([\s\S]*?)\s*```$/i,
  );

  if (fencedMatch?.[1]) {
    text = fencedMatch[1].trim();
  }

  const candidates = [text];

  const objectStart = text.indexOf("{");
  const objectEnd = text.lastIndexOf("}");

  if (
    objectStart !== -1 &&
    objectEnd > objectStart
  ) {
    candidates.push(
      text.slice(objectStart, objectEnd + 1),
    );
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next safe candidate.
    }
  }

  throw new Error(
    "The Lamatic flow did not return valid JSON.",
  );
}

function unwrapProperty(
  payload: unknown,
  property: string,
): unknown {
  const parsed = parseJsonPayload(payload);

  if (
    isRecord(parsed) &&
    property in parsed
  ) {
    return parseJsonPayload(parsed[property]);
  }

  return parsed;
}

export function parseSemanticAnalysisPayload(
  payload: unknown,
): SemanticAnalysis {
  const candidate = unwrapProperty(
    payload,
    "analysis",
  );

  const result =
    SemanticAnalysisSchema.safeParse(candidate);

  if (!result.success) {
    throw new Error(
      `Invalid semantic-analysis response:\n${z.prettifyError(
        result.error,
      )}`,
    );
  }

  return result.data;
}

export function parseReleasePlanPayload(
  payload: unknown,
): ReleasePlan {
  const candidate = unwrapProperty(
    payload,
    "releasePlan",
  );

  const result =
    ReleasePlanSchema.safeParse(candidate);

  if (!result.success) {
    throw new Error(
      `Invalid release-plan response:\n${z.prettifyError(
        result.error,
      )}`,
    );
  }

  return result.data;
}
const NonNegativeIntegerSchema = z
  .number()
  .int()
  .nonnegative();

const JsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

const WorkflowGraphNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  config: z.record(
    z.string(),
    JsonValueSchema,
  ),
});

const WorkflowGraphEdgeSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
});

const WorkflowGraphFlowSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    path: z.string().min(1),
    nodes: z
      .array(WorkflowGraphNodeSchema)
      .max(
        MAX_WORKFLOW_GRAPH_NODES_PER_FLOW,
      ),
    edges: z
      .array(WorkflowGraphEdgeSchema)
      .max(
        MAX_WORKFLOW_GRAPH_EDGES_PER_FLOW,
      ),
  })
  .superRefine((flow, context) => {
    const nodeIds = new Set<string>();

    flow.nodes.forEach((node, index) => {
      const nodeKey =
        node.id.trim().toLowerCase();

      if (nodeIds.has(nodeKey)) {
        context.addIssue({
          code: "custom",
          path: ["nodes", index, "id"],
          message:
            "Node IDs must be unique within each flow graph.",
        });
      }

      nodeIds.add(nodeKey);
    });

    flow.edges.forEach((edge, index) => {
      const sourceKey =
        edge.source.trim().toLowerCase();

      const targetKey =
        edge.target.trim().toLowerCase();

      if (!nodeIds.has(sourceKey)) {
        context.addIssue({
          code: "custom",
          path: ["edges", index, "source"],
          message:
            "Every graph edge source must reference a submitted node.",
        });
      }

      if (!nodeIds.has(targetKey)) {
        context.addIssue({
          code: "custom",
          path: ["edges", index, "target"],
          message:
            "Every graph edge target must reference a submitted node.",
        });
      }
    });
  });

const WorkflowGraphSnapshotSchema = z
  .object({
    flows: z.array(
      WorkflowGraphFlowSchema,
    ),
  })
  .superRefine((snapshot, context) => {
    const flowIds = new Set<string>();
    const flowPaths = new Set<string>();

    snapshot.flows.forEach((flow, index) => {
      const flowIdKey =
        flow.id.trim().toLowerCase();

      const flowPathKey = flow.path
        .replaceAll("\\", "/")
        .trim()
        .toLowerCase();

      if (flowIds.has(flowIdKey)) {
        context.addIssue({
          code: "custom",
          path: ["flows", index, "id"],
          message:
            "Flow IDs must be unique within a workflow graph.",
        });
      }

      if (flowPaths.has(flowPathKey)) {
        context.addIssue({
          code: "custom",
          path: ["flows", index, "path"],
          message:
            "Flow paths must be unique within a workflow graph.",
        });
      }

      flowIds.add(flowIdKey);
      flowPaths.add(flowPathKey);
    });
  });

const WorkflowChangeSchema = z.object({
  changeId: z.string().min(1),
  category: ChangeCategorySchema,
  component: z.string().min(1),
  before: JsonValueSchema,
  after: JsonValueSchema,
  affectedPaths: StringArraySchema,
});

const BlastRadiusNodeSchema = z.object({
  flowId: z.string().min(1),
  flowName: z.string().min(1),
  nodeId: z.string().min(1),
  nodeName: z.string().min(1),
  impact: z.enum([
    "direct",
    "downstream",
  ]),
  distance: NonNegativeIntegerSchema,
  relatedChangeIds: StringArraySchema,
  paths: z
    .array(z.array(z.string()))
    .default([]),
});

const BlastRadiusAnalysisSchema = z.object({
  nodes: z
    .array(BlastRadiusNodeSchema)
    .default([]),

  directlyAffectedNodeIds:
    StringArraySchema,

  indirectlyAffectedNodeIds:
    StringArraySchema,

  affectedPaths: StringArraySchema,
  warnings: StringArraySchema,
});

const RiskContributionSchema = z.object({
  ruleId: z.string().min(1),
  label: z.string().min(1),
  points: NonNegativeIntegerSchema,
  relatedChangeIds: StringArraySchema,
});

const RiskAssessmentSchema = z.object({
  score: RiskScoreSchema,
  level: RiskLevelSchema,
  decision: PromotionDecisionSchema,
  contributions: z
    .array(RiskContributionSchema)
    .default([]),
});

const WorkflowPackageSummarySchema = z.object({
  version: z.string().min(1),
  name: z.string().min(1),
  flowIds: StringArraySchema,
  flowPaths: StringArraySchema,
  promptFiles: StringArraySchema,
  modelConfigFiles: StringArraySchema,
  constitutionFiles: StringArraySchema,
  environmentReferences: StringArraySchema,
  warnings: StringArraySchema,
});

const CategoryCountsSchema = z.object(
  Object.fromEntries(
    CHANGE_CATEGORIES.map((category) => [
      category,
      NonNegativeIntegerSchema,
    ]),
  ) as Record<
    (typeof CHANGE_CATEGORIES)[number],
    typeof NonNegativeIntegerSchema
  >,
);

export const ChangePackageSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    flowPurpose: z.string().min(1),

    baseline:
      WorkflowPackageSummarySchema,

    candidate:
      WorkflowPackageSummarySchema,

    summary: z.object({
      totalChanges:
        NonNegativeIntegerSchema,

      categoryCounts:
        CategoryCountsSchema,

      addedFiles: StringArraySchema,
      removedFiles: StringArraySchema,
      modifiedFiles: StringArraySchema,

      directlyAffectedNodes:
        NonNegativeIntegerSchema,

      downstreamAffectedNodes:
        NonNegativeIntegerSchema,
    }),

    changes: z.array(
      WorkflowChangeSchema,
    ),

    blastRadius:
      BlastRadiusAnalysisSchema,

    riskAssessment:
      RiskAssessmentSchema,

    evidence: z.object({
      runtimeEvidence: StringArraySchema,
      testsExecuted: StringArraySchema,
    }),
  })
  .superRefine((value, context) => {
    if (
      value.summary.totalChanges !==
      value.changes.length
    ) {
      context.addIssue({
        code: "custom",
        path: [
          "summary",
          "totalChanges",
        ],
        message:
          "totalChanges must equal the number of submitted changes.",
      });
    }

    const changeIds = new Set<string>();

    value.changes.forEach(
      (change, index) => {
        if (
          changeIds.has(change.changeId)
        ) {
          context.addIssue({
            code: "custom",
            path: [
              "changes",
              index,
              "changeId",
            ],
            message:
              "Every changeId must be unique.",
          });
        }

        changeIds.add(change.changeId);
      },
    );
  });

function normalizeWorkflowPath(
  value: string,
): string {
  return value
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "")
    .toLowerCase();
}

export const AnalyzeChangeGraphRequestSchema =
  z
    .object({
      flowPurpose: z
        .string()
        .trim()
        .min(1)
        .max(2_000),

      baselineVersion: z
        .string()
        .trim()
        .min(1)
        .max(100),

      candidateVersion: z
        .string()
        .trim()
        .min(1)
        .max(100),

      releaseContext: z
        .string()
        .trim()
        .min(1)
        .max(4_000),

      changePackage:
        ChangePackageSchema,

      baselineGraph:
        WorkflowGraphSnapshotSchema,

      candidateGraph:
        WorkflowGraphSnapshotSchema,
    })
    .superRefine((value, context) => {
      if (
        value.baselineVersion !==
        value.changePackage.baseline.version
      ) {
        context.addIssue({
          code: "custom",
          path: ["baselineVersion"],
          message:
            "baselineVersion must match changePackage.baseline.version.",
        });
      }

      if (
        value.candidateVersion !==
        value.changePackage.candidate.version
      ) {
        context.addIssue({
          code: "custom",
          path: ["candidateVersion"],
          message:
            "candidateVersion must match changePackage.candidate.version.",
        });
      }

      if (
        value.flowPurpose !==
        value.changePackage.flowPurpose
      ) {
        context.addIssue({
          code: "custom",
          path: ["flowPurpose"],
          message:
            "flowPurpose must match changePackage.flowPurpose.",
        });
      }

      const verifyGraphSummary = (
        graph: typeof value.baselineGraph,
        summary:
          typeof value.changePackage.baseline,
        path: "baselineGraph" | "candidateGraph",
      ): void => {
        const graphFlowIds = graph.flows
          .map((flow) => flow.id)
          .sort();

        const graphFlowPaths = graph.flows
          .map((flow) =>
            normalizeWorkflowPath(
              flow.path,
            ),
          )
          .sort();

        const summaryFlowIds = [
          ...summary.flowIds,
        ].sort();

        const summaryFlowPaths =
          summary.flowPaths
            .map((flowPath) =>
              normalizeWorkflowPath(
                flowPath,
              ),
            )
            .sort();

        if (
          JSON.stringify(graphFlowIds) !==
          JSON.stringify(summaryFlowIds)
        ) {
          context.addIssue({
            code: "custom",
            path: [path, "flows"],
            message:
              "Workflow graph flow IDs must match the submitted workflow summary.",
          });
        }

        if (
          JSON.stringify(graphFlowPaths) !==
          JSON.stringify(summaryFlowPaths)
        ) {
          context.addIssue({
            code: "custom",
            path: [path, "flows"],
            message:
              "Workflow graph flow paths must match the submitted workflow summary.",
          });
        }
      };

      verifyGraphSummary(
        value.baselineGraph,
        value.changePackage.baseline,
        "baselineGraph",
      );

      verifyGraphSummary(
        value.candidateGraph,
        value.changePackage.candidate,
        "candidateGraph",
      );
    });
