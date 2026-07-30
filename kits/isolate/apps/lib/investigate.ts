import { createDaytonaRuntime } from "./runtime/daytona";
import {
  InvalidCertificationPlanError,
  runCertification,
  runTuiUnsavedExitCertification,
  validateCertificationCommands,
} from "./runtime/certification";
import { tryDeriveIssueEvidenceAssertion } from "./runtime/claim";
import { createGitHubIssueReader } from "./runtime/github";
import {
  assertExploratoryCommand,
  normalizeCertificationCommand,
  UnsafeCommandError,
} from "./runtime/policy";
import { requestLamaticPlan, requestLamaticReport } from "./lamatic-planner";
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
const directEvidenceRepairFeedback =
  "The previous plan only ran tests, so it did not reproduce the user's symptom. Return a terminal plan whose candidate executes the user-facing repository product and emits the reported behavior directly. For CLI layout/wrapping issues, run the CLI with the same checked-in fixture in both commands; use COLUMNS=20 for candidate and COLUMNS=120 for control when supported. Test commands are forbidden for this exploratory probe.";
const testOnlyCommandPattern = /\b(?:bun|npm|pnpm|yarn)\s+(?:run\s+)?test\b/i;

function repositoryFallbackPlan(repositoryContext: string, issueText: string) {
  const script = ["dev", "cli", "start"].find((name) =>
    new RegExp(`"${name}"\\s*:`).test(repositoryContext),
  );
  if (!script || !repositoryContext.includes("README.md")) return null;
  if (/\bstream(?:s|ed|ing)?\b/i.test(issueText)) {
    const runner = `bun run ${script} -- --stream`;
    return {
      hypothesis: "Compare a UTF-8 character split across stdin chunks with an intact control.",
      candidateCommand: `(printf '\\342'; sleep 0.1; printf '\\202\\254\\n') | ${runner}`,
      controlCommand: `printf '\\342\\202\\254\\n' | ${runner}`,
    };
  }
  return {
    hypothesis: "Compare direct product output under narrow and wide terminal widths.",
    candidateCommand: `COLUMNS=20 bun run ${script} -- README.md`,
    controlCommand: `COLUMNS=120 bun run ${script} -- README.md`,
  };
}

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
    reporter?: typeof requestLamaticReport;
  } = {},
) {
  const issueReader = dependencies.issueReader ?? createGitHubIssueReader();
  const runtime = dependencies.runtime ?? createDaytonaRuntime();
  const planner = dependencies.planner ?? requestLamaticPlan;
  const reporter = dependencies.reporter ?? requestLamaticReport;
  const deadline = new InvestigationDeadline();
  const issue = await deadline.run(
    (signal) => issueReader.read(input.issueUrl, { signal }),
    { maximumMilliseconds: 10_000 },
  );
  let assertion = tryDeriveIssueEvidenceAssertion(issue);
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
    assertion ??= tryDeriveIssueEvidenceAssertion(
      issue,
      snapshot.observation.stdout,
    );

    const evidenceGuidance =
      assertion?.kind === "tui_unsaved_exit"
        ? "Runtime evidence mode: tui_unsaved_exit. Return mode=tui_unsaved_exit, one repository-owned build script as setupCommand, and one repository-owned command that launches the TUI without a fixture argument. Dependencies are already installed; setupCommand must build, never install. Inspect workspace package manifests and use the structured relative Bun workspace form when a root wrapper cannot forward the runtime-injected file argument. Inspect the repository launcher and tests for a repository-defined environment variable that points it at the native binary produced by setupCommand; when present, prefix command with that variable and its build output so launch never downloads after network isolation. Resolve every build-artifact path from the effective working directory of command; when command uses bun --cwd, adjust the path for that directory. The runtime owns the fixture, PTY keystrokes, file assertion, repeat, and save control."
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
      const validateExploratoryCommands = (candidateCommand: string, controlCommand: string) => {
        assertExploratoryCommand(candidateCommand);
        assertExploratoryCommand(controlCommand);
        if (candidateCommand.trim() === controlCommand.trim()) {
          throw new InvalidCertificationPlanError();
        }
      };
      let terminalPlan;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          if ("mode" in plan || testOnlyCommandPattern.test(plan.candidateCommand)) {
            throw new InvalidCertificationPlanError();
          }
          const normalized = {
            ...plan,
            candidateCommand: normalizeCertificationCommand(plan.candidateCommand),
            controlCommand: normalizeCertificationCommand(plan.controlCommand),
          };
          validateExploratoryCommands(
            normalized.candidateCommand,
            normalized.controlCommand,
          );
          terminalPlan = normalized;
          break;
        } catch (error) {
          if (
            !(error instanceof UnsafeCommandError) &&
            !(error instanceof InvalidCertificationPlanError)
          ) throw error;
          if (attempt === 2) {
            terminalPlan = repositoryFallbackPlan(
              snapshot.observation.stdout,
              `${issue.title}\n${issue.body}`,
            ) ?? undefined;
            if (!terminalPlan) throw error;
            validateExploratoryCommands(
              terminalPlan.candidateCommand,
              terminalPlan.controlCommand,
            );
            break;
          }
          plan = await requestPlan(directEvidenceRepairFeedback);
        }
      }
      if (!terminalPlan) throw new InvalidCertificationPlanError();
      const run = async (command: string, remainingProbes: number) => {
        await runtime.resetWorkspace({
          ...sandbox,
          timeoutSeconds: deadline.probeTimeoutSeconds(20, remainingProbes + 1),
        }, deadline);
        return runtime.runProbe({
          ...sandbox,
          timeoutSeconds: deadline.probeTimeoutSeconds(25, remainingProbes),
          probe: { command, assertions: [{ kind: "exit_code", equals: 0 }] },
        }, deadline);
      };
      const candidateRuns = [
        await run(terminalPlan.candidateCommand, 3),
        await run(terminalPlan.candidateCommand, 2),
      ] as const;
      const controlRun = await run(terminalPlan.controlCommand, 1);
      const boundedEvidence = JSON.stringify({
        hypothesis: terminalPlan.hypothesis,
        candidateRuns,
        controlRun,
      }).slice(0, 45_000);
      const reportInput = {
          issue: JSON.stringify(issue),
          repositoryContext: boundedEvidence,
          ref: ref ?? "default branch",
          policyFeedback:
            "REPORT_MODE. Analyze only supplied runtime observations. Return strict JSON under report with outcome likely_reproduced, not_reproduced, or inconclusive; summary; expectedBehavior; actualBehavior; reproductionSteps; evidence; limitations; markdown. Never claim runtime certification. Distinguish recorded facts from model interpretation.",
      };
      const requestReport = () => deadline.run(
        (signal) => reporter(reportInput, { signal }),
        { maximumMilliseconds: 20_000 },
      );
      let report;
      try {
        report = await requestReport();
      } catch {
        report = await requestReport();
      }
      return {
        issue,
        ref: ref ?? "default",
        hypothesis: report.summary,
        setup: null,
        outcome: report.outcome,
        verdictOwner: "lamatic" as const,
        gate: null,
        evidence: { candidateRuns, controlRun },
        report: { format: "markdown" as const, content: report.markdown },
        analysis: report,
      };
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
