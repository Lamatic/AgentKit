# SQL Query Explainer

## Overview
This AgentKit template solves the problem of quickly understanding any SQL query — no matter its complexity — without having to run it or ask a colleague. It is implemented as a **single-flow** API-invoked pipeline: an API request triggers an LLM analysis step, and the result is returned as a structured JSON object. The primary caller is a developer tool, internal portal, code review system, or any automation that needs an on-demand "explain this SQL" capability.

---

## Purpose
The goal of this agent is to reduce the time and cognitive overhead required to understand an unfamiliar SQL query. After it runs, the caller receives a compact structured breakdown that captures what the query does, how each clause contributes, what performance risks exist, and how to improve it — without needing to execute the query or consult a DBA.

Operationally, the agent accepts a raw SQL query string (any dialect), passes it to an LLM with a strict JSON-output system prompt, and returns a structured explanation object. This makes it suitable for developer portals, code review automations, SQL learning tools, data engineering onboarding flows, and any system that needs consistent, structured SQL documentation at scale.

Because this kit is a template with a single flow, all behaviour is concentrated in one pipeline. If you extend it (e.g., adding dialect detection, multi-query batching, or storage of past explanations), the existing flow remains the canonical entrypoint for "SQL query → explanation".

## Flows

### SQL Query Explainer

- Trigger
  - Invocation: API call via a GraphQL-triggered request node (`graphqlNode`) exposed by the AgentKit runtime.
  - Expected input shape:
    - A payload containing the `query` field.
    - The flow is designed around "SQL in, explanation out"; the GraphQL field name is `query` (string — the raw SQL query to analyse).
  - Input notes: Any valid SQL query string is accepted. Multi-statement queries, CTEs, subqueries, window functions, and dialect-specific syntax are all supported. The LLM will do its best to infer the dialect.

- What it does
  1. `API Request` (`graphqlNode`)
     - Accepts the incoming GraphQL/API request from the caller.
     - Validates and surfaces the `query` field to downstream nodes as `{{triggerNode_1.output.query}}`.
  2. `Explain Query` (`LLMNode`)
     - Runs an LLM analysis with a structured system prompt that instructs the model to return valid JSON only.
     - System prompt (`sql-query-explainer_explain-query_system.md`) defines the output schema and rules.
     - User prompt (`sql-query-explainer_explain-query_user.md`) injects the raw query as `{{triggerNode_1.output.query}}`.
     - Produces `generatedResponse` — a JSON string containing the full explanation object.
  3. `API Response` (`graphqlResponseNode`)
     - Formats and returns the explanation to the caller as the `explanation` field in the API response.

- When to use this flow
  - Use when a developer needs to quickly understand an unfamiliar SQL query.
  - Use in a code review pipeline to auto-generate SQL change descriptions.
  - Use in a developer onboarding tool to help new engineers understand existing queries.
  - Use in a data engineering portal to document complex analytical queries.
  - Use in a SQL learning application to explain queries step by step.

- When not to use this flow
  - Do not use when you need to execute the query and retrieve actual data.
  - Do not use for extremely large queries (200+ lines) without chunking — LLM context windows may be strained.
  - Do not use as a replacement for database-native EXPLAIN / EXPLAIN ANALYZE plans when diagnosing real execution bottlenecks.
