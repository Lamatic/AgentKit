import { ipAddress } from "@vercel/functions";
import * as z from "zod";

import { orchestrateChangeGraph } from "@/actions/orchestrate";
import { calculateBlastRadius } from "@/lib/blast-radius";
import { createCategoryCounts } from "@/lib/change-package";
import { calculateRiskAssessment } from "@/lib/risk-score";
import {
  AnalyzeChangeGraphRequestSchema,
} from "@/lib/schemas";

import type {
  ChangeGraphReport,
  ChangePackage,
  StructuralDiff,
} from "@/types/changegraph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 3_500_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;
const MAX_GLOBAL_CONCURRENT = 4;
const MAX_CLIENT_CONCURRENT = 1;
const FLOW_EXECUTIONS_PER_ANALYSIS = 2;
const MAX_TRACKED_CLIENTS = 10_000;

interface RateLimitState {
  count: number;
  resetAt: number;
}

interface ExecutionSlotResult {
  allowed: boolean;
  status?: number;
  message?: string;
}

const requestCounts =
  new Map<string, RateLimitState>();

const activeByClient =
  new Map<string, number>();

let activeGlobalExecutions = 0;

class RequestTooLargeError extends Error {}

class InvalidContentLengthError extends Error {}

function uniqueSorted(
  values: string[],
): string[] {
  return [...new Set(values)].sort(
    (left, right) =>
      left.localeCompare(right),
  );
}

function clientKey(
  request: Request,
): string {
  const candidate =
    ipAddress(request) ??
    "unknown-client";

  return candidate.slice(0, 200);
}

function purgeExpiredRateLimits(
  now: number,
): void {
  for (
    const [client, state]
    of requestCounts
  ) {
    if (state.resetAt <= now) {
      requestCounts.delete(client);
    }
  }
}

function ensureRateLimitCapacity(): void {
  while (
    requestCounts.size >=
    MAX_TRACKED_CLIENTS
  ) {
    const oldestClient =
      requestCounts.keys().next().value;

    if (oldestClient === undefined) {
      break;
    }

    requestCounts.delete(oldestClient);
  }
}

function consumeRateLimit(
  key: string,
): number | null {
  const now = Date.now();

  /*
   * This map is process-local and therefore best-effort on serverless
   * platforms. Purge stale entries before looking up or inserting a key.
   */
  purgeExpiredRateLimits(now);

  const current = requestCounts.get(key);

  if (!current) {
    ensureRateLimitCapacity();

    requestCounts.set(key, {
      count: 1,
      resetAt:
        now + RATE_LIMIT_WINDOW_MS,
    });

    return null;
  }

  if (
    current.count >=
    MAX_REQUESTS_PER_WINDOW
  ) {
    return Math.max(
      1,
      Math.ceil(
        (current.resetAt - now) / 1_000,
      ),
    );
  }

  current.count += 1;

  return null;
}

function acquireExecutionSlot(
  key: string,
): ExecutionSlotResult {
  const activeForClient =
    activeByClient.get(key) ?? 0;

  if (
    activeForClient >=
    MAX_CLIENT_CONCURRENT
  ) {
    return {
      allowed: false,
      status: 429,
      message:
        "An analysis is already running for this client.",
    };
  }

  if (
    activeGlobalExecutions >=
    MAX_GLOBAL_CONCURRENT
  ) {
    return {
      allowed: false,
      status: 503,
      message:
        "Analysis capacity is temporarily full. Try again shortly.",
    };
  }

  activeByClient.set(
    key,
    activeForClient + 1,
  );

  activeGlobalExecutions += 1;

  return {
    allowed: true,
  };
}

function releaseExecutionSlot(
  key: string,
): void {
  const activeForClient =
    activeByClient.get(key) ?? 0;

  if (activeForClient <= 1) {
    activeByClient.delete(key);
  } else {
    activeByClient.set(
      key,
      activeForClient - 1,
    );
  }

  activeGlobalExecutions = Math.max(
    0,
    activeGlobalExecutions - 1,
  );
}

