# API Schema Drift Sentinel

A **breaking-change detection and migration orchestration kit** for OpenAPI-based services. It uses deterministic structural comparison to identify schema changes, supplements the diff with direct path-parameter comparison where necessary, classifies the resulting changes by severity, and sends the confirmed change facts to a Lamatic workflow for executive impact analysis and migration guidance — exposed through a single `/api/analyze-drift` API call.

---

## The Problem

API schema drift is silent and expensive. When a service team renames a field, removes a response property, or changes a parameter type, the breakage shows up in downstream clients — frontends, SDKs, mobile apps — long after the deploy. Most teams catch this through manual spec review or at runtime during integration testing.

There is no easy way to:
1. Automatically detect what broke between two spec versions
2. Know which client systems will be affected
3. Get a concrete migration plan without reading the full spec diff manually

---

## The Solution

API Schema Drift Sentinel combines two layers:

1. **Deterministic AST diff** — `openapi-diff` performs structural comparison of the two OpenAPI specs and returns typed, structured breaking and non-breaking changes. This is computed locally, with no AI involved, so the facts are always accurate.

2. **AI narrative synthesis** — the structured facts are forwarded to a Lamatic workflow where an LLM reasons about downstream impact, classifies deployment risk, and produces a migration guide grounded in the actual detected changes.

The result is exposed through a Next.js API endpoint and a minimal dashboard UI.

---

## Why the Two-Layer Architecture

Using AI alone to diff specs is unreliable — models hallucinate field names, miss subtle type changes, and produce inconsistent severity ratings. Using a pure diff tool alone gives you a machine-readable change list but no actionable guidance.

This kit separates the concerns:

| Layer | What it does | Why |
|---|---|---|
| `openapi-diff` (deterministic) | Structural AST diff | Deterministic and reproducible; no LLM hallucination risk |
| Lamatic LLM workflow | Narrative, impact, migration | Produces human-readable output grounded in confirmed facts |

The LLM receives a plain-text fact list derived from the deterministic layer — not the raw specs. This keeps the LLM grounded in the deterministic fact list and reduces the risk of unsupported claims.

---

## Architecture

```
Browser / test harness
        │
        │  POST /api/analyze-drift  { specA, specB }
        ▼
apps/app/api/analyze-drift/route.ts
        │
        ├─ 1. runOpenApiDiff(specA, specB)       ← openapi-diff AST comparison
        │
        ├─ 2. normalizeDiff(rawDiff, specA, specB) ← typed SemanticChange[] facts
        │        breaking: CRITICAL severity
        │        non-breaking: INFO severity
        │
        ├─ 3. Format fact lines for AI context
        │        "Endpoint: GET /users/{id} | Field: email | Action: remove | ..."
        │
        ├─ 4. triggerLamaticWorkflow({ sampleInput })
        │        REST trigger  ─┐
        │        (fallback)     └─ GraphQL executeWorkflow + polling
        │                              │
        │                         Lamatic Studio
        │                         ┌─────────────────────────────┐
        │                         │  LLM Node (system prompt:   │
        │                         │  prompts/analyze-schema-    │
        │                         │  drift_llm-node_system.md)  │
        │                         │                             │
        │                         │  Returns JSON:              │
        │                         │  { executiveSummary,        │
        │                         │    detailedImpact[],        │
        │                         │    migrationGuide[],        │
        │                         │    deploymentRisk }         │
        │                         └─────────────────────────────┘
        │
        └─ 5. Merge AI output + deterministic counts → NextResponse
                 { breakingCount, nonBreakingCount, riskLevel, changes[], ... }
```

---

## API

### `POST /api/analyze-drift`

**Request body:**
```json
{
  "specA": "<OpenAPI JSON string — baseline version>",
  "specB": "<OpenAPI JSON string — target version>"
}
```

Both `specA` and `specB` are required. They must be valid OpenAPI 3.0 JSON (as a string or parsed object).

**Response:**
```json
{
  "success": true,
  "data": {
    "executiveSummary": { "recommendation": "...", "deploymentRisk": "HIGH" },
    "detailedImpact": ["...", "..."],
    "migrationGuide": ["...", "..."],
    "breakingCount": 3,
    "nonBreakingCount": 0,
    "riskLevel": "HIGH",
    "changes": [
      {
        "endpoint": "GET /users/{id}",
        "field": "email",
        "action": "remove",
        "severity": "CRITICAL",
        "code": "response.body.scope.remove",
        "before": "string",
        "after": "—",
        "description": "Removed field 'email'",
        "isBreaking": true
      }
    ]
  }
}
```

`breakingCount`, `nonBreakingCount`, and dashboard `riskLevel` are derived deterministically from the change classification. The narrative fields (`executiveSummary`, `detailedImpact`, `migrationGuide`) are produced by the Lamatic workflow.

---

## Environment Variables

| Variable | Description | Where to find it |
|---|---|---|
| `LAMATIC_API_KEY` | Lamatic project API key | Studio → API Keys |
| `LAMATIC_PROJECT_ID` | Lamatic project UUID | Studio → Project Settings |
| `LAMATIC_API_URL` | Lamatic project GraphQL endpoint | Studio → Settings → API |
| `LAMATIC_DRIFT_FLOW_ID` | Deployed flow ID for the drift analysis flow | Studio → open flow → copy Flow ID |

---

## Setup

