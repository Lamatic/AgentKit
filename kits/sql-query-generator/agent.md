# SQL Query Generator Agent

## Overview
This agent converts natural language questions into optimized, read-only SQL queries. Users provide their database schema (as CREATE TABLE statements) and ask questions in plain English. The agent returns a well-structured SQL SELECT query along with an explanation, the tables used, any assumptions made, and a confidence score.

## Architecture
The agent uses a single Lamatic Flow with three nodes:
1. **API Request** — receives the database schema and question via GraphQL
2. **Generate Text (LLM)** — processes the inputs using a system prompt tuned for SQL generation
3. **API Response** — returns the generated SQL as a JSON string

## Key Design Decisions
- **Read-only queries only** — the agent is explicitly instructed to never generate INSERT, UPDATE, DELETE, DROP, or ALTER statements, making it safe for production use
- **Structured JSON output** — the response includes sql, explanation, tables_used, assumptions, and confidence fields for easy frontend parsing
- **Cross-database compatibility** — queries target standard SQL that works across PostgreSQL, MySQL, and SQLite
- **Explicit JOINs** — the agent prefers explicit JOIN syntax over implicit joins for readability

## Flows
1. `sql-query-generator` — the single flow that handles schema parsing, SQL generation, and response formatting
