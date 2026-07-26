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
  }, deadline: InvestigationDeadline): Promise<void>;
  runProbe(input: {
    sandboxId: string;
    workspace: "workspace/repo";
    timeoutSeconds: number;
    probe: ProbeSpec;
  }, deadline: InvestigationDeadline): Promise<ProbeEvaluation>;
};

export class InvalidCertificationPlanError extends Error {
  constructor() {
    super("Candidate and control commands must exercise different cases.");
    this.name = "InvalidCertificationPlanError";
  }
}

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
    throw new InvalidCertificationPlanError();
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
  deadline: InvestigationDeadline;
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
  }, deadline);
  const firstCandidate = await runtime.runProbe({
    ...shared,
    timeoutSeconds: deadline.probeTimeoutSeconds(25, 5),
    probe: candidateProbe,
  }, deadline);
  await runtime.resetWorkspace({
    sandboxId,
    workspace,
    timeoutSeconds: deadline.probeTimeoutSeconds(20, 4),
  }, deadline);
  const secondCandidate = await runtime.runProbe({
    ...shared,
    timeoutSeconds: deadline.probeTimeoutSeconds(25, 3),
    probe: candidateProbe,
  }, deadline);
  await runtime.resetWorkspace({
    sandboxId,
    workspace,
    timeoutSeconds: deadline.probeTimeoutSeconds(20, 2),
  }, deadline);
  const controlRun = await runtime.runProbe({
    ...shared,
    timeoutSeconds: deadline.probeTimeoutSeconds(25, 1),
    probe: controlProbe,
  }, deadline);

  return certifyEvidence({
    candidateRuns: [firstCandidate, secondCandidate],
    controlRun,
  });
}