async function readBodyWithLimit(
  request: Request,
): Promise<string> {
  const contentLengthHeader =
    request.headers.get(
      "content-length",
    );

  if (contentLengthHeader !== null) {
    const declaredLength = Number(
      contentLengthHeader,
    );

    if (
      !Number.isFinite(declaredLength) ||
      declaredLength < 0
    ) {
      throw new InvalidContentLengthError(
        "Content-Length must be a non-negative number.",
      );
    }

    if (
      declaredLength >
      MAX_REQUEST_BYTES
    ) {
      throw new RequestTooLargeError(
        "The analysis request is too large.",
      );
    }
  }

  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();

  let totalBytes = 0;
  let rawBody = "";

  try {
    while (true) {
      const {
        done,
        value,
      } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (
        totalBytes >
        MAX_REQUEST_BYTES
      ) {
        await reader.cancel();

        throw new RequestTooLargeError(
          "The analysis request is too large.",
        );
      }

      rawBody += decoder.decode(
        value,
        {
          stream: true,
        },
      );
    }

    rawBody += decoder.decode();

    return rawBody;
  } finally {
    reader.releaseLock();
  }
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

  const key = clientKey(request);

  const retryAfter =
    consumeRateLimit(key);

  if (retryAfter !== null) {
    return Response.json(
      {
        error:
          "Too many analysis requests. Try again shortly.",
      },
      {
        status: 429,
        headers: {
          "Retry-After":
            String(retryAfter),
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  let rawBody: string;

  try {
    rawBody =
      await readBodyWithLimit(request);
  } catch (error) {
    if (
      error instanceof
      RequestTooLargeError
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

    if (
      error instanceof
      InvalidContentLengthError
    ) {
      return Response.json(
        {
          error:
            error.message,
        },
        {
          status: 400,
        },
      );
    }

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
     * The browser supplies validated workflow graph snapshots, but the
     * server recomputes the blast radius and deterministic risk score.
     * The request-supplied blast-radius and risk fields are never trusted.
     */
    const blastRadius =
      calculateBlastRadius(
        validation.data.baselineGraph,
        validation.data.candidateGraph,
        structuralDiff,
      );

    const riskAssessment =
      calculateRiskAssessment(
        structuralDiff,
        blastRadius,
      );

    const normalizedChangePackage:
      ChangePackage = {
        ...submittedPackage,

        summary: {
          ...submittedPackage.summary,

          totalChanges:
            structuralDiff.changes.length,

          categoryCounts:
            createCategoryCounts(
              structuralDiff,
            ),

          directlyAffectedNodes:
            blastRadius
              .directlyAffectedNodeIds
              .length,

          downstreamAffectedNodes:
            blastRadius
              .indirectlyAffectedNodeIds
              .length,
        },

        blastRadius,

        riskAssessment,
      };

    const executionSlot =
      acquireExecutionSlot(key);

    if (!executionSlot.allowed) {
      return Response.json(
        {
          error:
            executionSlot.message,
        },
        {
          status:
            executionSlot.status ?? 429,
          headers: {
            "Retry-After": "5",
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    const requestId =
      crypto.randomUUID();

    const executionStartedAt =
      performance.now();

    let orchestration:
      Awaited<
        ReturnType<
          typeof orchestrateChangeGraph
        >
      >;

    try {
      orchestration =
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

      console.info(
        "ChangeGraph flow execution metrics",
        {
          requestId,
          flowExecutionCount:
            FLOW_EXECUTIONS_PER_ANALYSIS,
          latencyMs: Math.round(
            performance.now() -
              executionStartedAt,
          ),
          outcome: "success",
        },
      );
    } catch (error) {
      console.info(
        "ChangeGraph flow execution metrics",
        {
          requestId,
          flowExecutionCount:
            FLOW_EXECUTIONS_PER_ANALYSIS,
          latencyMs: Math.round(
            performance.now() -
              executionStartedAt,
          ),
          outcome: "error",
        },
      );

      throw error;
    } finally {
      releaseExecutionSlot(key);
    }

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
