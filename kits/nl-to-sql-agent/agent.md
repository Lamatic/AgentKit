# Queryline

## Overview

Queryline turns plain-English questions into safe, read-only Microsoft SQL Server (T-SQL) queries. A business user types a question, and the agent generates a `SELECT` statement, validates it for safety, optionally executes it against a read-only SQL Server database, and returns both the SQL and a plain-language explanation.

## Purpose

The goal is to remove the barrier of knowing SQL: anyone can ask a question in natural language and get a safe, governed answer. The system keeps things read-only by automatically rejecting any query that is not a single `SELECT`, and by bounding result sizes with SQL Server `TOP`.

## Flows

### `nl-to-sql-flow` (Active Flow ID: `0b890b4d-dd30-4f33-9663-4311c896e1b5`)

#### Trigger

- **Invocation type:** API request via a GraphQL trigger node (`API Request`) or a direct Lamatic SDK call.
- **Expected input shape:**
  - `question` (string): The natural language question about the database.

#### What it does

Step-by-step walkthrough of the node chain:

1. **API Request (triggerNode / graphqlNode)** — receives the user's `question`.
2. **Generate SQL (LLMNode)** — converts the question into a single T-SQL `SELECT` statement, grounded in the schema described in its prompt.
3. **Validate SQL (codeNode)** — checks the generated SQL for safety:
   - Must start with `SELECT`.
   - Must not contain multiple statements.
   - Must not contain write/DDL keywords (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, `TRUNCATE`, `MERGE`, `CALL`, `EXEC`, `EXECUTE`).
   - Automatically enforces a maximum result limit of 1000 rows by normalizing `TOP` clauses:
     - Adds `TOP 1000` if no `TOP` clause is present.
     - Caps any `TOP` value exceeding 1000 to `TOP 1000`.
   - Outputs `{ safeSql, isSafe, error?, limitCapped? }`.
4. **Is SQL Safe? (conditionNode)** — routes based on `isSafe`:
   - **Safe** → continues to Execute SQL.
   - **Unsafe** → skips execution; the unsafe `originalSql` and the validation error flow to the aggregation node, which returns a structured blocked response (no results, no executable SQL).
5. **Execute SQL (mssqlNode)** — runs the validated `safeSql` against Microsoft SQL Server (only reached when the query is safe).
6. **Explain SQL (LLMNode)** — produces a plain-language explanation of what the query does.
7. **Aggregate Response (codeNode)** — combines the SQL, explanation, safety flag, results, row count, and any error into one structured response.
8. **API Response (graphqlResponseNode)** — returns the structured result to the caller.

#### When to use this flow

Use this flow whenever a user supplies a natural language question about a Microsoft SQL Server database and expects a safe, read-only SQL query, a plain-language explanation, and optionally the query results. If you have a single data-querying entrypoint, route all such requests here.

#### Output

The flow returns a JSON object with these fields:

- `sql` — the validated and normalized `SELECT` query (with `TOP` enforced to maximum 1000).
- `originalSql` — the SQL as generated, before `TOP` normalization (present when validation ran).
- `explanation` — plain-language explanation of what the query does.
- `isSafe` — `"true"` or `"false"` indicating whether the query passed safety validation.
- `results` — array of rows returned when the query is safe and execution succeeds.
- `rowCount` — number of rows returned.
- `error` — error message from any step that fails.
- `warnings` — array of warning messages (e.g., when result limit was capped or no results returned).
- `limitCapped` — `true` when the `TOP` value was reduced to 1000, otherwise `false`.

The Next.js app consumes this contract in `apps/actions/orchestrate.ts`, which normalizes the flow fields and derives the `summary`, `insights`, `suggestions`, and `followUpQuestions` fields for the UI.

#### Dependencies

- **Lamatic runtime & project configuration** — `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`.
- **Flow selection / routing** — `NL_TO_SQL_FLOW_ID` (the deployed Flow ID for `nl-to-sql-flow`).
- **LLM provider(s)** — configured in Lamatic Studio for the SQL-generation and explanation nodes.
- **Microsoft SQL Server** — connection configured in Lamatic Studio for schema context and (safe) query execution; a read-only user is recommended.
- **Prompts** — system/user prompts for SQL generation and explanation (`prompts/`).
- **Scripts** — SQL safety validation and response aggregation (`scripts/`).
- **Constitution** — guardrails in `constitutions/default.md`.

## Guardrails

