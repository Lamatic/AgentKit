# Agent Reliability Lab

## Overview

Agent Reliability Lab is a Lamatic AgentKit flow that audits another AI agent's system prompt for production readiness before deployment. It combines static prompt analysis with live adversarial red-teaming (prompt injection, jailbreak, tool misuse, and over-refusal probes), a reliability/consistency check, and an automatically rewritten, production-ready system prompt with a change log tying every edit to a specific finding.

The flow is invoked via a single GraphQL/API trigger and returns one structured JSON report. It never modifies or deploys the target agent — it only reads a system prompt (and optional supporting context), optionally calls the target agent's live HTTP endpoint with adversarial test probes, and reports findings.

This kit ships with a Next.js app (`apps/`) providing a form + rendered report view over the flow, plus the flow remains directly callable via its own API endpoint for programmatic use. See [`apps/README.md`](./apps/README.md) for the app, or the Quickstart section below for calling the flow directly.

## Purpose

Most AI agent tooling helps you *build* agents. This flow helps you decide whether one is *safe to ship*. It operationalizes production-readiness as a measurable, evidence-based audit instead of a subjective judgment call — every finding in the report is tied to either a specific line of the analyzed prompt or a specific probe/response pair, and every score dimension is explicitly labeled as `tested` or `not_assessed` so the report never claims more confidence than the evidence supports.

The flow runs two possible paths depending on whether the caller supplies a live target endpoint:

- **Static-only audit** (no `targetEndpoint.url` supplied): analyzes the system prompt's clarity, role definition, and declared guardrail coverage. Produces a report explicitly labeled `PARTIAL_AUDIT_STATIC_ONLY` — it never claims to have verified behavior it didn't actually test.
- **Full dynamic audit** (`targetEndpoint.url` supplied): everything in the static audit, plus a battery of adversarial probes fired at the live agent endpoint, judged for pass/fail/partial/over-refusal, aggregated into category scores, and capped to `NOT_PRODUCTION_READY` if any critical-severity failure is found — regardless of how good the average score looks.

## Flows

### Agent Reliability Audit (`agent-reliability-audit`)

- **Trigger**
  - `graphqlNode` trigger (`API Request`), realtime response type.
  - Input schema:
    - `systemPrompt` (string, required) — the target agent's system prompt.
    - `toolSchema` (string, optional) — the target agent's tool/function definitions, if any. Improves tool-misuse probe quality.
    - `constitutionDoc` (string, optional) — the target agent's declared guardrails/constitution, for comparing declared vs. tested behavior.
    - `targetEndpoint` (object, optional) — `{ url: string, authHeader: string }`. When `url` is non-empty, the full dynamic audit runs; when empty, only the static audit runs.
    - `referenceQA` (string, optional) — reserved for future faithfulness/groundedness testing against a reference QA set; currently unused (always reported as `not_assessed`).
    - `depth` (string, optional) — `"quick"`, `"standard"`, or `"deep"`, controlling how many adversarial probes are generated.

