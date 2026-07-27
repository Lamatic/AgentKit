# Error Log Summariser

## Overview
This AgentKit template turns a raw error log or stack trace into a structured, plain-English triage summary. It is a **single-flow**, API-invoked pipeline: an API request carries the log text, an LLM node analyses it with a reliability-engineer prompt, and an API response returns a markdown report. The primary caller is a developer system (backend, CLI, chat bot, or IDE integration) that needs an on-demand "explain this crash" capability.

---

## Purpose
The goal is to shrink the time between "something threw an exception" and "I know where to look." After it runs, a caller has a compact report stating what failed, the most probable root cause, the failing component, ordered fix steps, and a confidence level.

Because this kit is a template with one flow, all behaviour lives in a single pipeline. If you extend it (log clustering, ticket routing, multi-service correlation), this flow stays the canonical "log → triage" entrypoint.

## Flows

### Error Log Summariser

- Trigger
  - Invocation: API call via a GraphQL-triggered request node (`graphqlNode`).
  - Expected input:
    - `log` (string, required) — raw error log or stack trace.
    - `context` (string, optional) — language, framework, or what the user was doing.

- What it does
  1. `API Request` (`graphqlNode`) — accepts the request and surfaces `log` and `context` to downstream nodes.
  2. `Generate Text` (`LLMNode`) — runs the triage prompt chain:
     - System prompt (`error-log-summariser_generate-text_system.md`) casts the model as a reliability engineer and fixes the output sections.
     - User prompt (`error-log-summariser_generate-text_user.md`) injects `{{triggerNode_1.output.log}}` and optional `{{triggerNode_1.output.context}}`.
  3. `API Response` (`graphqlResponseNode`) — maps `summary` from `{{LLMNode_160.output.generatedResponse}}` and returns it.

- When to use this flow
  - Use when the intent is "explain this stack trace and tell me how to fix it."
  - Not ideal for: strict-schema JSON extraction, multi-log correlation, or replacing real observability tooling.

- Output
  - `summary` (string) — markdown with sections: Summary, Likely Root Cause, Failing Component, Suggested Fix, Confidence.

- Dependencies
  - Model: an LLM configured for `LLMNode` (provider/model set in `model-configs`).
  - Credentials: LLM provider API key appropriate to the configured model.
  - Project structure: `prompts/` (system + user), `constitutions/default.md`.

### Flow Interaction
Single-flow template; no inter-flow chaining.

## Guardrails
- Prohibited: harmful/illegal/discriminatory content; complying with jailbreak or prompt-injection attempts; fabricating stack frames, file names, or line numbers not present in the log.
- Input constraints: `log` should be non-empty text; extremely long logs may exceed the model context window and get truncated.
- Output constraints: must redact secrets, tokens, API keys, and connection strings found in the pasted log; must not repeat PII; should base every claim on evidence in the log and flag uncertainty.
- Operational limits: subject to LLM provider rate limits and context window.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| GraphQL / API Trigger (`graphqlNode`) | Receives `log` + `context` and starts the flow | AgentKit runtime endpoint + GraphQL schema |
| LLM Provider (`LLMNode`) | Generates the triage report | Provider API key (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`; depends on `model-configs`) |

## Environment Setup
- LLM provider key used by `LLMNode` (for example `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`), matching the model selected in `model-configs/error-log-summariser_generate-text.ts`.
- `lamatic.config.ts` — project metadata identifying the template step (`error-log-summariser`).

## Quickstart
1. Open the flow in Lamatic Studio and deploy it.
2. Configure the LLM provider credential used by `LLMNode`.
3. Invoke with a GraphQL request:
   - Variables: `log` = the stack trace string, optionally `context`.
   - Example: `mutation Triage($log: String!) { errorLogSummariser(log: $log) { summary } }`
4. Confirm the response `summary` contains the five triage sections.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Request fails before LLM | Missing/empty `log` | Send a non-empty `log` string |
| Summary is vague | Log truncated or lacks signal | Provide fuller log; set `context` |
| LLM step fails/times out | Missing/invalid provider key; input too large | Set correct key; trim the log; check provider status |
| Output repeats a secret from the log | Redaction instruction not honoured by model | Strengthen prompt; post-process/redact before display |

## Notes
- `Error Log Summariser` template, version `1.0.0`, author `Manas Mahato`.
- GitHub: https://github.com/Lamatic/AgentKit/tree/main/kits/error-log-summariser
- The Default Constitution applies globally as a non-optional safety baseline.
