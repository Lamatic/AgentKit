/*
 * # SparkTrace Query Gen (v2)
 * The query-generation reasoning flow of the SparkTrace investigation loop. Turns a single
 * hypothesis (chosen by the planner's `gen_query` decision) plus the relevant table
 * schemas into one strictly read-only diagnostic SQL query targeting Athena or Spark SQL.
 *
 * ## Purpose
 * This flow is called once per `action: "gen_query"` planner decision inside the
 * orchestrator's investigation loop (`reasoner.generateQuery(...)` in
 * `apps/actions/orchestrate.ts`), after `sparktrace-planner` has proposed exactly one
 * hypothesis and the orchestrator has fetched fresh table schema via
 * `CatalogProvider.describeTable`. It converts "what we suspect" into "the exact query
 * that would prove or disprove it" — nothing more. It never executes SQL itself; the
 * orchestrator's `QueryExecutor` does that only after the deterministic `QueryGuard` has
 * independently verified the query is read-only and cost-safe.
 *
 * Model tier: Sonnet by default. For simple, well-understood hypothesis categories against
 * a fully-specified schema, the cheaper Haiku 4.5 (`claude-haiku-4-5`) is an acceptable
 * fallback tier — the orchestrator/Studio operator may point
 * `@model-configs/sparktrace-query-gen_generate-json.ts` at a Haiku-configured variant for
 * those cases without changing this flow's graph or prompts.
 *
 * ## When To Use
 * - Use once per `gen_query` planner decision, immediately before running the `QueryGuard`
 *   and `executor.execute`.
 * - Use with a schema-grounded `tables[]` (via `CatalogProvider`) so the model can only
 *   reference real columns.
 *
 * ## When Not To Use
 * - Do not use to test more than one hypothesis at a time — always pass exactly one
 *   `Hypothesis`.
 * - Do not treat this flow's output as safe to execute on its own: the orchestrator MUST
 *   still run the deterministic `QueryGuard` on `sql` (read-only check + cost rules) and
 *   reject on `ok: false` before calling the executor. This flow's prompt-level
 *   constraint is defense-in-depth, not the safety boundary.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `symptom` | `string` | Yes | The original reported problem, for context. |
 * | `hypothesis` | `Hypothesis` | Yes | `{ id, title, rationale, category, confidence, status }` — the single hypothesis under test. |
 * | `tables` | `TableRef[]` | Yes | `{ database, name, kind, columns?, location? }[]` — tables/columns the query may reference. |
 * | `engine` | `QueryEngine` | Yes | `"athena"` or `"spark-sql"` — target SQL dialect. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `id` | `string` | New unique id for the generated query. |
 * | `hypothesisId` | `string` | Equals `hypothesis.id`. |
 * | `engine` | `QueryEngine` | Equals the requested `engine`. |
 * | `sql` | `string` | A single read-only statement (`SELECT`/`WITH`/`DESCRIBE`/`SHOW`/`EXPLAIN` only). |
 * | `purpose` | `string` | Why this query tests the hypothesis. |
 *
 * The response shape is exactly `DiagnosticQuery` from `apps/lib/contracts.ts`.
 *
 * ## Dependencies
 * ### Upstream
 * - `sparktrace-planner` — supplies the `hypothesis` this flow is called with (one at a
 *   time) whenever it returns `action: "gen_query"`.
 * - `CatalogProvider.describeTable` (`apps/lib/aws/glue-client.ts` live, `apps/lib/demo/demo-catalog.ts` demo) — supplies `tables`.
 * ### Downstream
 * - `OrchestratorDeps.guardQuery` (`QueryGuard`) — MUST validate `sql` before execution; hard gate.
 * - `QueryExecutor.execute` (Athena live / DuckDB demo) — runs the query only after the guard passes.
 * - `OrchestratorDeps.compact` — compacts the raw `QueryExecutionResult` into a `CompactResult` before it ever reaches a model.
 * - `sparktrace-analyst` — consumes this query alongside the compacted result.
 * ### External Services
 * - Configured text generation model via `generativeModelName` on the `Generate JSON` node
 *   (Sonnet tier — see `@model-configs/sparktrace-query-gen_generate-json.ts`).
 * ### Environment Variables
 * - `SPARKTRACE_QUERY_GEN_FLOW_ID` — deployed flow id used by `apps/lib/lamatic-client.ts`.
 * - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — Lamatic client credentials.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode` / `graphqlNode`) — receives `{ symptom, hypothesis, tables, engine }`.
 * 2. `Generate JSON` (`InstructorLLMNode`) — applies
 *    `@prompts/sparktrace-query-gen_generate-json_system.md` (read-only-only SQL authoring
 *    rules, per-category query strategy, hard ban on write/DDL/DML) and
 *    `@prompts/sparktrace-query-gen_generate-json_user.md` (injects `symptom`, `hypothesis`,
 *    `tables`, `engine`), constrained to the `DiagnosticQuery` `schema` below.
 * 3. `API Response` (`graphqlResponseNode`) — maps the structured output straight through.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Fix |
 * |---|---|---|
 * | `sql` rejected by `lintQuery` | Model produced non-SELECT/DDL/DML despite the constitution, or multi-statement SQL | Re-invoke with a stricter model, or add a deterministic sanitation pass before execution; never bypass the linter. |
 * | Query references unknown columns | `tables` passed to the flow was stale/incomplete | Refresh via `CatalogProvider.describeTable` before calling this flow. |
 * | `hypothesisId` mismatch | Caller passed a different `hypothesis` object than expected downstream | Always pass through the exact `Hypothesis` object being tested; do not reconstruct it. |
 *
 * ## Notes
 * - Output is strict JSON (`InstructorLLMNode` schema-constrained) shaped exactly like
 *   `DiagnosticQuery` in `apps/lib/contracts.ts` — no wrapping object, no extra fields.
 * - Read-only enforcement here is layer 1 of 2 (prompt/constitution). Layer 2 is the
 *   deterministic `query-linter.ts` gate the orchestrator runs before `executor.execute()`.
 */