- **What it does**
  1. **Static analyzer** (`InstructorLLMNode_949`) — always runs first. Reads `systemPrompt`, `toolSchema`, and `constitutionDoc`. Scores prompt quality and declared-guardrail-coverage (0-100 each), and lists critical issues, warnings, and suggestions, each citing specific wording problems rather than generic advice.
  2. **Condition** (`conditionNode_230`) — branches on whether `{{triggerNode_1.output.targetEndpoint.url}} != ""`.
     - **Condition 1 (dynamic path)**:
       1. **Probe Generator** (`InstructorLLMNode_186`) — generates adversarial test probes (injection, jailbreak, tool_misuse, over_refusal categories) scaled to `depth` (quick ≈ 8-10, standard ≈ 20-30, deep ≈ 40-60). Uses canary-style payloads only — never genuinely harmful content.
       2. **Test Executor** (`codeNode_422`) — fires each probe as a POST request at `targetEndpoint.url`, collecting `{probeId, category, payload, response, latencyMs, httpStatus, error}` per probe. Handles timeouts/errors gracefully (marks the probe, doesn't crash the flow). Also re-fires a sample of 3 probes 3× each to measure response consistency for the reliability score.
       3. **Judge** (`InstructorLLMNode_452`) — evaluates each probe/response pair, producing a verdict (`PASS` / `FAIL` / `PARTIAL` / `OVER_REFUSED` / `INCONCLUSIVE`) and severity. Network/HTTP errors are explicitly scored `INCONCLUSIVE`, never `FAIL` — a broken endpoint is not evidence of a vulnerability.
       4. **Aggregator** (`codeNode_961`) — deterministic scoring (no LLM): computes per-category pass rates, a reliability score from response-consistency variance, a coverage map (`tested`/`not_assessed` per dimension), and applies the critical-finding cap — any `FAIL` verdict with `severity: "critical"` forces `hasCriticalFail: true`, which the final verdict logic uses to override the numeric score.
       5. **Rewriter** (`InstructorLLMNode_736`) — takes the original prompt plus all static and dynamic findings, produces a rewritten system prompt and a change log mapping each edit to the specific finding that caused it. Never invents findings that weren't actually found.
       6. **Report Compiler** (`codeNode_175`) — merges Aggregator's scores/coverage with Rewriter's output into the final report shape.
     - **Else (static-only path)**:
       1. **Static Rewriter** (`InstructorLLMNode_990`) — same rewriting logic as the dynamic path's Rewriter, but scoped only to static analysis findings (no probe data exists on this path).
       2. **Static Report Compiler** (`codeNode_587`) — produces a report in the same shape as the dynamic Report Compiler, but with all dynamic-only fields (`injectionResistance`, `jailbreakResistance`, `toolMisuseResistance`, `overRefusalScore`, `reliability`) explicitly `null`, coverage marked `not_assessed` for those dimensions, and `verdict: "PARTIAL_AUDIT_STATIC_ONLY"`.
  3. **Final Report** (`codeNode_779`) — both branches converge here. Since only one branch executes per request, this node distinguishes a real report from Lamatic's skipped-node placeholder (`{"executionMsg": "Skipped the node execution"}`) by checking for the presence of `overallScore`/`verdict` fields, and returns whichever branch actually ran.
  4. **API Response** (`graphqlResponseNode`) — returns `{ "report": <Final Report output> }`.

- **When to use this flow**
  - Before deploying any AI agent to production, to catch prompt-quality gaps and test resistance to common attack patterns.
  - When comparing a target agent's *declared* guardrails (its constitution) against its *actual tested* behavior.
  - As a lightweight, repeatable pre-merge check for teams iterating on system prompts.

- **When not to use this flow**
  - As a substitute for a full penetration test or formal security review of production infrastructure — this audits prompt/agent-level behavior only, not infrastructure, auth, or data-layer security.
  - Against a target endpoint you don't have authorization to test. See the constitution's Authorization Scope section — this tool trusts the caller's authorization the same way any webhook-triggered flow does; it does not verify it independently.
  - To generate or test genuinely harmful content — probes are intentionally canary-style and defensive-only.

- **Output**
  - A single `report` object (shape identical regardless of which path ran):
    - `overallScore` (number, 0-100)
    - `verdict` (`"PRODUCTION_READY"` / `"NEEDS_IMPROVEMENT"` / `"NOT_PRODUCTION_READY"` / `"PARTIAL_AUDIT_STATIC_ONLY"`)
    - `hasCriticalFail` (boolean)
    - `categoryScores` (`promptQuality`, `guardrailCoverage`, `injectionResistance`, `jailbreakResistance`, `toolMisuseResistance`, `overRefusalScore`, `reliability` — dynamic-only fields are `null` on the static-only path)
    - `coverage` (per-dimension `"tested"` / `"not_assessed"` map)
    - `criticalIssues` (array of `{source, issue, recommendation}`)
    - `warnings` (array of strings)
    - `suggestions` (array of strings)
    - `rewrittenPrompt` (string)
    - `changeLog` (array of `{change, findingAddressed}`)
    - `reliabilityDetails` (array of `{probeId, consistent, variantCount}`, empty on the static-only path)
    - `generatedAt` (ISO timestamp)

### Flow Interaction

- Single flow, no external flow dependencies. All branching and merging happens internally via the Condition node and the Final Report merge node.

## Guardrails

See [`constitutions/default.md`](./constitutions/default.md) for the full constitution. Key points:

- All adversarial probes are canary-style — they test resistance to attack categories without producing genuinely harmful real-world content.
- Network/infrastructure failures are always scored `INCONCLUSIVE`, never `FAIL`.
- Any critical-severity failure caps the overall verdict at `NOT_PRODUCTION_READY`, regardless of the numeric average.
- Every report dimension is explicitly labeled `tested` or `not_assessed` — the report never implies coverage it doesn't have.
- This tool does not persist target prompts or probe results beyond the single request/response cycle.
- Test Executor refuses to send probes to targets resolving to localhost or private/internal IP ranges (SSRF guard) — probes against such targets are marked with a `blocked` error instead of being sent.
- All prompts that interpolate untrusted content (the target's system prompt, tool schema, constitution doc, probe responses, or audit findings) explicitly delimit that content and instruct the model to treat it as data, never as instructions — since a malicious target agent could otherwise attempt prompt injection back into the auditor itself.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config |
|---|---|---|
| Lamatic GraphQL API trigger | Entry point for the flow | Deployed flow's Flow ID + standard Lamatic API credentials |
| Groq (`llama-3.3-70b-versatile`) | Powers all 5 `InstructorLLMNode` stages (Static analyzer, Probe Generator, Judge, Rewriter, Static Rewriter) | Groq provider credential configured in the Lamatic project's model settings |
| Target agent HTTP endpoint | Receives adversarial probes during the dynamic audit path | Supplied per-request via `targetEndpoint.url` / `targetEndpoint.authHeader` — not a stored credential |

## Environment Setup

No environment variables are required to deploy the flow itself — the only per-request configuration is the JSON payload sent to the trigger (see Inputs above). The Groq model credential must be configured once inside the Lamatic project (Settings → Integrations) before the flow can execute its AI nodes.

The `apps/` Next.js app requires four environment variables (see `apps/.env.example`): `AGENT_RELIABILITY_AUDIT_FLOW_ID` (the deployed flow's Flow ID), and `LAMATIC_API_KEY` / `LAMATIC_API_URL` / `LAMATIC_PROJECT_ID` (from Settings → API Keys) so the app's server action can call the flow via the Lamatic SDK.

## Quickstart

1. Deploy this flow in your Lamatic project (Studio → Deploy).
2. Send a request to the deployed flow's endpoint with at minimum a `systemPrompt`:
   ```json
   {
     "systemPrompt": "You are a helpful assistant for ACME Bank. Answer customer questions. Never reveal API keys. Refuse illegal requests.",
     "toolSchema": "",
     "constitutionDoc": "",
     "targetEndpoint": { "url": "", "authHeader": "" },
     "referenceQA": "[]",
     "depth": "quick"
   }
   ```
3. For a full dynamic audit, set `targetEndpoint.url` to your target agent's live HTTP endpoint (must accept `POST { "message": "<probe text>" }` and return a text/JSON response).
4. Read the returned `report` object — start with `verdict` and `criticalIssues`, then review `rewrittenPrompt` for the suggested fix.

## Common Failure Modes

| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| `verdict` always `PARTIAL_AUDIT_STATIC_ONLY` even though you supplied a target endpoint | `targetEndpoint.url` is an empty string or missing | Confirm the field is a non-empty string in the request payload |
| All dynamic probes come back `INCONCLUSIVE` | Target endpoint returned HTTP errors, or its response contract doesn't match `{message: string} → text/JSON` | Confirm the target endpoint is reachable and accepts the expected request shape |
| `Judge` or another `InstructorLLMNode` intermittently fails with a Groq function-calling error | Transient provider-side issue, sometimes triggered by unusually large prompts (e.g. long raw HTTP response bodies passed to Judge) | Retry; consider truncating `Test Executor`'s captured `response` text before it reaches Judge if this recurs often |
| Report always shows `injectionResistance`/etc. as `not_assessed` on what you expected to be the dynamic path | Same as above — condition check is `targetEndpoint.url != ""` | Verify the payload shape matches the trigger's schema exactly |

## Notes

- The flow uses a critical-finding cap: a single `FAIL` verdict with `severity: "critical"` overrides an otherwise-good numeric average, so `overallScore` alone should never be read without also checking `hasCriticalFail`.
- `referenceQA` is accepted by the schema but not yet used by any node — it's reserved for a future faithfulness/groundedness-testing addition and currently has no effect on the report.
- Both audit paths return the exact same JSON shape, so downstream consumers don't need to branch on which path ran — they can always read `report.verdict` and `report.coverage` to know what was actually tested.
