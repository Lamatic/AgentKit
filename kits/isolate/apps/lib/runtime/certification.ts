import type { IssueEvidenceAssertion } from "./claim";
import { certifyEvidence } from "./evidence";
import type { ProbeEvaluation, ProbeSpec } from "./probe";
import { assertCertificationCommand } from "./policy";
import type { InvestigationDeadline } from "../deadline";

type ProbeRuntime = {
  resetWorkspace(input: {
    sandboxId: string;
    workspace: "workspace/repo";
    timeoutSeconds: number;
  }): Promise<void>;
  runProbe(input: {
    sandboxId: string;
    workspace: "workspace/repo";
    timeoutSeconds: number;
    probe: ProbeSpec;
  }): Promise<ProbeEvaluation>;
};

export function validateCertificationCommands({
  candidateCommand,
  controlCommand,
  assertion,
}: {
  candidateCommand: string;
  controlCommand: string;
  assertion: IssueEvidenceAssertion;
}) {
  assertCertificationCommand(candidateCommand, assertion.value);
  assertCertificationCommand(controlCommand, assertion.value);
  if (candidateCommand.trim() === controlCommand.trim()) {
    throw new Error("Candidate and control commands must exercise different cases.");
  }
}

export async function runCertification({
  runtime,
  sandboxId,
  workspace,
  deadline,
  candidateCommand,
  controlCommand,
  assertion,
}: {
  runtime: ProbeRuntime;
  sandboxId: string;
  workspace: "workspace/repo";
  deadline: Pick<InvestigationDeadline, "probeTimeoutSeconds">;
  candidateCommand: string;
  controlCommand: string;
  assertion: IssueEvidenceAssertion;
}) {
  validateCertificationCommands({ candidateCommand, controlCommand, assertion });
  const shared = { sandboxId, workspace };
  const candidateProbe = {
    command: candidateCommand,
    assertions: [assertion],
  } satisfies ProbeSpec;
  const controlProbe = {
    command: controlCommand,
    assertions: [assertion],
  } satisfies ProbeSpec;

  await runtime.resetWorkspace({
    sandboxId,
    workspace,
    timeoutSeconds: deadline.probeTimeoutSeconds(20, 6),
  });
  const firstCandidate = await runtime.runProbe({
    ...shared,
    timeoutSeconds: deadline.probeTimeoutSeconds(25, 5),
    probe: candidateProbe,
  });
  await runtime.resetWorkspace({
    sandboxId,
    workspace,
    timeoutSeconds: deadline.probeTimeoutSeconds(20, 4),
  });
  const secondCandidate = await runtime.runProbe({
    ...shared,
    timeoutSeconds: deadline.probeTimeoutSeconds(25, 3),
    probe: candidateProbe,
  });
  await runtime.resetWorkspace({
    sandboxId,
    workspace,
    timeoutSeconds: deadline.probeTimeoutSeconds(20, 2),
  });
  const controlRun = await runtime.runProbe({
    ...shared,
    timeoutSeconds: deadline.probeTimeoutSeconds(25, 1),
    probe: controlProbe,
  });

  return certifyEvidence({
    candidateRuns: [firstCandidate, secondCandidate],
    controlRun,
  });
}