// Flow: sparktrace-query-gen

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "SparkTrace Query Gen",
  "description": "Generates a single strictly read-only SQL query (Athena or Spark SQL) that tests one specific hypothesis about a Spark pipeline failure.",
  "tags": [
    "🕵️ Agentic",
    "🛠️ Data Engineering"
  ],
  "testInput": {
    "symptom": "The daily revenue_by_region table has undercounted revenue for the last 3 days compared to the source orders table.",
    "hypothesis": {
      "id": "hyp-join-explosion-1",
      "title": "Inner join between orders and dim_region silently drops orders for regions missing from dim_region",
      "rationale": "jobs/daily_revenue.py performs an inner join on region_id between raw.orders and raw.dim_region; any order with a region_id absent from dim_region is dropped before aggregation.",
      "category": "join-explosion",
      "confidence": 0.7,
      "status": "open"
    },
    "tables": [
      { "database": "raw", "name": "orders", "kind": "source", "columns": [ { "name": "order_id", "type": "string" }, { "name": "region_id", "type": "string" }, { "name": "amount", "type": "double" }, { "name": "order_date", "type": "date" } ] },
      { "database": "raw", "name": "dim_region", "kind": "source", "columns": [ { "name": "region_id", "type": "string" }, { "name": "region_name", "type": "string" } ] }
    ],
    "engine": "athena"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "SparkTrace",
    "email": "sparktrace@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_420": [
    {
      "mode": "instructor",
      "name": "generativeModelName",
      "type": "model",
      "label": "Generative Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "generator/text",
      "description": "Select the model used to author the read-only diagnostic query.",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "defaultValue": ""
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "sparktrace_query_gen_generate_json_system": "@prompts/sparktrace-query-gen_generate-json_system.md",
    "sparktrace_query_gen_generate_json_user": "@prompts/sparktrace-query-gen_generate-json_user.md"
  },
  "modelConfigs": {
    "sparktrace_query_gen_generate_json": "@model-configs/sparktrace-query-gen_generate-json.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "modes": {},
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"symptom\": { \"type\": \"string\" },\n    \"hypothesis\": { \"type\": \"object\" },\n    \"tables\": { \"type\": \"array\" },\n    \"engine\": { \"type\": \"string\", \"enum\": [\"athena\", \"spark-sql\"] }\n  },\n  \"required\": [\"symptom\", \"hypothesis\", \"tables\", \"engine\"]\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_420",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "modes": {},
      "values": {
        "nodeName": "Generate JSON",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"id\": { \"type\": \"string\" },\n    \"hypothesisId\": { \"type\": \"string\" },\n    \"engine\": { \"type\": \"string\", \"enum\": [\"athena\", \"spark-sql\"] },\n    \"sql\": { \"type\": \"string\", \"description\": \"A single read-only SELECT/WITH/DESCRIBE/SHOW/EXPLAIN statement. Never INSERT/UPDATE/DELETE/DDL/DML.\" },\n    \"purpose\": { \"type\": \"string\" }\n  },\n  \"required\": [\"id\", \"hypothesisId\", \"engine\", \"sql\", \"purpose\"]\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/sparktrace-query-gen_generate-json_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/sparktrace-query-gen_generate-json_user.md"
          }
        ],
        "memories": "@model-configs/sparktrace-query-gen_generate-json.ts",
        "messages": "@model-configs/sparktrace-query-gen_generate-json.ts",
        "attachments": "@model-configs/sparktrace-query-gen_generate-json.ts",
        "generativeModelName": "@model-configs/sparktrace-query-gen_generate-json.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "retries": "0",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"id\": \"{{InstructorLLMNode_420.output.id}}\",\n  \"hypothesisId\": \"{{InstructorLLMNode_420.output.hypothesisId}}\",\n  \"engine\": \"{{InstructorLLMNode_420.output.engine}}\",\n  \"sql\": \"{{InstructorLLMNode_420.output.sql}}\",\n  \"purpose\": \"{{InstructorLLMNode_420.output.purpose}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_420",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_420",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_420-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_420",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
