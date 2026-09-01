# Runbook Generator

Turns messy operational notes and tribal knowledge into a structured, reusable ops runbook.

> **Why this template?** AgentKit already has strong postmortem / incident kits that explain *what went wrong*. None of them turn half-finished Slack dumps and “ask Alice” tribal knowledge into a *repeatable how-to-operate playbook* with prechecks, validation, rollback, and honest `missing_info`. This fills that gap.

## What it does

1. Accepts free-text procedure notes plus optional `service_name` and `environment`.
2. Runs a schema-constrained **Generate JSON** step (`InstructorLLMNode_481`).
3. Returns a structured runbook: title, purpose, audience, prechecks, ordered steps (with risk), validation, rollback, assumptions, missing_info, and warnings.

It does **not** draft postmortems, execute commands, or invent unverifiable tooling.

## Flow

```text
API Request → Generate JSON → API Response
```

| Input | Required | Description |
|---|---|---|
| `notes` | yes | Messy procedure / Slack dump / tribal knowledge |
| `service_name` | no | Service label for the runbook header |
| `environment` | no | e.g. `staging`, `prod` |

## Setup

1. Open [Lamatic Studio](https://studio.lamatic.ai) and create a project.
2. Import this flow (or recreate from `flows/runbook-generator.ts`).
3. Attach a free LLM credential on Generate JSON — **Groq** or **Google Gemini** works well.
4. Deploy the flow.
5. Call via the Studio test panel or the deployed API with the payload below.

## Example request

```json
{
  "notes": "if redis cache looks poisoned on checkout: check redis-cli ping, then flushdb on the cache shard only (NOT primary), bounce checkout pods, watch error rate on grafana checkout dashboard. if still bad ask platform. don't touch prod db.",
  "service_name": "checkout-api",
  "environment": "prod"
}
```

## Example response shape

```json
{
  "title": "string",
  "purpose": "string",
  "audience": "string",
  "service_name": "string",
  "environment": "string",
  "prechecks": ["string"],
  "steps": [
    {
      "order": 1,
      "action": "string",
      "expected_result": "string",
      "commands": ["string"],
      "risk": "low"
    }
  ],
  "validation": ["string"],
  "rollback": ["string"],
  "assumptions": ["string"],
  "missing_info": ["string"],
  "warnings": ["string"]
}
```

## Smoke-test fixtures

1. **Redis cache flush recovery** — poisoned checkout cache (example above).
2. **Failed deploy rollback** — “canary 20% bad, roll back to previous image on checkout-api, check /healthz, notify #deploys”.
3. **DB connection pool saturation** — “API timeouts, pg_stat_activity shows waiting, bounce app pods first, do not restart Postgres, page DBA if after 2 bounces still saturated”.

## Differentiation

| This template | Nearby kits |
|---|---|
| Produces reusable **runbooks** (how to operate / recover) | `incident-log-postmortem`, `sre-incident-postmortem-agent` produce **postmortems** |
| Starts from procedure notes | Log-focused kits start from raw logs |

## Guardrails

- Never invent unverifiable commands.
- Redact secrets; surface gaps in `missing_info`.
- Not legal/medical/financial advice.
- Not a live command executor.

## Stack

- Lamatic.ai flow orchestration
- Groq (or any Instructor-compatible text model configured in Studio)

## Author

Tushar Sohal (`tshulk2003@gmail.com`)

## Links

- GitHub: https://github.com/Lamatic/AgentKit/tree/main/kits/runbook-generator
- Docs: https://lamatic.ai/docs
