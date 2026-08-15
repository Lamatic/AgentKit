# Ride-Hailing Text-to-SQL Analytics Assistant

Ask questions about a ride-hailing operations dataset in plain English and get back a validated SQL query, the actual results, a natural-language answer, and a suggested chart type. Follow-up questions in the same session ("now break that down by pickup city") are understood in context — no need to restate the original question.

## Why this is different from a single-shot text-to-SQL demo

Most text-to-SQL examples handle one isolated question well and stop there. This kit adds two things most demos skip: **conversational memory** (a session-scoped read/write pattern that lets follow-up questions build on the previous query) and a **dedicated safety layer** that independently re-validates every generated query is read-only before it's allowed to run — not just prompt instructions the model might ignore.

## Architecture

```text
API Request (question, sessionId)
    → Session Memory (read) — prior question/sql for this session, if any
    → Schema Context — column descriptions for the target table
    → SQL Generator — writes a new query, or extends the prior one for follow-ups
    → SQL Guardrail — independently verifies SELECT-only, blocks dangerous keywords, enforces LIMIT
    → [only if valid] Execute Query — runs the SQL via a read-only-role-backed API
    → Result Interpreter — natural-language answer + suggested chart type
    → Session Memory (write) — upsert this session's question/sql/answer
    → API Response (answer, chartType, sql, results)
```

## Setup

### 1. Build the flow in Lamatic Studio

The flow lives in [`flows/ride-hailing-text-to-sql.ts`](./flows/ride-hailing-text-to-sql.ts). Import it into [Lamatic Studio](https://studio.lamatic.ai), set a model on each of the two LLM nodes (SQL Generator, Result Interpreter), and point the **Execute Query** node's URL at your own deployed SQL-execution API (step 2 below). **Deploy** the flow and copy the deployed **Flow ID**.

This kit's SQL Guardrail step uses an empty string (`""`), not `null`, to represent "cannot answer" — Lamatic's Zod schema builder does not currently support nullable/union types, so downstream logic should check for an empty string rather than `null`/`undefined`.

### 2. Deploy the SQL-execution API

Lamatic doesn't currently have a built-in node for executing arbitrary, dynamically-generated SQL against an external Postgres database synchronously. This kit ships a small Next.js API route that fills that gap — it accepts a SQL string, re-validates it's a SELECT statement, and runs it against your database using a **dedicated read-only Postgres role** (not just an application-layer check).

You'll need your own Postgres/Supabase database with a compatible schema (see `scripts/` for the expected `lamatic.trips`-style columns referenced in the Schema Context step), and a **read-only** database role/connection string — do not point this at a role with write access.

Deploy the API route (in `apps/`) to Vercel or any Node hosting provider, and set:

| Variable | Description |
|---|---|
| `READONLY_DB_URL` | Postgres connection string using a **read-only** role |
| `EXECUTE_SQL_SECRET` | A random shared secret; the route rejects requests without a matching `x-api-secret` header |

Then, in Lamatic Studio, store `EXECUTE_SQL_SECRET` under **Settings → Secrets** and reference it in the Execute Query node's headers as `{{secrets.project.EXECUTE_SQL_SECRET}}` rather than pasting the literal value — this keeps the secret out of flow exports.

### 3. Run the chat app

```bash
cd kits/ride-hailing-analytics/apps
cp .env.example .env.local     # fill in the values below
npm install
npm run dev                    # http://localhost:3000
```

### Environment variables

| Variable | Where to find it |
|---|---|
| `LAMATIC_FLOW_ID` | Studio → deploy the flow → copy Flow ID |
| `LAMATIC_API_URL` | Studio → Settings → API Docs → Endpoint |
| `LAMATIC_PROJECT_ID` | Studio → Project settings |
| `LAMATIC_API_KEY` | Studio → Settings → API Keys |

## Try it

1. Ask a question: "How many trips happened this year?"
2. Ask a follow-up in the same session: "Now break that down by pickup city."
3. The second answer builds on the first query's filters automatically, without you needing to repeat "this year."

## Design notes

- **Read-only enforcement is layered, not single-point.** The SQL Generator is prompted to only write SELECTs; the Guardrail step independently re-checks this; and the database connection itself uses a role with no write privileges. Any one layer failing doesn't expose write access.
- **Memory is session-scoped and explicit, not implicit.** The read-side lookup is a simple keyed table select, not a vector or fuzzy match — deterministic and easy to reason about. The prompt explicitly handles the empty-session case so a fresh conversation isn't contaminated by hallucinated "prior" context.
- **The SQL-execution API is a deliberate, documented external dependency**, not hidden platform magic — Lamatic doesn't yet have a synchronous "run this ad-hoc SQL string" node, so this kit is explicit about filling that gap rather than working around it silently.

## Future improvements

- **Full chat history, not just one turn of memory.** `memory_table` currently stores only the *most recent* question/SQL/answer per session (an upsert target, not an append-only log) — enough for the SQL Generator to understand a single follow-up, but not enough to reconstruct or browse a full conversation. Supporting real chat history would mean changing the write-side to insert a new row per turn instead of updating one row per session, and adding a read endpoint the UI could page through. Left out of this submission to keep the scope focused on the core text-to-SQL + single-turn-follow-up problem.

Built on [Lamatic](https://lamatic.ai).
