# DB Migration Safety Checker

Analyzes a SQL migration and flags risky operations before they hit production - table locks, missing indexes on new foreign keys, non-reversible drops, unsafe NOT NULL additions, and unbounded data migrations. Returns a structured safety report with severity and a suggested fix for each issue.

## What it catches

- Table-locking ALTER TABLE operations
- New foreign keys without a supporting index
- Non-reversible drops/renames with no rollback path
- NOT NULL added without a DEFAULT
- CREATE INDEX without CONCURRENTLY on hot tables
- Unbounded UPDATE/DELETE migrations

## Structure

- agent.md - identity, purpose, capabilities, guardrails
- flows/db-migration-safety-checker.ts - the node graph (API Request -> Generate Text -> API Response)
- prompts/ - system and user prompt for the LLM node
- model-configs/ - which model the LLM node uses
- constitutions/default.md - guardrails the agent must always follow

## Setup

1. Sign up at lamatic.ai and create a project.
2. Get your Lamatic API key from Settings -> API Keys.
3. Import this flow into Lamatic Studio using flows/db-migration-safety-checker.ts as reference.
4. Connect your Google Gemini credential (used by the model config file).
## Usage

Send a POST request to the deployed flow endpoint with:

{
  "migration_sql": "ALTER TABLE orders ADD COLUMN status TEXT NOT NULL;",
  "db_dialect": "postgres"
}

## Notes

Built as a template (single flow, no UI) for the AgentKit agentkit-challenge.
