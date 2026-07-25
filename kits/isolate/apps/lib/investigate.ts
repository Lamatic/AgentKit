import { createDaytonaRuntime } from "./runtime/daytona";
import { runCertification } from "./runtime/certification";
import { extractIssueEvidenceAssertion } from "./runtime/claim";
import { createGitHubIssueReader } from "./runtime/github";
import { requestLamaticPlan } from "./lamatic-planner";
import { InvestigationDeadline } from "./deadline";

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
  const deadline = new InvestigationDeadline();
  const issue = await issueReader.read(input.issueUrl);
  const assertion = extractIssueEvidenceAssertion(issue.body);
  const ref = input.ref?.trim() || "main";
  const sandbox = await runtime.create({ repositoryUrl: issue.repositoryUrl, ref });

  try {
    const snapshot = await runtime.runProbe({
      ...sandbox,
      timeoutSeconds: deadline.probeTimeoutSeconds(20, 5),
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
    let setup = null;
    if (plan.setupCommand) {
      setup = await runtime.runProbe({
        ...sandbox,
        timeoutSeconds: deadline.probeTimeoutSeconds(30, 4),
        probe: {
          command: plan.setupCommand,
          assertions: [{ kind: "exit_code", equals: 0 }],
        },
      });
      if (!setup.passed) {
        throw new Error("Repository setup failed before the reproduction probe.");
      }
    }

    const certification = await runCertification({
      runtime,
      ...sandbox,
      timeoutSeconds: deadline.probeTimeoutSeconds(30, 3),
      candidateCommand: plan.candidateCommand,
      controlCommand: plan.controlCommand,
      assertion,
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
