# AI Database Release Planner

## Overview
This project turns a raw SQL database migration into a structured, production-oriented release report. It implements a **four-stage sequential agent pipeline** — migration understanding, PostgreSQL behavior analysis, deployment strategy planning, and release/rollback decision-making — where each stage receives the previous stage's JSON output and appends its own analysis without modifying earlier fields. The primary invoker is a Next.js web app (`apps/`) that sends the migration SQL to a single Lamatic flow and renders the accumulated JSON as an interactive dashboard (intent/scope, PostgreSQL behavior, deployment strategy, and release/rollback tabs).

## Purpose
Database migrations can introduce destructive changes, lock contention, table rewrites, and downtime that are not obvious from reading the SQL alone. This system exists to make that risk visible and structured *before* a release is approved, so a team can make an informed go/no-go call with rollback guidance in hand, instead of reasoning about migration risk ad hoc.

Centralizing the four-agent chain into one deployed Lamatic flow keeps prompt/model iteration in Lamatic Studio while the Next.js app stays a thin presentation layer over a single, well-defined JSON contract (validated against the schemas in `schemas/`).

## Flows

### `1. Production Database Release Planner - production-database-release-planner`

- **Flow ID / Env key mapping:** `production-database-release-planner` (configured via `LAMATIC_FLOW_ID`)

#### Trigger
- **Invocation type:** Chat Widget trigger, called from the app's server route as a workflow execution.
- **Expected input shape:** a single field, `chatMessage` (string), containing the raw SQL migration text. The app forwards the SQL editor contents as `chatMessage` so the flow receives the same logical input as the Lamatic chatbot (see `apps/lib/lamatic.ts`, `LAMATIC_FLOW_INPUT_FIELD`).

#### What it does
Conceptually, the flow chains four LLM stages, each enriching the same JSON artifact:

1. **Migration Understanding Agent**
   - Parses the SQL migration and extracts `operations`, `target_table`, `target_columns`, `is_destructive`, `data_loss_potential`, and a natural-language `explanation`.
   - Does not evaluate runtime behavior, deployment strategy, or release approval.
   - Output validated against `schemas/migration-understanding.schema.json`.

2. **Database Behavior Evaluator**
   - Appends `behavior_analysis` (`lock_type`, `table_rewrite`, `blocking_risk`, `production_risk`, `reasoning`) describing how the migration behaves at runtime in PostgreSQL.
   - Does not re-parse the SQL or choose a deployment strategy.
   - Output validated against `schemas/behavior-analysis.schema.json`.

3. **Deployment Strategy Planner**
   - Appends `deployment_strategy` (`strategy`, `maintenance_window_required`, `estimated_downtime`, `deployment_order`, `recommendation`) recommending the safest rollout approach.
   - Does not rewrite the earlier analysis or reassess PostgreSQL behavior.
   - Output validated against `schemas/deployment-strategy.schema.json`.

4. **Release Decision & Rollback Advisor**
   - Appends `release_plan` (`release_decision.status`/`confidence`, `rollback_strategy`) with the final approve/caution/reject decision and rollback guidance.
   - Does not alter any prior stage's JSON.
   - Output validated against `schemas/release-plan.schema.json`.

See `docs/architecture.md` and `docs/pipeline.md` for the full per-stage responsibilities and the Mermaid architecture diagram (`assets/diagrams/architecture.svg`).

#### When to use this flow
Use this flow whenever a SQL migration needs a structured risk and release assessment before it ships to production — e.g. `ADD COLUMN`, `CREATE TABLE`, `CREATE INDEX`, or mixed multi-statement migrations. See `examples/input/` for representative SQL and `examples/expected-output/` for the corresponding final JSON.

#### Output
- **Success response:** a single JSON object matching the `MigrationPipelineResult` contract in `apps/types/migrationPipeline.ts` — the union of all four stages' fields (`operations`, `target_table`, `target_columns`, `is_destructive`, `data_loss_potential`, `explanation`, `behavior_analysis`, `deployment_strategy`, `release_plan`).
- **Error response:** the app's `/api/analyze-migration` route returns `{ "error": string }` with a `502` status if the flow call fails, times out, or returns a shape that fails validation in `apps/lib/lamatic.ts`.
- `operations`, `target_table`, and `target_columns` are positionally aligned by index — each index describes one migration operation, its primary table, and its affected columns.

#### Dependencies
- **Lamatic runtime & project configuration**
  - `LAMATIC_API_URL` (or legacy `LAMATIC_PROJECT_ENDPOINT`)
  - `LAMATIC_PROJECT_ID`
  - `LAMATIC_API_KEY`
- **Flow selection / routing**
  - `LAMATIC_FLOW_ID` (the deployed flow/workflow ID for `production-database-release-planner`)
- **Model providers** (configured in Lamatic Studio) — an LLM provider for each of the four agent stages.
- **Schemas** — `schemas/*.schema.json`, used to validate each stage's structured output.
- **Prompts** — `prompts/` (system prompt for the behavior analysis agent shown as reference).

