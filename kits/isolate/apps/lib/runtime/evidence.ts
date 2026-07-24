import type { ProbeEvaluation } from "./probe";

export function certifyEvidence({
  candidateRuns,
  controlRun,
}: {
  candidateRuns: [ProbeEvaluation, ProbeEvaluation];
  controlRun: ProbeEvaluation;
}) {
  const allCandidateRunsPassed = candidateRuns.every(({ passed }) => passed);
  const controlRejected = !controlRun.passed;

  return {
    outcome:
      allCandidateRunsPassed && controlRejected
        ? ("reproduced" as const)
        : ("not_reproduced_under_tested_conditions" as const),
    gate: {
      repeatCount: candidateRuns.length,
      allCandidateRunsPassed,
      controlRejected,
    },
    evidence: {
      candidateRuns,
      controlRun,
    },
  };
}
