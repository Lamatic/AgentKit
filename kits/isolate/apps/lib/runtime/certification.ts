import type { IssueEvidenceAssertion } from "./claim";
import { certifyEvidence } from "./evidence";
import type { ProbeEvaluation, ProbeSpec } from "./probe";

type ProbeRuntime = {
  runProbe(input: {
    sandboxId: string;
    workspace: "workspace/repo";
    timeoutSeconds: number;
    probe: ProbeSpec;
  }): Promise<ProbeEvaluation>;
};

export async function runCertification({
  runtime,
  sandboxId,
  workspace,
  timeoutSeconds,
  candidateCommand,
  controlCommand,
  assertion,
}: {
  runtime: ProbeRuntime;
  sandboxId: string;
  workspace: "workspace/repo";
  timeoutSeconds: number;
  candidateCommand: string;
  controlCommand: string;
  assertion: IssueEvidenceAssertion;
}) {
  if (candidateCommand.trim() === controlCommand.trim()) {
    throw new Error("Candidate and control commands must exercise different cases.");
  }
  const candidate = candidateCommand.toLowerCase();
  const control = controlCommand.toLowerCase();
  const signatureTokens = assertion.value
    .toLowerCase()
    .match(/[a-z0-9_-]{5,}/g) ?? [];
  const reusedToken = signatureTokens.find(
    (token) => candidate.includes(token) && control.includes(token),
  );
  if (reusedToken) {
    throw new Error(
      "The negative control reuses the reported signature instead of isolating it.",
    );
  }

  const shared = { sandboxId, workspace, timeoutSeconds };
  const candidateProbe = {
    command: candidateCommand,
    assertions: [assertion],
  } satisfies ProbeSpec;
  const controlProbe = {
    command: controlCommand,
    assertions: [assertion],
  } satisfies ProbeSpec;

  const firstCandidate = await runtime.runProbe({
    ...shared,
    probe: candidateProbe,
  });
  const secondCandidate = await runtime.runProbe({
    ...shared,
    probe: candidateProbe,
  });
  const controlRun = await runtime.runProbe({
    ...shared,
    probe: controlProbe,
  });

  return certifyEvidence({
    candidateRuns: [firstCandidate, secondCandidate],
    controlRun,
  });
}
