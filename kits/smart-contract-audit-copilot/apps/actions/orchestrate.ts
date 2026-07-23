"use server";

import { executeSmartContractAudit } from "@/lib/lamatic-client";
import type { ActionResult, AuditFinding, AuditReport, AuditRequest, Confidence, Severity } from "@/lib/types";

const severityValues = new Set<Severity>(["critical", "high", "medium", "low", "info"]);
const confidenceValues = new Set<Confidence>(["high", "medium", "low"]);

function cleanJsonString(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/i, "")
      .trim();
  }
  return trimmed;
}

function asSeverity(value: unknown): Severity {
  return typeof value === "string" && severityValues.has(value as Severity) ? (value as Severity) : "info";
}

function asConfidence(value: unknown): Confidence {
  return typeof value === "string" && confidenceValues.has(value as Confidence) ? (value as Confidence) : "medium";
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeLineNumbers(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "number" ? item : Number.parseInt(String(item), 10)))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function normalizeFindings(value: unknown): AuditFinding[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    const finding = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return {
      title: asString(finding.title, `Finding ${index + 1}`),
      severity: asSeverity(finding.severity),
      lineNumbers: normalizeLineNumbers(finding.lineNumbers ?? finding.location),
      evidence: asString(finding.evidence ?? finding.description, "No evidence was provided by the flow."),
      impact: asString(finding.impact, "Impact was not specified."),
      recommendation: asString(finding.recommendation, "Review this area manually and add a targeted test."),
      confidence: asConfidence(finding.confidence),
    };
  });
}

function parseReport(raw: unknown): AuditReport {
  let candidate = raw;

  if (candidate && typeof candidate === "object") {
    const objectCandidate = candidate as Record<string, unknown>;
    candidate = objectCandidate.auditReport ?? objectCandidate.audit ?? objectCandidate.answer ?? objectCandidate.report ?? objectCandidate;
  }

  if (typeof candidate === "string") {
    candidate = JSON.parse(cleanJsonString(candidate));
  }

  if (!candidate || typeof candidate !== "object") {
    throw new Error("The flow did not return a structured audit report.");
  }

  const report = candidate as Record<string, unknown>;
  const remediations = Array.isArray(report.remediations)
    ? report.remediations.map((item) => String(item)).filter(Boolean)
    : [];

  return {
    summary: asString(report.summary, "The flow completed but did not include a summary."),
    overallRisk: asSeverity(report.overallRisk),
    confidence: asConfidence(report.confidence),
    securityFindings: normalizeFindings(report.securityFindings),
    gasFindings: normalizeFindings(report.gasFindings),
    bestPracticeFindings: normalizeFindings(report.bestPracticeFindings),
    remediations,
    disclaimer: asString(
      report.disclaimer,
      "AI-assisted review only; not a replacement for a complete professional smart contract audit."
    ),
  };
}

export async function runSmartContractAudit(input: AuditRequest): Promise<ActionResult<AuditReport>> {
  try {
    if (!input.contractCode || input.contractCode.trim().length < 40) {
      throw new Error("Paste a complete Solidity contract before running the audit.");
    }

    const response = await executeSmartContractAudit({
      ...input,
      contractCode: input.contractCode.trim(),
      contractName: input.contractName?.trim() || "Untitled contract",
      focusAreas: input.focusAreas?.trim() || "",
    });

    if (response.status === "error") {
      throw new Error(response.message || "Lamatic flow execution failed.");
    }

    const report = parseReport(response.result);

    return {
      success: true,
      data: report,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown audit error.",
    };
  }
}