- **Prohibited tasks**
  - Must not generate or execute write/DDL operations (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, `TRUNCATE`, `MERGE`, `CALL`, `EXEC`, `EXECUTE`).
  - Must not execute multiple SQL statements in a single request.
  - Query results are automatically limited to a maximum of 1000 rows (via normalized `TOP` clauses).
- **Input constraints**
  - `question` must be provided and is treated as potentially adversarial input.
  - Empty or nonsensical input should be handled gracefully.
- **Output constraints**
  - Must not output raw database credentials or connection strings.
  - SQL output must be validated as read-only and safe before execution.
  - Explanations must be in plain language suitable for non-technical users.
  - User is informed when the result limit was capped via a warning message.
- **Operational limits**
  - Requires the Lamatic environment variables to be present at runtime.
  - Query execution depends on Microsoft SQL Server availability.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic Flow Runtime (API) | Execute the deployed flow with the Lamatic project | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| AgentKit Flow ID Routing | Select the deployed flow instance | `NL_TO_SQL_FLOW_ID` |
| LLM Provider (via Lamatic) | Generate SQL and explanations | Configured in Lamatic Studio |
| Microsoft SQL Server (via Lamatic) | Query execution for safe queries | Configured in Lamatic Studio (read-only user recommended) |
| Next.js App (UI) | User-facing chat interface | App runtime; consumes the env vars above |

## Environment Setup

- `LAMATIC_API_URL` — Base URL for the Lamatic API.
- `LAMATIC_PROJECT_ID` — Lamatic project identifier.
- `LAMATIC_API_KEY` — API key for the Lamatic project.
- `NL_TO_SQL_FLOW_ID` — Deployed Flow ID for `nl-to-sql-flow`, obtained from Lamatic Studio after deployment.
- `SESSION_PASSWORD` — Password (≥ 32 chars) used by `iron-session` to sign the session cookie.
- `DEMO_AUTH_ENABLED` — When set to `"true"`, enables the built-in demo login using `DEMO_USERNAME` / `DEMO_PASSWORD`. Demo authentication is disabled by default (fail-closed); there are no hardcoded default credentials.
- `DEMO_USERNAME` / `DEMO_PASSWORD` — Demo credentials for the local dev login (only honored when `DEMO_AUTH_ENABLED=true`); do not ship real credentials.
- `MSSQL_SERVER`, `MSSQL_PORT`, `MSSQL_DATABASE`, `MSSQL_USER` — Optional SQL Server connection hints for the flow's node (credentials are typically stored in Lamatic Studio).

## Quickstart

1. In Lamatic Studio, create a project, deploy the `nl-to-sql-flow` ("Queryline"), and copy the resulting Flow ID.
2. In `apps/`, copy `.env.example` to `.env.local` and configure **all required environment variables**:
   - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — Lamatic runtime credentials
   - `NL_TO_SQL_FLOW_ID` — the deployed Flow ID from step 1
   - `SESSION_PASSWORD` — a strong random secret of at least 32 characters (replace the placeholder; never ship the example value)
   - `DEMO_AUTH_ENABLED=true` — enable the built-in demo login (required for local development)
   - `DEMO_USERNAME` and `DEMO_PASSWORD` — demo credentials for authentication (required when `DEMO_AUTH_ENABLED=true`)
3. Configure the Microsoft SQL Server connection in Lamatic Studio for the `mssqlNode` (a read-only user is recommended).
4. Install and run the app:
   - `npm install`
   - `npm run dev`
5. Open the app, sign in with the configured demo username and password, and ask a question (e.g. "How many customers are active?"). Verify you receive a safe read-only `SELECT` query, an explanation, and (when connected) query results.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Request fails with 401/403/auth error | Missing or incorrect `LAMATIC_API_KEY` / project mismatch | Re-copy keys from Lamatic Studio; ensure `LAMATIC_PROJECT_ID` matches the key scope |
| Flow not found / 404 / "invalid flow id" | `NL_TO_SQL_FLOW_ID` not set or points to a non-deployed flow | Deploy the flow in Lamatic Studio; update `NL_TO_SQL_FLOW_ID` |
| "Unsafe SQL" / blocked result | Generated SQL contains a write keyword or is not a single `SELECT` | Rephrase the question so the answer is a plain read-only query |
| Empty explanation | Explanation LLM node failed to produce output | Verify the explanation model config; retry the question |
| Blank / incomplete result | Remote model/API processed the query without returning data | Submit the same question again — a retry often returns the expected result |
| Query execution error | SQL Server connection or permission issue | Verify the SQL Server connection in Lamatic Studio; ensure the user has read access |
