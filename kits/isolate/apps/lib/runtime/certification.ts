import type { IssueEvidenceAssertion } from "./claim";
import { certifyEvidence } from "./evidence";
import type { ProbeEvaluation, ProbeSpec } from "./probe";
import { assertCertificationCommand } from "./policy";

type ProbeRuntime = {
  resetWorkspace(input: {
    sandboxId: string;
    workspace: "workspace/repo";
  }): Promise<void>;
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
  assertCertificationCommand(candidateCommand, assertion.value);
  assertCertificationCommand(controlCommand, assertion.value);
  if (candidateCommand.trim() === controlCommand.trim()) {
    throw new Error("Candidate and control commands must exercise different cases.");
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

  await runtime.resetWorkspace({ sandboxId, workspace });
  const firstCandidate = await runtime.runProbe({
    ...shared,
    probe: candidateProbe,
  });
  await runtime.resetWorkspace({ sandboxId, workspace });
  const secondCandidate = await runtime.runProbe({
    ...shared,
    probe: candidateProbe,
  });
  await runtime.resetWorkspace({ sandboxId, workspace });
  const controlRun = await runtime.runProbe({
    ...shared,
    probe: controlProbe,
  });

  return certifyEvidence({
    candidateRuns: [firstCandidate, secondCandidate],
    controlRun,
  });
}
