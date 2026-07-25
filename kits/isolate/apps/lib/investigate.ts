import { createDaytonaRuntime } from "./runtime/daytona";
import { runCertification } from "./runtime/certification";
import {
  MissingIssueEvidenceContractError,
  tryExtractIssueEvidenceAssertion,
} from "./runtime/claim";
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
    runtime?: Pick<ReturnType<typeof createDaytonaRuntime>, "create" | "runProbe" | "resetWorkspace" | "delete">;
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
  const assertion = tryExtractIssueEvidenceAssertion(issue.body);
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

    const plan = await deadline.run(
      (signal) =>
        planner(
          {
            issue: JSON.stringify(issue),
            repositoryContext: snapshot.observation.stdout,
            ref: ref ?? "default branch",
          },
          { signal },
        ),
      { maximumMilliseconds: 25_000 },
    );
    if (!assertion) {
      throw new MissingIssueEvidenceContractError(plan.hypothesis);
    }
    const certification = await runCertification({
      runtime,
      ...sandbox,
      deadline,
      candidateCommand: plan.candidateCommand,
      controlCommand: plan.controlCommand,
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