### 1. Build the Lamatic flow

1. Log in to [Lamatic Studio](https://studio.lamatic.ai)
2. Create a new flow with a trigger that accepts `sampleInput` (string)
3. Add an LLM node — use the system prompt from [`prompts/analyze-schema-drift_llm-node_system.md`](./prompts/analyze-schema-drift_llm-node_system.md)
4. Configure the LLM node to return a JSON object with: `executiveSummary`, `detailedImpact`, `migrationGuide`
5. Deploy the flow and copy the **Flow ID**

### 2. Configure environment variables

```bash
cd kits/api-schema-drift-sentinel/apps
cp .env.example .env.local
```

Fill in `.env.local` with your values:
```
LAMATIC_API_KEY=lt-...
LAMATIC_PROJECT_ID=...
LAMATIC_API_URL=https://your-project.lamatic.dev
LAMATIC_DRIFT_FLOW_ID=...
```

### 3. Install and run

```bash
npm install
npm run dev
# App available at http://localhost:3000
```

---

## Test Cases and Results

The end-to-end test harness is in [`apps/test-orchestrate.js`](./apps/test-orchestrate.js). It runs two scenarios against the live Lamatic workflow:

```bash
node apps/test-orchestrate.js
```

### Test A — Additive (non-breaking)

**Input:** Base spec has `GET /users/{id}` returning `{ id, name, email }`, target spec adds optional response property `full_name: { type: "string" }`.

**Expected result:**
- `changesCount: 1`
- `breakingChangesCount: 0`
- `deploymentRisk: LOW`
- One non-breaking change: `FIELD_ADDED full_name`

### Test B — Breaking (field removal + type change)

**Input:** V1 spec vs V2 spec that removes `email` and `name` from the response body, and changes the `id` path parameter type from `integer` to `string`.

**Expected result:**
- `FIELD_REMOVED email`
- `FIELD_REMOVED name`
- `TYPE_CHANGED id integer → string`
- `changesCount: 3`
- `breakingChangesCount: 3`
- `deploymentRisk: HIGH`
- `detailedImpact` — 3 grounded impact descriptions
- `migrationGuide` — 3 specific migration actions

---

## Lamatic Workflow / Configuration

- **Flow:** [`flows/analyze-schema-drift.ts`](./flows/analyze-schema-drift.ts) contains the checked-in Lamatic flow definition (trigger → LLM → response).
- **Prompt:** [`prompts/analyze-schema-drift_llm-node_system.md`](./prompts/analyze-schema-drift_llm-node_system.md) contains the LLM system prompt.
- **Model configuration:** [`model-configs/analyze-schema-drift_llm-node_generative-model-name.ts`](./model-configs/analyze-schema-drift_llm-node_generative-model-name.ts) contains the checked-in model configuration used by the kit (`gemini-2.5-flash`).
- **Constitution:** [`constitutions/default.md`](./constitutions/default.md) contains the safety and data handling guidelines referenced by the flow.
- The deployed flow is configured and tested in Lamatic Studio.
- The workflow receives deterministic schema-drift facts through `sampleInput` and uses the LLM to generate grounded impact analysis and migration guidance.
- **Kit config:** [`lamatic.config.ts`](./lamatic.config.ts) contains kit metadata and the required `LAMATIC_DRIFT_FLOW_ID`.

---

## Design Decisions and Tradeoffs

**Why `openapi-diff` instead of a pure LLM diff?**
`openapi-diff` gives deterministic, reproducible, structured output. The LLM layer only receives confirmed facts — it cannot contradict or fabricate changes. This is the key correctness guarantee.

**Why does `detectParameterTypeChanges` exist?**
`openapi-diff` does not consistently surface path-parameter type changes. `detectParameterTypeChanges()` is now part of the production deterministic normalization layer in [`apps/lib/sentinel.ts`](./apps/lib/sentinel.ts). It supplements `openapi-diff` by directly comparing path parameters between the two specs. This is why the production browser test correctly detects `id: integer → string` on `GET /users/{id}`.

**Why REST trigger with GraphQL fallback?**
Lamatic supports both a REST trigger endpoint and a GraphQL execution API. The integration attempts the REST trigger first and contains a GraphQL execution fallback if GraphQL-only routing is used. This makes the kit compatible with both deployment configurations.

**Why is the LLM output merged with deterministic counts?**
`breakingCount`, `nonBreakingCount`, and dashboard `riskLevel` are derived deterministically from the change classification, independent of the LLM. This means the dashboard's risk badge and change counters are always correct even if the AI narrative fails or is degraded.

---

## Limitations

- **YAML spec support:** Both specs must be valid OpenAPI 3.0 JSON. YAML input is not currently parsed.
- **Lamatic dependency:** AI narrative synthesis requires a configured and deployed Lamatic flow. If the flow is unreachable, the API returns deterministic facts with a fallback `executiveSummary` string instead of failing.
- **Path parameter type changes:** Path parameter type changes are supplemented by a direct comparator because `openapi-diff` may not consistently surface them.
- **Single endpoint scope:** The current implementation treats the entire spec as a single analysis unit. It does not segment analysis per-endpoint for large multi-path specs.
- **No authentication on the API:** The `/api/analyze-drift` endpoint has no authentication. Suitable for local/internal use; add middleware before public deployment.

---

Built on [Lamatic](https://lamatic.ai).
