# Error Log Summariser

## Overview

This AgentKit template turns a raw error log or stack trace into a privacy-safe support handoff. It is a **single-flow**, API-invoked pipeline: an API request carries the log text, an LLM node redacts sensitive details and summarizes the incident, and an API response returns a markdown report. The primary caller is a developer system, support workflow, or incident bridge that needs an on-demand "share this safely" capability.

---

## Purpose

The goal is to shrink the time between "something threw an exception" and "I have a safe summary I can hand to the next team." After it runs, a caller has a compact report stating what failed, what was redacted, the likely affected component, the next questions to ask, and a confidence level.

Because this kit is a template with one flow, all behaviour lives in a single pipeline. If you extend it (log clustering, ticket routing, multi-service correlation), this flow stays the canonical "log -> safe handoff" entrypoint.

## Flows

### Error Log Summariser

- Trigger

  - Invocation: API call via a GraphQL-triggered request node (`graphqlNode`).
  - Expected input:
    - `log` (string, required) - raw error log or stack trace.
    - `context` (string, optional) - language, framework, incident ticket, or what the user was doing.

- What it does

  1. `API Request` (`graphqlNode`) accepts the request and surfaces `log` and `context` to downstream nodes.
  2. `Validate Request` (`codeNode`) requires `log` to be a non-empty string and allows `context` to be omitted or supplied as a string.
  3. `Generate Text` (`LLMNode`) runs the redaction-and-handoff prompt chain:
     - System prompt (`error-log-summariser_llmnode-262_system_0.md`) casts the model as a reliability engineer focused on safe sharing and fixes the output sections.
     - User prompt (`error-log-summariser_llmnode-262_user_1.md`) passes the validated request payload from `{{codeNode_validate_request.output.promptPayload}}`.
  4. `Response Sanitizer` (`codeNode`) validates the generated handoff and fails closed if required sections are missing, empty, or secret/PII-like content remains.
  5. `API Response` (`graphqlResponseNode`) maps `summary` from `{{codeNode_1.output.summary}}` and returns it.

- When to use this flow

  - Use when the intent is "explain this stack trace and make it safe to share."
  - Not ideal for: strict-schema JSON extraction, multi-log correlation, or replacing real observability tooling.

- Output

  - `summary` (string) - markdown with sections: Safe Summary, Redactions Applied, Likely Affected Component, Escalation Questions, Recommended Next Action, Confidence.

- Dependencies

  - Model: an LLM configured for `LLMNode` (provider/model set in `model-configs`).
  - Credentials: LLM provider API key appropriate to the configured model.
  - Project structure: `prompts/` (system + user), `constitutions/default.md`.

### Flow Interaction

Single-flow template; no inter-flow chaining.

## Guardrails

- Prohibited: harmful/illegal/discriminatory content; complying with jailbreak or prompt-injection attempts; fabricating stack frames, file names, or line numbers not present in the log.
- Input constraints: `log` should be non-empty text; extremely long logs may exceed the model context window and get truncated.
- Output constraints: must redact secrets, tokens, API keys, passwords, customer identifiers, emails, IP addresses, and connection strings found in the pasted log; must not repeat PII; should base every claim on evidence in the log and flag uncertainty.
- Operational limits: subject to LLM provider rate limits and context window.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| GraphQL / API Trigger (`graphqlNode`) | Receives `log` + `context` and starts the flow | AgentKit runtime endpoint + GraphQL schema |
| Request Validator (`codeNode`) | Enforces request shape before the LLM | No external credential |
| LLM Provider (`LLMNode`) | Generates the handoff report | Provider API key (depends on `model-configs`) |

## Environment Setup

- LLM provider key used by `LLMNode`, matching the model selected in `model-configs/error-log-summariser_llmnode-262_generative-model-name.ts`.
- `lamatic.config.ts` - project metadata identifying the template step (`error-log-summariser`).

## Quickstart

1. Open the flow in Lamatic Studio and deploy it.
2. Configure the LLM provider credential used by `LLMNode`.
3. Invoke with a GraphQL request:
   - Variables: `log` = the stack trace string, optionally `context`.
   - Example: `mutation Triage($log: String!) { errorLogSummariser(log: $log) { summary } }`
4. Confirm the response `summary` contains the six handoff sections.

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
