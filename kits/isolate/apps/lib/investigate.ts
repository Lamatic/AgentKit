import { createDaytonaRuntime } from "./runtime/daytona";
import { certifyEvidence } from "./runtime/evidence";
import { createGitHubIssueReader } from "./runtime/github";
import { assertSafeCommand } from "./runtime/plan";
import type { ProbeSpec } from "./runtime/probe";
import { requestLamaticPlan } from "./lamatic-planner";

const repositorySnapshotCommand = [
  "printf '%s\\n' '--- files ---'",
  "find . -maxdepth 3 -type f -not -path './.git/*' | sort | head -200",
  "printf '%s\\n' '--- package.json ---'",
  "test ! -f package.json || sed -n '1,240p' package.json",
  "printf '%s\\n' '--- README ---'",
  "test ! -f README.md || sed -n '1,320p' README.md",
  "printf '%s\\n' '--- relevant source and tests ---'",
  "find . -maxdepth 5 -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' -o -name '*.cjs' \\) -not -path '*/node_modules/*' -not -path './.git/*' | sort | head -80 | while IFS= read -r file; do printf '\\n--- %s ---\\n' \"$file\"; sed -n '1,240p' \"$file\"; done",
].join("; ");

export async function investigateIssue(
  input: { issueUrl: string; ref?: string },
  dependencies: {
    issueReader?: Pick<ReturnType<typeof createGitHubIssueReader>, "read">;
    runtime?: Pick<ReturnType<typeof createDaytonaRuntime>, "create" | "runProbe" | "delete">;
    planner?: typeof requestLamaticPlan;
  } = {},
) {
  const issueReader = dependencies.issueReader ?? createGitHubIssueReader();
  const runtime = dependencies.runtime ?? createDaytonaRuntime();
  const planner = dependencies.planner ?? requestLamaticPlan;
  const issue = await issueReader.read(input.issueUrl);
  const ref = input.ref?.trim() || "main";
  const sandbox = await runtime.create({ repositoryUrl: issue.repositoryUrl, ref });

  try {
    const snapshot = await runtime.runProbe({
      ...sandbox,
      timeoutSeconds: 30,
      probe: {
        command: repositorySnapshotCommand,
        assertions: [{ kind: "exit_code", equals: 0 }],
      },
    });
    if (!snapshot.passed) {
      throw new Error("Isolate could not inspect the repository at the requested ref.");
    }

    const plan = await planner({
      issue: JSON.stringify(issue),
      repositoryContext: snapshot.observation.stdout,
      ref,
    });
    [plan.setupCommand, plan.candidateCommand, plan.controlCommand]
      .filter(Boolean)
      .forEach(assertSafeCommand);

    let setup = null;
    if (plan.setupCommand) {
      setup = await runtime.runProbe({
        ...sandbox,
        timeoutSeconds: 120,
        probe: {
          command: plan.setupCommand,
          assertions: [{ kind: "exit_code", equals: 0 }],
        },
      });
      if (!setup.passed) {
        throw new Error("Repository setup failed before the reproduction probe.");
      }
    }

    const candidateProbe: ProbeSpec = {
      command: plan.candidateCommand,
      assertions: plan.candidateAssertions,
    };
    const controlProbe: ProbeSpec = {
      command: plan.controlCommand,
      assertions: plan.controlAssertions,
    };
    const firstCandidate = await runtime.runProbe({
      ...sandbox,
      timeoutSeconds: 120,
      probe: candidateProbe,
    });
    const secondCandidate = await runtime.runProbe({
      ...sandbox,
      timeoutSeconds: 120,
      probe: candidateProbe,
    });
    const controlRun = await runtime.runProbe({
      ...sandbox,
      timeoutSeconds: 120,
      probe: controlProbe,
    });
    const certification = certifyEvidence({
      candidateRuns: [firstCandidate, secondCandidate],
      controlRun,
    });

    return {
      issue,
      ref,
      hypothesis: plan.hypothesis,
      setup,
      ...certification,
    };
  } finally {
    await runtime.delete(sandbox.sandboxId).catch(() => undefined);
  }
}
