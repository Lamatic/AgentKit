import { createDaytonaRuntime } from "./runtime/daytona";
import {
  InvalidCertificationPlanError,
  runCertification,
  runTuiUnsavedExitCertification,
  validateCertificationCommands,
} from "./runtime/certification";
import {
  MissingIssueEvidenceContractError,
  tryDeriveIssueEvidenceAssertion,
} from "./runtime/claim";
import { createGitHubIssueReader } from "./runtime/github";
import {
  normalizeCertificationCommand,
  UnsafeCommandError,
} from "./runtime/policy";
import { requestLamaticPlan } from "./lamatic-planner";
import { InvestigationDeadline } from "./deadline";

const repositorySnapshotCommand = [
  "printf '%s\\n' '--- files ---'",
  "find . -maxdepth 3 -type f -not -path './.git/*' | sort | head -200",
  "printf '%s\\n' '--- package.json ---'",
  "test ! -f package.json || sed -n '1,240p' package.json",
  "printf '%s\\n' '--- workspace package manifests ---'",
  "find . -mindepth 2 -maxdepth 4 -name 'package.json' -not -path '*/node_modules/*' -not -path './.git/*' | sort | head -20 | while IFS= read -r file; do printf '\\n--- %s ---\\n' \"$file\"; sed -n '1,240p' \"$file\"; done",
  "printf '%s\\n' '--- README ---'",
  "test ! -f README.md || sed -n '1,320p' README.md",
  "printf '%s\\n' '--- relevant source and tests ---'",
  "find . -maxdepth 5 -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' -o -name '*.cjs' \\) -not -path '*/node_modules/*' -not -path './.git/*' | sort | head -80 | while IFS= read -r file; do printf '\\n--- %s ---\\n' \"$file\"; sed -n '1,240p' \"$file\"; done",
].join("; ");

const planRepairFeedback =
  "The previous plan was rejected by the runtime policy. Return repository-owned run/test commands only. Do not use eval, inline interpreters, shell output construction, or paths outside the repository. Runner-level options are forbidden except the structured relative Bun workspace form: bun run --cwd <relative-package-directory> <script>. For script arguments, put -- immediately after the script name. Never put -- after a script argument.";

export async function investigateIssue(
  input: { issueUrl: string; ref?: string },
  dependencies: {
    issueReader?: Pick<ReturnType<typeof createGitHubIssueReader>, "read">;
    runtime?: Pick<
      ReturnType<typeof createDaytonaRuntime>,
      | "create"
      | "runProbe"
      | "resetWorkspace"
      | "prepareTuiWorkspace"
      | "resetTuiWorkspace"
      | "runTuiUnsavedExitProbe"
      | "delete"
    >;
    planner?: typeof requestLamaticPlan;
  } = {},
) {
  const issueReader = dependencies.issueReader ?? createGitHubIssueReader();
  const runtime = dependencies.runtime ?? createDaytonaRuntime();
  const planner = dependencies.planner ?? requestLamaticPlan;
  const deadline = new InvestigationDeadline();
  const issue = await deadline.run(
    (signal) => issueReader.read(input.issueUrl, { signal }),
    { maximumMilliseconds: 10_000 },
  );
  const assertion = tryDeriveIssueEvidenceAssertion(issue);
  const ref = input.ref?.trim();
  const sandbox = await runtime.create(
    {
      repositoryUrl: issue.repositoryUrl,
      ...(ref ? { ref } : {}),
    },
    deadline,
  );

  try {
    const snapshot = await runtime.runProbe(
      {
        ...sandbox,
        timeoutSeconds: deadline.probeTimeoutSeconds(20, 5),
        probe: {
          command: repositorySnapshotCommand,
          assertions: [{ kind: "exit_code", equals: 0 }],
        },
      },
      deadline,
    );
    if (!snapshot.passed) {
      throw new Error("Isolate could not inspect the repository at the requested ref.");
    }

    const evidenceGuidance =
      assertion?.kind === "tui_unsaved_exit"
        ? "Runtime evidence mode: tui_unsaved_exit. Return mode=tui_unsaved_exit, one repository-owned build script as setupCommand, and one repository-owned command that launches the TUI without a fixture argument. Dependencies are already installed; setupCommand must build, never install. Inspect workspace package manifests and use the structured relative Bun workspace form when a root wrapper cannot forward the runtime-injected file argument. Inspect the repository launcher and tests for a repository-defined environment variable that points it at the native binary produced by setupCommand; when present, prefix command with that variable and its repository-relative build output so launch never downloads after network isolation. The runtime owns the fixture, PTY keystrokes, file assertion, repeat, and save control."
        : "";
    const requestPlan = (policyFeedback = evidenceGuidance) =>
      deadline.run(
        (signal) =>
          planner(
            {
              issue: JSON.stringify(issue),
              repositoryContext: snapshot.observation.stdout,
              ref: ref ?? "default branch",
              policyFeedback,
            },
            { signal },
          ),
        { maximumMilliseconds: 25_000 },
      );
    let plan = await requestPlan();
    if (!assertion) {
      throw new MissingIssueEvidenceContractError(plan.hypothesis);
    }
    if (assertion.kind === "tui_unsaved_exit") {
      if (!("mode" in plan) || plan.mode !== "tui_unsaved_exit") {
        plan = await requestPlan(
          `${evidenceGuidance} The previous response used the wrong plan shape.`,
        );
      }
      if (!("mode" in plan) || plan.mode !== "tui_unsaved_exit") {
        throw new InvalidCertificationPlanError();
      }
      const certification = await runTuiUnsavedExitCertification({
        runtime,
        ...sandbox,
        deadline,
        setupCommand: plan.setupCommand,
        command: plan.command,
        quitKey: assertion.quitKey,
      });
      return {
        issue,
        ref: ref ?? "default",
        hypothesis: plan.hypothesis,
        setup: plan.setupCommand,
        ...certification,
      };
    }
    if ("mode" in plan) throw new InvalidCertificationPlanError();
    const normalizeTerminalPlan = <T extends {
      candidateCommand: string;
      controlCommand: string;
    }>(terminalPlan: T) => ({
      ...terminalPlan,
      candidateCommand: normalizeCertificationCommand(terminalPlan.candidateCommand),
      controlCommand: normalizeCertificationCommand(terminalPlan.controlCommand),
    });
    let terminalPlan = normalizeTerminalPlan(plan);
    try {
      validateCertificationCommands({
        candidateCommand: terminalPlan.candidateCommand,
        controlCommand: terminalPlan.controlCommand,
        assertion,
      });
    } catch (error) {
      if (
        !(error instanceof UnsafeCommandError) &&
        !(error instanceof InvalidCertificationPlanError)
      ) {
        throw error;
      }
      plan = await requestPlan(planRepairFeedback);
      if ("mode" in plan) throw new InvalidCertificationPlanError();
      terminalPlan = normalizeTerminalPlan(plan);
      validateCertificationCommands({
        candidateCommand: terminalPlan.candidateCommand,
        controlCommand: terminalPlan.controlCommand,
        assertion,
      });
    }
    const certification = await runCertification({
      runtime,
      ...sandbox,
      deadline,
      candidateCommand: terminalPlan.candidateCommand,
      controlCommand: terminalPlan.controlCommand,
      assertion,
    });

    return {
      issue,
      ref: ref ?? "default",
      hypothesis: plan.hypothesis,
      setup: null,
      ...certification,
    };
  } finally {
    await runtime.delete(sandbox.sandboxId, deadline);
  }
}
