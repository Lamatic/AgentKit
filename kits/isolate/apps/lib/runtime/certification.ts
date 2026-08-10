import type { OutputIssueEvidenceAssertion } from "./claim";
import { certifyEvidence } from "./evidence";
import type { ProbeEvaluation, ProbeSpec } from "./probe";
import { assertCertificationCommand } from "./policy";
import type { InvestigationDeadline } from "../deadline";

type OutputEvidenceAssertion = OutputIssueEvidenceAssertion;

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

type TuiProbeRuntime = {
  prepareTuiWorkspace(input: {
    sandboxId: string;
    workspace: "workspace/repo";
    timeoutSeconds: number;
    setupCommand: string;
  }, deadline: InvestigationDeadline): Promise<void>;
  resetTuiWorkspace(input: {
    sandboxId: string;
    workspace: "workspace/repo";
    timeoutSeconds: number;
  }, deadline: InvestigationDeadline): Promise<void>;
  runTuiUnsavedExitProbe(input: {
    sandboxId: string;
    workspace: "workspace/repo";
    timeoutSeconds: number;
    command: string;
    quitKey: "ctrl_q";
    saveBeforeQuit: boolean;
  }, deadline: InvestigationDeadline): Promise<ProbeEvaluation>;
};

/**
 * Raised when a plan cannot produce a meaningful candidate/control comparison.
 */
export class InvalidCertificationPlanError extends Error {
  constructor() {
    super("Candidate and control commands must exercise different cases.");
    this.name = "InvalidCertificationPlanError";
  }
}

/**
 * Check both commands against the command policy and require them to differ, so
 * the control genuinely varies a condition rather than repeating the candidate.
 *
 * @throws {UnsafeCommandError} or {InvalidCertificationPlanError} on rejection.
 */
export function validateCertificationCommands({
  candidateCommand,
  controlCommand,
  assertion,
}: {
  candidateCommand: string;
  controlCommand: string;
  assertion: OutputEvidenceAssertion;
}) {
  assertCertificationCommand(candidateCommand, assertion.value);
  assertCertificationCommand(controlCommand, assertion.value);
  if (candidateCommand.trim() === controlCommand.trim()) {
    throw new InvalidCertificationPlanError();
  }
}

/**
 * Run the terminal certification sequence: the candidate twice and the negative
 * control once, each from a freshly reset workspace, then apply the evidence gate.
 */
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
  assertion: OutputEvidenceAssertion;
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

/**
 * Run the TUI unsaved-exit certification sequence.
 *
 * The runtime owns the fixture, the keystrokes, and the filesystem assertion: it
 * drives a real PTY, confirms the file is unchanged after the quit key twice, and
 * requires the save control to reject the same assertion.
 */
export async function runTuiUnsavedExitCertification({
  runtime,
  sandboxId,
  workspace,
  deadline,
  setupCommand,
  command,
  quitKey,
}: {
  runtime: TuiProbeRuntime;
  sandboxId: string;
  workspace: "workspace/repo";
  deadline: InvestigationDeadline;
  setupCommand: string;
  command: string;
  quitKey: "ctrl_q";
}) {
  assertCertificationCommand(setupCommand);
  assertCertificationCommand(command);
  await runtime.prepareTuiWorkspace(
    {
      sandboxId,
      workspace,
      timeoutSeconds: deadline.probeTimeoutSeconds(70, 2),
      setupCommand,
    },
    deadline,
  );

  const run = async (saveBeforeQuit: boolean, remainingProbes: number) => {
    await runtime.resetTuiWorkspace(
      {
        sandboxId,
        workspace,
        timeoutSeconds: deadline.probeTimeoutSeconds(20, remainingProbes + 1),
      },
      deadline,
    );
    return runtime.runTuiUnsavedExitProbe(
      {
        sandboxId,
        workspace,
        timeoutSeconds: deadline.probeTimeoutSeconds(25, remainingProbes),
        command,
        quitKey,
        saveBeforeQuit,
      },
      deadline,
    );
  };

  const firstCandidate = await run(false, 3);
  const secondCandidate = await run(false, 2);
  const controlRun = await run(true, 1);
  return certifyEvidence({
    candidateRuns: [firstCandidate, secondCandidate],
    controlRun,
  });
}
