# Ride-Hailing Text-to-SQL Analytics Assistant

## Overview

A conversational analytics assistant over a ride-hailing operations dataset. Ask a question in plain English — "How many trips happened this year?" — and get back a validated, read-only SQL query, the actual query results, a natural-language answer, and a suggested chart type. Follow-up questions in the same session ("now break that down by pickup city") are understood in context, without needing to restate the original question.

## Purpose

Most text-to-SQL demos handle a single, isolated question well but fall apart on natural conversational follow-ups, and many skip query safety entirely. This kit addresses both: a session-scoped memory pattern lets the SQL Generator see the prior turn's question and query, and a dedicated guardrail step enforces SELECT-only, LIMIT-bounded queries before anything touches the database.

## Flow Architecture

Single flow, sequential steps:

1. **API Request Trigger** — accepts `{ question, sessionId }`.
2. **Session Memory (read)** — looks up the most recent `question`/`sql`/`answer` for this `sessionId` from a `memory_table`, if one exists.
3. **Schema Context** — returns a structured description of the target table's columns, so the SQL Generator doesn't need schema knowledge baked into its prompt.
4. **SQL Generator** — an instructor LLM step that produces `{ sql, explanation }`. Given the schema, the current question, and the prior turn's question/SQL (if any), it either writes a new query or extends the previous one for follow-up questions. Outputs an empty `sql` string (never `null`) when a question can't be answered from the schema.
5. **SQL Guardrail** — validates the generated SQL is a single SELECT statement, blocks dangerous keywords, and appends a LIMIT clause if missing.
6. **Conditional routing** — only proceeds to execution if the guardrail marks the query valid.
7. **Execute Query** — POSTs the validated SQL to a small external API route backed by a read-only Postgres role, which runs the query and returns rows.
8. **Result Interpreter** — an instructor LLM step that turns the raw query rows into a natural-language `answer` and a suggested `chartType`.
9. **Session Memory (write)** — inserts or updates the `memory_table` row for this `sessionId` with the latest `question`, `sql`, and `answer`, so the next turn in the same session has context.
10. **API Response** — returns `{ answer, chartType, sql, results }`.

## Guardrails

- The SQL Generator is instructed to only ever produce `SELECT` statements, to always include a `LIMIT` clause, and to never reference columns outside the provided schema.
- The SQL Guardrail step independently re-validates the query is SELECT-only and free of dangerous keywords before it's allowed to execute — the LLM's own instruction-following is not the only line of defense.
- SQL execution runs against a dedicated **read-only** database role at the connection level, not just an application-layer check, so even a guardrail bypass cannot mutate data.
- When a question can't be answered with the available schema, the SQL Generator returns an empty string rather than fabricating a plausible-looking but unanswerable query.
- The session memory read step is guarded in the prompt itself: if no prior question/SQL exists for a session, the model is explicitly instructed to treat the turn as a new conversation rather than inferring false context from empty fields.

## Integration Reference

- **Trigger:** API Request (`question`, `sessionId`)
- **Output:** `{ answer, chartType, sql, results }` returned via API Response
- **External dependency:** a small SQL-execution API (see `apps/` and this kit's README for setup) that validates and runs the generated SQL against your Postgres/Supabase instance using a read-only role
- See `flows/ride-hailing-text-to-sql.ts` for the full node graph and the `prompts/`, `model-configs/`, and `scripts/` directories for prompt text, model selection, and guardrail code.
