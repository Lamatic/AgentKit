"use server";

import { ConfigurationError } from "@/lib/environment";
import { getLamaticClient } from "@/lib/lamatic-client";
import {
  MAX_DOCUMENT_CHARACTERS,
  assertFlowSuccess,
  assertReportMatches,
  assertVerificationCoverage,
  expandAndValidate,
  parseJson,
  routeVerifications,
  simulateExtractionError,
  validateExtraction,
  validateVerifications,
  type Extraction,
  type FieldVerdict,
  type FlowResponse,
  type PipelineSummary,
  type SimulatedError,
} from "@/lib/pipeline";
import { config } from "../orchestrate.js";

interface FlowConfig {
  name: string;
  workflowId?: string;
  description: string;
  mode: "sync" | "async";
  expectedOutput: string | string[];
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  dependsOn?: string[];
}

type PipelineStep = "extract" | "verify" | "report";

export interface PipelineResult {
  success: boolean;
  extraction?: Extraction;
  verifications?: FieldVerdict[];
  verified?: FieldVerdict[];
  needsReview?: FieldVerdict[];
  notFound?: FieldVerdict[];
  report?: string;
  summary?: PipelineSummary;
  simulatedError?: SimulatedError | null;
  error?: string;
  failedStep?: PipelineStep | "configuration" | "input";
}

class FlowExecutionError extends Error {
  constructor(
    readonly step: PipelineStep,
    message: string,
  ) {
    super(message);
    this.name = "FlowExecutionError";
  }
}

const FLOW_TIMEOUT_MS = 60_000;
const flows = config.flows as Record<PipelineStep, FlowConfig>;

function withTimeout<T>(promise: Promise<T>, step: PipelineStep): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new FlowExecutionError(step, `${flows[step].name} timed out after 60 seconds.`)),
      FLOW_TIMEOUT_MS,
    );
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

async function runFlow(
  step: PipelineStep,
  inputs: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const flow = flows[step];
  if (!flow?.workflowId) {
    throw new FlowExecutionError(step, `${flow?.name ?? step} workflow ID is not configured.`);
  }

  const response = await withTimeout(getLamaticClient().executeFlow(flow.workflowId, inputs), step);
  try {
    return assertFlowSuccess(response as FlowResponse, flow.name);
  } catch (error) {
    throw new FlowExecutionError(
      step,
      error instanceof Error ? error.message : `${flow.name} returned an invalid result.`,
    );
  }
}

function validateReportContract(
  reportOutput: Record<string, unknown>,
  expectedSummary: PipelineSummary,
): void {
  if (typeof reportOutput.report !== "string" || !reportOutput.report.trim()) {
    throw new Error("Report flow returned an empty report.");
  }
  const rawSummary =
    typeof reportOutput.summary === "string"
      ? parseJson(reportOutput.summary, "Report flow summary")
      : reportOutput.summary;
  if (typeof rawSummary !== "object" || rawSummary === null || Array.isArray(rawSummary)) {
    throw new Error("Report flow returned an inconsistent summary.");
  }
  const summary = rawSummary as Record<string, unknown>;
  if (
    summary.total !== expectedSummary.total ||
    summary.verified_count !== expectedSummary.verified_count ||
    summary.needs_review_count !== expectedSummary.needs_review_count ||
    summary.not_found_count !== expectedSummary.not_found_count
  ) {
    throw new Error("Report flow returned an inconsistent summary.");
  }
}

function markSimulated(processed: FieldVerdict[], field: string): void {
  for (const verdict of processed) {
    if (verdict.field === field) verdict.simulated = true;
  }
}

function friendlyError(error: unknown): string {
  if (!(error instanceof Error)) return "Unknown pipeline error.";
  const message = error.message;
  const normalized = message.toLowerCase();
  if (normalized.includes("failed to parse url") || normalized.includes("absolute url")) {
    return "Lamatic API URL is invalid. Copy the complete endpoint from Lamatic API Docs.";
  }
  if (normalized.includes("fetch failed") || normalized.includes("could not reach")) {
    return "Could not reach Lamatic. Check the API URL, network connection, and deployment status.";
  }
  if (
    normalized.includes("api key") ||
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden") ||
    normalized.includes("401") ||
    normalized.includes("403")
  ) {
    return "Lamatic authentication failed. Check LAMATIC_API_KEY and LAMATIC_PROJECT_ID.";
  }
  return message;
}

export async function runPipeline(
  document: string,
  options: { simulateError?: boolean } = {},
): Promise<PipelineResult> {
  const trimmed = (document || "").trim();
  if (!trimmed) {
    return { success: false, failedStep: "input", error: "Paste a document before running." };
  }
  if (trimmed.length > MAX_DOCUMENT_CHARACTERS) {
    return {
      success: false,
      failedStep: "input",
      error: `Document is too large. Limit input to ${MAX_DOCUMENT_CHARACTERS.toLocaleString()} characters.`,
    };
  }

  let currentStep: PipelineStep = "extract";
  try {
    const extractOutput = await runFlow("extract", { document: trimmed });
    let extraction = validateExtraction(extractOutput.extraction);

    // Optional demo aid: deterministically corrupt one extracted scalar so the
    // verifier has a real error to catch. Surfaced explicitly to the caller.
    let simulatedError: SimulatedError | null = null;
    if (options.simulateError) {
      const simulation = simulateExtractionError(trimmed, extraction);
      extraction = simulation.extraction;
      simulatedError = simulation.change;
    }

    currentStep = "verify";
    const verifyOutput = await runFlow("verify", {
      document: trimmed,
      extraction: JSON.stringify(extraction),
    });
    const rawVerifications = validateVerifications(verifyOutput.verifications);
    assertVerificationCoverage(extraction, rawVerifications);
    const processed = expandAndValidate(trimmed, rawVerifications);
    if (simulatedError) markSimulated(processed, simulatedError.field);
    const routed = routeVerifications(processed);

    currentStep = "report";
    const reportOutput = await runFlow("report", {
      verifications: JSON.stringify(processed),
    });
    assertReportMatches(routed, reportOutput);
    validateReportContract(reportOutput, routed.summary);

    return {
      success: true,
      extraction,
      verifications: processed,
      verified: routed.verified,
      needsReview: routed.needsReview,
      notFound: routed.notFound,
      report: routed.report,
      summary: routed.summary,
      simulatedError,
    };
  } catch (error) {
    const failedStep =
      error instanceof ConfigurationError
        ? "configuration"
        : error instanceof FlowExecutionError
          ? error.step
          : currentStep;
    return { success: false, failedStep, error: friendlyError(error) };
  }
}

export type { FieldVerdict } from "@/lib/pipeline";
