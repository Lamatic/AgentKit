# Error Log Summariser

Paste a raw error log or stack trace and get back a privacy-safe support handoff: what happened, what sensitive values were redacted, the likely affected component, escalation questions, and the safest next action.

A single-flow Lamatic **template** with no UI, no scraper, and no app-level environment variables.

## What it does

```text
API Request (log, context) -> LLM (redaction + handoff prompt) -> API Response (summary)
```

1. **API Request** accepts `log` (required) and `context` (optional).
2. **Generate Text (LLM)** redacts sensitive values, summarizes impact, and creates a handoff note.
3. **API Response** returns the report as `summary`.

## Why this is different

AgentKit already includes broad debugging assistants. This template focuses on a narrower operational problem: turning messy logs into a safe artifact that can be shared with support, security, or another engineering team without leaking tokens, passwords, connection strings, or customer identifiers.

## Inputs

| Field | Type | Required | Description |
|---|---|---|---|
| `log` | string | Yes | Raw error log or stack trace to analyse. |
| `context` | string | No | Language, framework, environment, incident ticket, or caller context. |

## Output

`summary` is a markdown string with these sections:

- **Safe Summary** - one or two sentences on what happened.
- **Redactions Applied** - categories of sensitive data removed or masked.
- **Likely Affected Component** - the module, service, or dependency most involved.
- **Escalation Questions** - missing details support or engineering needs next.
- **Recommended Next Action** - concrete first step.
- **Confidence** - `high`, `medium`, or `low` with a reason.

## Example

Input `log`:

```text
Traceback (most recent call last):
  File "app/handlers.py", line 42, in get_user
    return db.query(User).filter(User.id == uid).one()
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) could not connect to server: Connection refused
```

Output `summary` abridged:

> **Safe Summary** - The request failed because the app could not reach the PostgreSQL database.
> **Redactions Applied** - No obvious secrets found.
> **Likely Affected Component** - SQLAlchemy/psycopg2 database connection layer.
> **Escalation Questions** - Was Postgres running at the time? Did the connection host or port change recently?
> **Recommended Next Action** - Confirm Postgres is reachable from the app runtime and verify the connection string.
> **Confidence** - high: the exception names a refused connection directly.

## Setup

1. Open the flow in [Lamatic Studio](https://studio.lamatic.ai) and click **Deploy**.
2. Set the LLM provider credential used by the `Generate Text` node, matching the model in `model-configs/error-log-summariser_llmnode-262_generative-model-name.ts`.
3. Invoke via GraphQL:

   ```graphql
   mutation Triage($log: String!, $context: String) {
     errorLogSummariser(log: $log, context: $context) {
       summary
     }
   }
   ```

## Guardrails

- Bases claims on evidence in the log and flags uncertainty instead of inventing stack frames.
- Redacts secrets, tokens, passwords, customer identifiers, and connection strings found in the pasted log.
- Governed by `constitutions/default.md`.

## Files

| Path | Purpose |
|---|---|
| `lamatic.config.ts` | Template metadata |
| `flows/error-log-summariser.ts` | Flow nodes, edges, and references |
| `prompts/error-log-summariser_llmnode-262_system_0.md`, `prompts/error-log-summariser_llmnode-262_user_1.md` | Handoff and redaction prompts |
| `model-configs/*.ts` | LLM model config |
| `constitutions/default.md` | Safety baseline |
| `agent.md` | Agent capability doc |