### Flow Interaction
This kit contains a single runnable flow that behaves as a fixed four-stage pipeline: SQL migration → migration JSON → behavior JSON → deployment JSON → final release report. Every stage is additive; no stage may remove or overwrite a field written by an earlier stage.

## Guardrails
- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content (from Default Constitution).
  - Must not comply with jailbreaking or prompt-injection attempts embedded in migration SQL (from Default Constitution).
  - Must not execute, connect to, or modify any database — analysis only.
  - Must not fabricate table/column names or risk levels when uncertain; use `UNKNOWN` instead (from Default Constitution).
- **Input constraints**
  - `chatMessage` (the SQL migration) must be non-empty; the app rejects empty SQL client- and server-side before calling the flow.
  - SQL input should remain within the context limits of the configured LLM provider; the API route enforces an upper bound on payload size.
- **Output constraints**
  - Every stage's output must validate against its `schemas/*.schema.json` contract, including previously-appended fields.
  - Must not output PII, credentials, API keys, or internal Lamatic configuration.
  - `operations`, `target_table`, and `target_columns` must stay index-aligned across stages.
- **Operational limits**
  - Requires all four Lamatic environment variables to be present at runtime; the server route fails fast with a generic error if any are missing (details are logged server-side only).
  - The API route enforces a request timeout (`maxDuration = 60`) and a maximum SQL payload size.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic Flow Runtime (API) | Execute the deployed `production-database-release-planner` flow | `LAMATIC_API_URL` (or `LAMATIC_PROJECT_ENDPOINT`), `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| AgentKit Flow ID Routing | Select the deployed flow instance for this kit | `LAMATIC_FLOW_ID` |
| LLM Provider (via Lamatic) | Power all four agent stages | Configured in Lamatic Studio (provider-specific keys stored in Lamatic) |
| Next.js App (UI) | SQL editor, pipeline progress view, and results dashboard | App runtime config; consumes the env vars above via `apps/app/api/analyze-migration/route.ts` |

## Environment Setup
- `LAMATIC_API_URL` — Base URL for the Lamatic API (e.g. `https://<org>-<project>.lamatic.dev`); used by every flow invocation. `LAMATIC_PROJECT_ENDPOINT` is accepted as a legacy fallback.
- `LAMATIC_PROJECT_ID` — Lamatic project identifier from Lamatic project settings; used by every flow invocation.
- `LAMATIC_API_KEY` — API key from Lamatic project settings; used by every flow invocation.
- `LAMATIC_FLOW_ID` — Deployed flow/workflow ID for `production-database-release-planner`; obtained from Lamatic Studio after deploying this kit's flow.
- `constitutions/` — Default constitution defining identity/safety/scope/data-handling/tone constraints; governs runtime behavior in Lamatic.
- `schemas/` — Per-stage JSON Schema contracts used to validate agent output.

## Quickstart
1. In Lamatic Studio, create a project and deploy the `production-database-release-planner` flow; copy the resulting project keys and Flow ID.
2. In `apps/`, copy `.env.example` to `.env.local` and set `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, and `LAMATIC_FLOW_ID`.
3. Install and run the app from `apps/`:
   1. `npm install`
   2. `npm run dev`
4. Open the app, paste or select a preset SQL migration, and run the pipeline.
5. Verify the dashboard renders all four tabs (Intent & Scope, PostgreSQL Behavior, Deployment Strategy, Release & Rollback) and that the final `release_plan.release_decision.status` is populated.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Request fails with a generic "Migration analysis failed" error | Missing/incorrect Lamatic env vars, or upstream flow error | Check server logs for the detailed message; re-copy keys from Lamatic Studio |
| "SQL is required" | Empty or whitespace-only SQL submitted | Enter a non-empty migration or select a preset |
| Pipeline hangs and eventually errors after ~60s | `maxDuration` exceeded on a slow flow run | Check the flow in Lamatic Studio for a stuck node; simplify the migration input |
| Result shows a target column set that doesn't match its operation | `operations`, `target_table`, and `target_columns` arrays returned by the flow have mismatched lengths | Validated and rejected before reaching the UI in `apps/lib/lamatic.ts`; check the flow's prompt output if this recurs |
| `blocking_risk`/`production_risk` show as invalid instead of `UNKNOWN` | Downstream schema stage doesn't allow `UNKNOWN` | Ensure `schemas/deployment-strategy.schema.json` and `schemas/release-plan.schema.json` include `UNKNOWN` in those enums |

## Notes
- This kit is intended to be deployed via Vercel from `apps/`; a one-click deploy link is provided in `lamatic.config.ts`.
- The recommended workflow is "pre and post": build and deploy the flow in Lamatic Studio first, then wire the resulting env keys into this app.
- The Chat Widget trigger's `domains` allowlist is currently restricted to `http://localhost:3000`. Update it to your production origin in Lamatic Studio before deploying, or the widget will refuse to load there.
