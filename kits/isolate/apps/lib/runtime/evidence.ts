import type { ProbeEvaluation } from "./probe";

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
