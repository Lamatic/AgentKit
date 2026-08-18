/*
 * # SparkTrace Planner (v2)
 * The per-turn directing brain of the SparkTrace investigation loop. Turns the reported
 * symptom, the ingested `PipelineContext`, and everything learned so far into a single
 * `PlannerDecision`: the next best action to take.
 *
 * ## Purpose
 * SparkTrace is an agentic data-pipeline debugging copilot: the `apps/` orchestrator runs
 * a ReAct-style loop where each reasoning step is a Lamatic flow and each action step hits
 * AWS (Athena/Glue) through a read-only-guarded executor. In v2 the planner is no longer a
 * one-shot upfront plan — it is called **once per turn** of the loop
 * (`reasoner.plan({symptom, pipeline, evidence, hypothesesTried})` in
 * `apps/actions/orchestrate.ts`), and on every call it decides exactly one next action:
 * generate a query against a specific hypothesis, read the repo to understand a specific
 * area better, or conclude the investigation. This makes the planner the single point of
 * control for the whole loop — nothing else in the system decides what happens next.
 *
 * ## When To Use
 * - Call once per loop turn, after `PipelineIngestor.ingest()` has produced a
 *   `PipelineContext` and before any query is generated or repo area is read.
 * - Always pass the accumulated `evidence` (compact `PlannerEvidence[]`) and
 *   `hypothesesTried` (`Hypothesis[]` with current status) so the planner has memory of
 *   what has already been learned and tried.
 *
 * ## When Not To Use
 * - Do not use to write or approve SQL — that is `sparktrace-query-gen`'s job, invoked
 *   only after this flow returns `action: "gen_query"` with a `hypothesis`.
 * - Do not use to read pipeline source directly — that is `sparktrace-repo-reader`'s job,
 *   invoked only after this flow returns `action: "read_repo"` with a `focus`.
 * - Do not skip calling this flow between steps and let the orchestrator hardcode "what's
 *   next" — the planner is the intended single source of truth for loop control in v2.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `symptom` | `string` | Yes | Free-text description of the observed problem. |
 * | `pipeline` | `PipelineContext` | Yes | `{ repoUrl?, files[], tables[], dag[], summary }`. |
 * | `evidence` | `PlannerEvidence[]` | Yes | `{ kind: "query"\|"repo", hypothesisId?, summary }[]` — compact evidence accumulated so far. |
 * | `hypothesesTried` | `Hypothesis[]` | Yes | Every hypothesis proposed so far, with current `status`. |
 *
 * ## Outputs — single `PlannerDecision`
 * | Field | Type | Description |
 * |---|---|---|
 * | `action` | `"gen_query" \| "read_repo" \| "conclude"` | The single next action to take. |
 * | `reasoning` | `string` | Why this action (and hypothesis/focus, if any) was chosen. |
 * | `hypothesis` | `Hypothesis` (optional) | Present only when `action === "gen_query"`. |
 * | `focus` | `string` (optional) | Present only when `action === "read_repo"`. |
 *
 * ## Dependencies
 * ### Upstream
 * - None for the first call — this is the entry point of the reasoning loop, called right
 *   after ingestion with empty `evidence`/`hypothesesTried`.
 * - On subsequent turns, the orchestrator's accumulated `Investigation` state supplies
 *   `evidence`/`hypothesesTried`.
 * ### Downstream
 * - `sparktrace-query-gen` — invoked with `hypothesis` when this flow returns `gen_query`.
 * - `sparktrace-repo-reader` — invoked with `focus` when this flow returns `read_repo`.
 * - `sparktrace-reporter` — invoked with the full `Investigation` when this flow returns `conclude`.
 * ### External Services
 * - Configured text generation model via `generativeModelName` on the `Generate JSON` node
 *   (Opus tier — see `@model-configs/sparktrace-planner_generate-json.ts`).
 * ### Environment Variables
 * - `SPARKTRACE_PLANNER_FLOW_ID` — deployed flow id used by `apps/lib/lamatic-client.ts`.
 * - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — Lamatic client credentials.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode` / `graphqlNode`) — receives `{ symptom, pipeline, evidence, hypothesesTried }`.
 * 2. `Generate JSON` (`InstructorLLMNode`) — applies
 *    `@prompts/sparktrace-planner_generate-json_system.md` (directing-investigator
 *    instructions + strict `PlannerDecision` JSON contract) and
 *    `@prompts/sparktrace-planner_generate-json_user.md` (injects all four input fields),
 *    constrained to the `schema` below.
 * 3. `API Response` (`graphqlResponseNode`) — maps the node's structured output straight
 *    through to the caller.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Fix |
 * |---|---|---|
 * | `action` always `"conclude"` immediately | Empty/underspecified `pipeline` or `symptom`, or stale `evidence` misread as sufficient | Ensure ingestion produced a non-trivial `PipelineContext`; give a concrete symptom. |
 * | `hypothesis` re-proposes an already-`confirmed`/`refuted` hypothesis | `hypothesesTried` wasn't passed with up-to-date `status` | Always pass the latest `hypothesesTried` from investigation state, not a stale copy. |
 * | Model execution fails | `generativeModelName` not configured for this flow in Studio | Configure a `generator/text` model for `InstructorLLMNode_310`. |
 *
 * ## Notes
 * - Output is strict JSON (`InstructorLLMNode` schema-constrained), not freeform prose.
 * - This flow is Opus-tier by design: it is the highest-stakes, most context-heavy decision
 *   in the loop and runs less frequently than the analyst, so the cost/quality trade favors
 *   the strongest model.
 */

