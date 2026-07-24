# Isolate

> Turn vague GitHub issues into verified reproduction evidence.

Isolate investigates public GitHub issues inside disposable sandboxes. A Lamatic
planner interprets the issue and repository snapshot, forms a hypothesis, and chooses probes. A
deterministic runtime executes those probes, evaluates explicit assertions, and
records evidence. The agent can investigate; it cannot declare its own work
successful.

## Status

The reviewer UI, Lamatic planner flow, authenticated MCP runtime, Daytona
sandbox adapter, bounded probe execution, and repeat-plus-control evidence gate
are deployed and covered by automated tests.

## Why Isolate

Issue reports often describe symptoms without recording the repository state,
setup, command, or environment needed to observe them. Isolate converts that
ambiguity into an auditable report:

1. Isolate deterministically fetches and normalizes the public GitHub issue.
2. Isolate creates a private, expiring Daytona sandbox and clones the public
   repository at the requested ref.
3. The runtime captures a bounded repository snapshot and asks the deployed
   Lamatic flow for a hypothesis, probe commands, and explicit assertions.
4. Isolate enforces its command policy and captures exit code, stdout, stderr,
   and duration for every run.
5. A reproduction is certified only after two passing candidate runs and a
   negative control that rejects the same hypothesis.

The language model explores. The deterministic runtime verifies.

## Runtime tools

| Tool | Purpose |
| --- | --- |
| `echo` | Verify authenticated Lamatic-to-runtime connectivity. |
| `get_github_issue` | Fetch and normalize one public GitHub issue without repository credentials. |
| `create_sandbox` | Clone a public GitHub repository into an expiring private sandbox. |
| `run_probe` | Execute one bounded command and evaluate explicit assertions. |
| `certify_reproduction` | Run the candidate twice and a negative control once, then return structured JSON evidence and a portable Markdown report. |
| `delete_sandbox` | Delete the sandbox after evidence collection. |

`reproduced` is unavailable to the agent unless the deterministic evidence gate
passes. Failed or non-specific probes become
`not_reproduced_under_tested_conditions`.

The certification response preserves the complete machine-readable evidence and
includes a Markdown artifact with the outcome, commands, assertions, exit codes,
durations, stdout, and stderr for both candidate runs and the negative control.

## Local verification

Requirements: Bun and Node.js 20 or newer.

```bash
cd kits/isolate/apps
bun install
bun test
bun run typecheck
bun run build
```

The deployed application requires:

- `ISOLATE_RUNTIME_SECRET`: bearer secret configured in Lamatic's saved MCP
  connection headers.
- `DAYTONA_API_KEY`: server-side credential used only to create and manage
  sandboxes.
- `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_URL`, and
  `ISOLATE_REPRODUCTION_FLOW_ID`: server-side access to the deployed planner.

Add the runtime URL under **Connections → MCP/Tools** in Lamatic and configure
`Authorization: Bearer <ISOLATE_RUNTIME_SECRET>` in the saved connection. Do
not place either credential inside an agent prompt or inline code node.

The reviewer-facing application is deployed at
https://isolate-agentkit.vercel.app. Its public investigation endpoint is
rate-limited; the MCP endpoint separately requires the saved bearer secret.

## Evaluation fixture

The public [Isolate CLI testbed](https://github.com/Dhruv2mars/isolate-cli-testbed)
contains a service-dependent CLI and a deliberately incomplete bug report. It
tests whether the agent can discover the setup, environment, and invocation
needed to produce specific repeatable evidence rather than follow hardcoded
reproduction instructions.

## Scope and safety

- Public GitHub repositories only.
- Node.js, TypeScript, Bun, and terminal/CLI issues are the initial target.
- Private, non-public sandboxes with a 30-minute maximum lifetime.
- Commands are bounded to 120 seconds.
- Captured stdout and stderr are redacted and capped at 64 KiB each.
- No repository credentials are mounted in the sandbox.
- No pushes, package publication, pull requests, or fix generation.
- Repository and issue contents are treated as untrusted input.
