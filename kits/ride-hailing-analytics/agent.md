# Ride-Hailing Text-to-SQL Analytics Assistant

## Overview

A conversational analytics assistant over a ride-hailing operations dataset. Ask a question in plain English — "How many trips happened this year?" — and get back a validated, read-only SQL query, the actual query results, a natural-language answer, and a suggested chart type. Follow-up questions in the same session ("now break that down by pickup city") are understood in context, without needing to restate the original question.

## Purpose

Most text-to-SQL demos handle a single, isolated question well but fall apart on natural conversational follow-ups, and many skip query safety entirely. This kit addresses both: a session-scoped memory pattern lets the SQL Generator see the prior turn's question and query, and a dedicated guardrail step independently re-validates every generated query is safe, read-only, and free of injected instructions before anything touches the database or the response layer.

## Flow Architecture

Single flow, sequential steps:

1. **API Request Trigger** — accepts `{ question, sessionId }`.
2. **Session Memory (read)** — looks up the most recent `question`/`sql`/`answer` for this `sessionId` from `memory_table`, ordered by `updated_at DESC`, so a session with multiple prior turns reliably returns the latest one rather than an arbitrary row.
3. **Schema Context** — returns a structured description of the target table's columns, so the SQL Generator doesn't need schema knowledge baked into its prompt.
4. **SQL Generator** — an instructor LLM step that produces `{ sql, explanation }`. Given the schema, the current question, and the prior turn's question/SQL (if any), it either writes a new query or extends the previous one for follow-up questions. Outputs an empty `sql` string (never `null`) when a question can't be answered from the schema.
5. **SQL Guardrail** — independently re-validates the generated SQL before it's allowed anywhere near the database:
   - strips SQL comments before running any checks, so a blocked keyword or a second statement hidden inside a comment can't slip past validation
   - requires the query to be a single `SELECT` statement
   - rejects `SELECT ... INTO`, which can create tables or write data despite starting with `SELECT`
   - rejects multiple statements — a semicolon is only accepted as a single trailing terminator, not as a statement separator
   - blocks a broad set of write/DDL/admin keywords (`DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, `TRUNCATE`, `GRANT`, `REVOKE`, `CREATE`, `REPLACE`, `EXEC`, `EXECUTE`, `CALL`, `MERGE`, `ATTACH`, `DETACH`, `VACUUM`, `COPY`, `DO`), matched on word boundaries so it doesn't false-positive on substrings like a column named `updated_at`
   - enforces a hard cap of `LIMIT 500` — appended if missing, and reduced if the query already specifies something higher, rather than only handling the missing case
6. **Conditional routing** — the guardrail's validity determines which of two paths the flow takes:
   - **valid** → proceeds to execution (steps 7–8) and returns a full answer with real query results.
   - **invalid** → skips execution and the Result Interpreter entirely; a dedicated Code node builds a normalized `{ answer, chartType: "none", sql: "", results: [] }` response using the guardrail's rejection reason as the answer, so a rejected query still returns a clean, informative response instead of an empty or malformed one.
7. **Execute Query** — POSTs the validated SQL to a small external API route backed by a read-only Postgres role, which runs the query and returns rows. The request body is built via a dedicated Code node that `JSON.stringify()`s the payload, rather than manual string templating, so SQL text containing quotes or backslashes can't break the outgoing JSON.
8. **Result Interpreter** — an instructor LLM step that turns the raw query rows into a natural-language `answer` and a suggested `chartType`. The question, SQL, and results it receives are wrapped in `<data>` tags with an explicit instruction to treat that content as untrusted data, not commands — protecting against a question or a query result that contains text designed to look like an instruction.
9. **Session Memory (write)** — inserts or updates the `memory_table` row for this `sessionId` with the latest `question`, `sql`, and `answer`, so the next turn in the same session has context. Like the Execute Query step, the write payload is built via a dedicated Code node using `JSON.stringify()` rather than manual templating.
10. **API Response** — returns `{ answer, chartType, sql, results }`, sourced from whichever of the two paths (valid or rejected) actually ran.

## Guardrails

- The SQL Generator is instructed to only ever produce `SELECT` statements, to always include a `LIMIT` clause, and to never reference columns outside the provided schema.
- The SQL Guardrail step independently re-validates the query — SELECT-only, no `SELECT INTO`, no multiple statements, no blocked keywords, LIMIT capped at 500 — before it's allowed to execute. The LLM's own instruction-following is not the only line of defense.
- SQL execution runs against a dedicated **read-only** database role at the connection level, not just an application-layer check, so even a guardrail bypass cannot mutate data.
- Requests and writes built from LLM or user-supplied text (the Execute Query body and both Session Memory write payloads) are constructed via `JSON.stringify()` in dedicated Code nodes, not manual string templates, so SQL or answer text containing quotes or special characters can't produce malformed JSON or break out of its intended field.
- The Result Interpreter's prompt wraps all LLM/user-derived input in explicit `<data>` delimiters with an instruction to treat that content as data to summarize, not as commands — reducing the risk of a maliciously crafted question or a poisoned query result altering the model's behavior.
- When a question can't be answered with the available schema, the SQL Generator returns an empty string rather than fabricating a plausible-looking but unanswerable query.
- A rejected query (one that fails the Guardrail) still produces a complete, well-formed API response with a clear explanation, rather than an empty or broken one — the rejection path is a first-class branch of the flow, not an unhandled edge case.
- The session memory read step is guarded in the prompt itself: if no prior question/SQL exists for a session, the model is explicitly instructed to treat the turn as a new conversation rather than inferring false context from empty fields.

## Integration Reference

- **Trigger:** API Request (`question`, `sessionId`)
- **Output:** `{ answer, chartType, sql, results }` returned via API Response, populated from either the successful-execution path or the guardrail-rejection path depending on how the query validated.
- **External dependency:** a small SQL-execution API (see `apps/` and this kit's README for setup) that validates and runs the generated SQL against your Postgres/Supabase instance using a read-only role.
- See `flows/ride-hailing-text-to-sql.ts` for the full node graph and the `prompts/`, `model-configs/`, and `scripts/` directories for prompt text, model selection, and guardrail code.