// Flow: sparktrace-planner

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "SparkTrace Planner",
  "description": "Per-turn planner (Opus) that decides the single next action in a SparkTrace investigation: generate a query against a hypothesis, read the pipeline repo for more context, or conclude with a root-cause report.",
  "tags": [
    "🕵️ Agentic",
    "🛠️ Data Engineering"
  ],
  "testInput": {
    "symptom": "The daily revenue_by_region table has undercounted revenue for the last 3 days compared to the source orders table.",
    "pipeline": {
      "repoUrl": "demo",
      "files": [
        { "path": "jobs/daily_revenue.py", "language": "python", "role": "transform", "content": "df = spark.read.table('raw.orders').join(spark.read.table('raw.dim_region'), 'region_id').groupBy('region_id','order_date').agg(sum('amount').alias('revenue'))" }
      ],
      "tables": [
        { "database": "raw", "name": "orders", "kind": "source", "columns": [ { "name": "order_id", "type": "string" }, { "name": "region_id", "type": "string" }, { "name": "amount", "type": "double" }, { "name": "order_date", "type": "date" } ] },
        { "database": "raw", "name": "dim_region", "kind": "source", "columns": [ { "name": "region_id", "type": "string" }, { "name": "region_name", "type": "string" } ] },
        { "database": "curated", "name": "revenue_by_region", "kind": "sink", "columns": [ { "name": "region_id", "type": "string" }, { "name": "order_date", "type": "date" }, { "name": "revenue", "type": "double" } ] }
      ],
      "dag": [
        { "id": "read_orders", "op": "read_parquet", "inputs": [], "outputs": ["orders"], "file": "jobs/daily_revenue.py" },
        { "id": "read_dim_region", "op": "read_parquet", "inputs": [], "outputs": ["dim_region"], "file": "jobs/daily_revenue.py" },
        { "id": "join_orders_region", "op": "join", "inputs": ["orders", "dim_region"], "outputs": ["joined"], "file": "jobs/daily_revenue.py" },
        { "id": "agg_revenue", "op": "groupBy", "inputs": ["joined"], "outputs": ["revenue_by_region"], "file": "jobs/daily_revenue.py" },
        { "id": "write_sink", "op": "write", "inputs": ["revenue_by_region"], "outputs": ["curated.revenue_by_region"], "file": "jobs/daily_revenue.py" }
      ],
      "summary": "Daily batch job joins raw.orders to raw.dim_region on region_id and aggregates revenue per region/day into curated.revenue_by_region."
    },
    "evidence": [],
    "hypothesesTried": []
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
  "InstructorLLMNode_310": [
    {
      "mode": "instructor",
      "name": "generativeModelName",
      "type": "model",
      "label": "Generative Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "generator/text",
      "description": "Select the model used to direct the investigation (Opus tier).",
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
    "sparktrace_planner_generate_json_system": "@prompts/sparktrace-planner_generate-json_system.md",
    "sparktrace_planner_generate_json_user": "@prompts/sparktrace-planner_generate-json_user.md"
  },
  "modelConfigs": {
    "sparktrace_planner_generate_json": "@model-configs/sparktrace-planner_generate-json.ts"
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
        "advance_schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"symptom\": { \"type\": \"string\" },\n    \"pipeline\": { \"type\": \"object\" },\n    \"evidence\": { \"type\": \"array\" },\n    \"hypothesesTried\": { \"type\": \"array\" }\n  },\n  \"required\": [\"symptom\", \"pipeline\", \"evidence\", \"hypothesesTried\"]\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_310",
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
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"action\": { \"type\": \"string\", \"enum\": [\"gen_query\", \"read_repo\", \"conclude\"] },\n    \"reasoning\": { \"type\": \"string\" },\n    \"hypothesis\": {\n      \"type\": \"object\",\n      \"description\": \"present only when action === 'gen_query'\",\n      \"properties\": {\n        \"id\": { \"type\": \"string\" },\n        \"title\": { \"type\": \"string\" },\n        \"rationale\": { \"type\": \"string\" },\n        \"category\": {\n          \"type\": \"string\",\n          \"enum\": [\"schema-drift\", \"data-skew\", \"null-spike\", \"late-arriving\", \"partition-miss\", \"join-explosion\", \"dedup-bug\", \"upstream-change\", \"volume-anomaly\", \"other\"]\n        },\n        \"confidence\": { \"type\": \"number\" },\n        \"status\": { \"type\": \"string\", \"enum\": [\"open\"] }\n      },\n      \"required\": [\"id\", \"title\", \"rationale\", \"category\", \"confidence\", \"status\"]\n    },\n    \"focus\": { \"type\": \"string\", \"description\": \"present only when action === 'read_repo'\" }\n  },\n  \"required\": [\"action\", \"reasoning\"]\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/sparktrace-planner_generate-json_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/sparktrace-planner_generate-json_user.md"
          }
        ],
        "memories": "@model-configs/sparktrace-planner_generate-json.ts",
        "messages": "@model-configs/sparktrace-planner_generate-json.ts",
        "attachments": "@model-configs/sparktrace-planner_generate-json.ts",
        "generativeModelName": "@model-configs/sparktrace-planner_generate-json.ts"
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
        "outputMapping": "{\n  \"action\": \"{{InstructorLLMNode_310.output.action}}\",\n  \"reasoning\": \"{{InstructorLLMNode_310.output.reasoning}}\",\n  \"hypothesis\": \"{{InstructorLLMNode_310.output.hypothesis}}\",\n  \"focus\": \"{{InstructorLLMNode_310.output.focus}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_310",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_310",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_310-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_310",
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
