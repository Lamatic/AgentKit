# Error Log Summariser

Paste a raw error log or stack trace, get back a plain-English triage report: what failed, the likely root cause, the failing component, concrete fix steps, and a confidence level.

A single-flow Lamatic **template** — no UI, no scraper, no env vars beyond your LLM provider key.

## What it does

```
API Request (log, context)  →  LLM (triage prompt)  →  API Response (summary)
```

1. **API Request** — accepts `log` (required) and `context` (optional).
2. **Generate Text (LLM)** — a reliability-engineer system prompt analyses the log and produces a fixed-section report.
3. **API Response** — returns the report as `summary`.

## Inputs

| Field | Type | Required | Description |
|---|---|---|---|
| `log` | string | Yes | Raw error log or stack trace to analyse. |
| `context` | string | No | Language, framework, or what you were doing. |

## Output

`summary` (markdown string) with these sections:

- **Summary** — one or two sentences on what failed.
- **Likely Root Cause** — ranked most-probable first, referencing the exception/file/line when present.
- **Failing Component** — the module, service, or dependency at fault.
- **Suggested Fix** — ordered, concrete next steps.
- **Confidence** — `high` / `medium` / `low` with a reason.

## Example

Input `log`:

```
Traceback (most recent call last):
  File "app/handlers.py", line 42, in get_user
    return db.query(User).filter(User.id == uid).one()
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) could not connect to server: Connection refused
```

Output `summary` (abridged):

> **Summary** — The request failed because the app could not reach the PostgreSQL database.
> **Likely Root Cause** — `OperationalError: connection refused` at `handlers.py:42` — the DB server is down or the host/port is wrong.
> **Failing Component** — SQLAlchemy/psycopg2 database connection layer.
> **Suggested Fix** — 1. Confirm Postgres is running and reachable. 2. Check the connection string host/port. 3. Verify network/firewall rules. 4. Add a startup health check.
> **Confidence** — high: the exception names a refused connection directly.

## Setup

1. Open the flow in [Lamatic Studio](https://studio.lamatic.ai) and click **Deploy**.
2. Set the LLM provider credential used by the `Generate Text` node (for example `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`), matching the model in `model-configs/error-log-summariser_generate-text.ts`.
3. Invoke via GraphQL:

   ```graphql
   mutation Triage($log: String!, $context: String) {
     errorLogSummariser(log: $log, context: $context) {
       summary
     }
   }
   ```

## Guardrails

- Bases claims on evidence in the log; flags uncertainty instead of inventing stack frames.
- Redacts secrets, tokens, and connection strings found in the pasted log.
- Governed by `constitutions/default.md`.

## Files

| Path | Purpose |
|---|---|
| `lamatic.config.ts` | Template metadata |
| `flows/error-log-summariser.ts` | The flow (nodes + edges + references) |
| `prompts/*_system.md`, `*_user.md` | Triage prompt |
| `model-configs/*.ts` | LLM model config |
| `constitutions/default.md` | Safety baseline |
| `agent.md` | Agent capability doc |
