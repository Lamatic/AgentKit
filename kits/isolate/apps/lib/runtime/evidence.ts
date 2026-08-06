import { z } from "zod";

import { probeEvaluationSchema, type ProbeEvaluation } from "./probe";

export const certificationSchema = z.object({
  outcome: z.enum(["reproduced", "not_reproduced_under_tested_conditions"]),
  gate: z.object({
    repeatCount: z.number().int().nonnegative(),
    allCandidateRunsPassed: z.boolean(),
    controlRejected: z.boolean(),
  }),
  evidence: z.object({
    candidateRuns: z.array(probeEvaluationSchema),
    controlRun: probeEvaluationSchema,
  }),
  report: z.object({
    format: z.literal("markdown"),
    content: z.string(),
  }),
});

/**
 * Indent captured output as a Markdown code block, with a placeholder for empty
 * streams.
 */
function indentBlock(value: string) {
  if (!value) return "    (empty)";
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");
}

/**
 * Render one probe run — command, exit code, duration, assertions, and both output
 * streams — as a Markdown section.
 */
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

/**
 * Render the full reproduction report: outcome, the certification rule, every
 * candidate run, and the negative control.
 */
function renderMarkdownReport({
  outcome,
  candidateRuns,
  controlRun,
}: {
  outcome: "reproduced" | "not_reproduced_under_tested_conditions";
  candidateRuns: ProbeEvaluation[];
  controlRun: ProbeEvaluation;
}) {
  return [
    "# Isolate reproduction report",
    "",
    `**Outcome:** \`${outcome}\``,
    "",
    "A `reproduced` outcome requires two passing candidate runs and a rejecting negative control.",
    "",
    ...candidateRuns.flatMap((run, index) => [
      renderRun(`Candidate run ${index + 1}`, run),
      "",
    ]),
    "",
    renderRun("Negative control", controlRun),
  ].join("\n");
}

/**
 * Apply the deterministic certification gate to recorded runs.
 *
 * Every run must carry the identical issue-derived assertion; `reproduced` requires
 * at least two passing candidate runs and a control that rejects the same
 * assertion. Any other combination is `not_reproduced_under_tested_conditions`.
 *
 * @throws when the runs do not share one assertion contract.
 */
export function certifyEvidence({
  candidateRuns,
  controlRun,
}: {
  candidateRuns: ProbeEvaluation[];
  controlRun: ProbeEvaluation;
}) {
  const assertionContract = (run: ProbeEvaluation) =>
    JSON.stringify(
      run.assertions.map(({ kind, expected }) => ({ kind, expected })),
    );
  const firstCandidate = candidateRuns[0];
  const expectedContract = firstCandidate
    ? assertionContract(firstCandidate)
    : "";
  if (
    !firstCandidate ||
    firstCandidate.assertions.length !== 1 ||
    candidateRuns.some((run) => assertionContract(run) !== expectedContract) ||
    assertionContract(controlRun) !== expectedContract
  ) {
    throw new Error(
      "Certification requires every run to use the same issue-derived assertion.",
    );
  }

  const allCandidateRunsPassed =
    candidateRuns.length === 2 && candidateRuns.every(({ passed }) => passed);
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
