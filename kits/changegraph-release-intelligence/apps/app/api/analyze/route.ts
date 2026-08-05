import * as z from "zod";

import { orchestrateChangeGraph } from "@/actions/orchestrate";
import { calculateRiskAssessment } from "@/lib/risk-score";
import {
  AnalyzeChangeGraphRequestSchema,
} from "@/lib/schemas";

import type {
  ChangeCategory,
  ChangeGraphReport,
  ChangePackage,
  StructuralDiff,
} from "@/types/changegraph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 3_500_000;

const CHANGE_CATEGORIES: ChangeCategory[] = [
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
];

function uniqueSorted(
  values: string[],
): string[] {
  return [...new Set(values)].sort(
    (left, right) =>
      left.localeCompare(right),
  );
}

function calculateCategoryCounts(
  changePackage: ChangePackage,
): Record<ChangeCategory, number> {
  const counts = Object.fromEntries(
    CHANGE_CATEGORIES.map(
      (category) => [category, 0],
    ),
  ) as Record<ChangeCategory, number>;

  for (
    const change of changePackage.changes
  ) {
    counts[change.category] += 1;
  }

  return counts;
}

function reconstructStructuralDiff(
  changePackage: ChangePackage,
): StructuralDiff {
  return {
    changes: changePackage.changes,

    addedFiles:
      changePackage.summary.addedFiles,

    removedFiles:
      changePackage.summary.removedFiles,

    modifiedFiles:
      changePackage.summary.modifiedFiles,

    affectedPaths: uniqueSorted(
      changePackage.changes.flatMap(
        (change) =>
          change.affectedPaths,
      ),
    ),

    runtimeEvidence:
      changePackage.evidence
        .runtimeEvidence,

    testsExecuted:
      changePackage.evidence
        .testsExecuted,
  };
}

function determineErrorStatus(
  error: Error,
): number {
  const message =
    error.message.toLowerCase();

  if (
    message.includes("lamatic") ||
    message.includes("flow was not found") ||
    message.includes(
      "authentication failed",
    ) ||
    message.includes(
      "could not connect",
    )
  ) {
    return 502;
  }

  if (
    message.includes(
      "missing required server environment variable",
    )
  ) {
    return 500;
  }

  return 500;
}

function safeErrorMessage(
  error: unknown,
): string {
  if (!(error instanceof Error)) {
    return "The analysis request failed.";
  }

  const message = error.message;

  // Avoid returning unexpectedly long SDK or
  // provider messages to the browser.
  if (message.length > 1_000) {
    return `${message.slice(0, 1_000)}…`;
  }

  return message;
}

export async function POST(
  request: Request,
): Promise<Response> {
  const contentType =
    request.headers.get(
      "content-type",
    ) ?? "";

  if (
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    return Response.json(
      {
        error:
          "Content-Type must be application/json.",
      },
      {
        status: 415,
      },
    );
  }

  const declaredLength = Number(
    request.headers.get(
      "content-length",
    ),
  );

  if (
    Number.isFinite(declaredLength) &&
    declaredLength >
      MAX_REQUEST_BYTES
  ) {
    return Response.json(
      {
        error:
          "The analysis request is too large.",
      },
      {
        status: 413,
      },
    );
  }

  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return Response.json(
      {
        error:
          "The request body could not be read.",
      },
      {
        status: 400,
      },
    );
  }

  const actualBytes =
    new TextEncoder().encode(
      rawBody,
    ).byteLength;

  if (
    actualBytes > MAX_REQUEST_BYTES
  ) {
    return Response.json(
      {
        error:
          "The analysis request is too large.",
      },
      {
        status: 413,
      },
    );
  }

  let rawPayload: unknown;

  try {
    rawPayload = JSON.parse(rawBody);
  } catch {
    return Response.json(
      {
        error:
          "The request body must contain valid JSON.",
      },
      {
        status: 400,
      },
    );
  }

  const validation =
    AnalyzeChangeGraphRequestSchema.safeParse(
      rawPayload,
    );

  if (!validation.success) {
    return Response.json(
      {
        error:
          "The analysis request is invalid.",

        details: z.prettifyError(
          validation.error,
        ),
      },
      {
        status: 400,
      },
    );
  }

  try {
    const submittedPackage =
      validation.data.changePackage as ChangePackage;

    const structuralDiff =
      reconstructStructuralDiff(
        submittedPackage,
      );

    /*
     * The browser calculates the initial score,
     * but the server calculates it again.
     *
     * This prevents a modified browser request
     * from directly overriding the submitted
     * risk score or promotion decision.
     */
    const riskAssessment =
      calculateRiskAssessment(
        structuralDiff,
        submittedPackage.blastRadius,
      );

    const normalizedChangePackage:
      ChangePackage = {
        ...submittedPackage,

        summary: {
          ...submittedPackage.summary,

          totalChanges:
            structuralDiff.changes.length,

          categoryCounts:
            calculateCategoryCounts(
              submittedPackage,
            ),

          directlyAffectedNodes:
            submittedPackage
              .blastRadius
              .directlyAffectedNodeIds
              .length,

          downstreamAffectedNodes:
            submittedPackage
              .blastRadius
              .indirectlyAffectedNodeIds
              .length,
        },

        riskAssessment,
      };

    const orchestration =
      await orchestrateChangeGraph({
        flowPurpose:
          validation.data.flowPurpose,

        baselineVersion:
          validation.data
            .baselineVersion,

        candidateVersion:
          validation.data
            .candidateVersion,

        releaseContext:
          validation.data
            .releaseContext,

        changePackage:
          normalizedChangePackage,
      });

    const report: ChangeGraphReport = {
      baselineVersion:
        validation.data
          .baselineVersion,

      candidateVersion:
        validation.data
          .candidateVersion,

      structuralDiff,

      blastRadius:
        normalizedChangePackage
          .blastRadius,

      riskAssessment,

      semanticAnalysis:
        orchestration
          .semanticAnalysis,

      releasePlan:
        orchestration.releasePlan,
    };

    const warnings = uniqueSorted([
      ...normalizedChangePackage
        .baseline.warnings,

      ...normalizedChangePackage
        .candidate.warnings,

      ...normalizedChangePackage
        .blastRadius.warnings,

      ...orchestration.warnings,
    ]);

    return Response.json(
      {
        report,
        warnings,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "ChangeGraph analysis failed:",
      error,
    );

    const normalizedError =
      error instanceof Error
        ? error
        : new Error(
            "The analysis request failed.",
          );

    return Response.json(
      {
        error:
          safeErrorMessage(
            normalizedError,
          ),
      },
      {
        status:
          determineErrorStatus(
            normalizedError,
          ),

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}