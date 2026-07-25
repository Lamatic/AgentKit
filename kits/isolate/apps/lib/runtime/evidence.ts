import { z } from "zod";

import { probeEvaluationSchema, type ProbeEvaluation } from "./probe";

export const certificationSchema = z.object({
  outcome: z.enum(["reproduced", "not_reproduced_under_tested_conditions"]),
  gate: z.object({
    repeatCount: z.literal(2),
    allCandidateRunsPassed: z.boolean(),
    controlRejected: z.boolean(),
  }),
  evidence: z.object({
    candidateRuns: z.tuple([probeEvaluationSchema, probeEvaluationSchema]),
    controlRun: probeEvaluationSchema,
  }),
  report: z.object({
    format: z.literal("markdown"),
    content: z.string(),
  }),
});

function indentBlock(value: string) {
  if (!value) return "    (empty)";
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");
}

function renderRun(label: string, run: ProbeEvaluation) {
  const assertions = run.assertions
    .map(
      ({ kind, passed, expected, actual }) =>
        `- ${passed ? "PASS" : "FAIL"} \`${kind}\`: expected \`${String(expected)}\`, observed \`${String(actual)}\``,
    )
    .join("\n");

  return [
    `## ${label}`,
    "",
    `- **Probe result:** ${run.passed ? "passed" : "failed"}`,
    `- **Command:** \`${run.observation.command}\``,
    `- **Exit code:** \`${run.observation.exitCode}\``,
    `- **Duration:** ${run.observation.durationMs} ms`,
    "",
    "### Assertions",
    "",
    assertions,
    "",
    "### stdout",
    "",
    indentBlock(run.observation.stdout),
    "",
    "### stderr",
    "",
    indentBlock(run.observation.stderr),
  ].join("\n");
}

function renderMarkdownReport({
  outcome,
  candidateRuns,
  controlRun,
}: {
  outcome: "reproduced" | "not_reproduced_under_tested_conditions";
  candidateRuns: [ProbeEvaluation, ProbeEvaluation];
  controlRun: ProbeEvaluation;
}) {
  return [
    "# Isolate reproduction report",
    "",
    `**Outcome:** \`${outcome}\``,
    "",
    "A `reproduced` outcome requires two passing candidate runs and a rejecting negative control.",
    "",
    renderRun("Candidate run 1", candidateRuns[0]),
    "",
    renderRun("Candidate run 2", candidateRuns[1]),
    "",
    renderRun("Negative control", controlRun),
  ].join("\n");
}

export function certifyEvidence({
  candidateRuns,
  controlRun,
}: {
  candidateRuns: [ProbeEvaluation, ProbeEvaluation];
  controlRun: ProbeEvaluation;
}) {
  const assertionContract = (run: ProbeEvaluation) =>
    JSON.stringify(
      run.assertions.map(({ kind, expected }) => ({ kind, expected })),
    );
  const expectedContract = assertionContract(candidateRuns[0]);
  if (
    candidateRuns[0].assertions.length !== 1 ||
    candidateRuns.some((run) => assertionContract(run) !== expectedContract) ||
    assertionContract(controlRun) !== expectedContract
  ) {
    throw new Error(
      "Certification requires every run to use the same issue-derived assertion.",
    );
  }

  const allCandidateRunsPassed = candidateRuns.every(({ passed }) => passed);
  const controlRejected = !controlRun.passed;

  const outcome =
    allCandidateRunsPassed && controlRejected
      ? ("reproduced" as const)
      : ("not_reproduced_under_tested_conditions" as const);

  return {
    outcome,
    gate: {
      repeatCount: candidateRuns.length,
      allCandidateRunsPassed,
      controlRejected,
    },
    evidence: {
      candidateRuns,
      controlRun,
    },
    report: {
      format: "markdown" as const,
      content: renderMarkdownReport({ outcome, candidateRuns, controlRun }),
    },
  };
}
