/*
 * # SparkTrace Repo Reader
 * The code-comprehension flow of the SparkTrace investigation loop. Turns a specific
 * `focus` area chosen by the planner into a concise, grounded finding about how the
 * pipeline's code/DAG actually behaves there.
 *
 * ## Purpose
 * This flow is invoked whenever the planner (`sparktrace-planner`) returns
 * `action: "read_repo"` — i.e. whenever the planner cannot confidently form or refine a
 * hypothesis from `pipeline.summary`/`pipeline.dag`/`pipeline.tables` alone and needs a
 * closer read of the actual source. It never queries AWS and never proposes hypotheses or
 * SQL itself; its only job is to answer a targeted question about the pipeline's code
 * (join semantics, load cadence, overwrite behavior, dedup logic, filters, schema
 * assumptions) and hand a compact `RepoInsight` back to the planner as new `evidence` for
 * its next turn.
 *
 * ## When To Use
 * - Call once per `action: "read_repo"` decision from `sparktrace-planner`, passing the
 *   exact `focus` string it returned.
 * - Use when the planner needs ground truth about *how* the pipeline's code behaves
 *   (join type, write mode, filter logic) that isn't captured in the `PipelineContext`'s
 *   `dag`/`tables` summary alone.
 *
 * ## When Not To Use
 * - Do not use to propose or rank hypotheses — that is `sparktrace-planner`'s job; this
 *   flow only reports what the code says.
 * - Do not use to write or validate SQL — that is `sparktrace-query-gen`'s job.
 * - Do not call without a `focus` from the planner; a vague or missing `focus` produces a
 *   low-value, unfocused finding.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `symptom` | `string` | Yes | The original reported problem, for context on what matters. |
 * | `pipeline` | `PipelineContext` | Yes | `{ repoUrl?, files[], tables[], dag[], summary }` — the ingested pipeline understanding. |
 * | `focus` | `string` | Yes | The specific area to examine, as returned by the planner's `PlannerDecision.focus`. |
 *
 * ## Outputs — single `RepoInsight`
 * | Field | Type | Description |
 * |---|---|---|
 * | `focus` | `string` | Echoes the `focus` this insight answers. |
 * | `insight` | `string` | A concise, code-grounded finding (join semantics, load cadence, overwrite behavior, dedup logic, filters, schema assumptions, etc). |
 *
 * ## Dependencies
 * ### Upstream
 * - `sparktrace-planner` — supplies `focus` whenever it returns `action: "read_repo"`.
 * ### Downstream
 * - The orchestrator appends the returned `RepoInsight` to `investigation.repoInsights[]`
 *   and folds a compact summary of it into the `evidence: PlannerEvidence[]` (`kind: "repo"`)
 *   passed into the planner's next turn.
 * - `sparktrace-reporter` — may cite `repoInsights[]` in the final root-cause report.
 * ### External Services
 * - Configured text generation model via `generativeModelName` on the `Generate JSON` node
 *   (Sonnet tier — see `@model-configs/sparktrace-repo-reader_generate-json.ts`).
 * ### Environment Variables
 * - `SPARKTRACE_REPO_READER_FLOW_ID` — deployed flow id used by `apps/lib/lamatic-client.ts`.
 * - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — Lamatic client credentials.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode` / `graphqlNode`) — receives `{ symptom, pipeline, focus }`.
 * 2. `Generate JSON` (`InstructorLLMNode`) — applies
 *    `@prompts/sparktrace-repo-reader_generate-json_system.md` (code-reading discipline:
 *    ground every claim in the supplied `files[]`/`dag[]`, never fabricate behavior) and
 *    `@prompts/sparktrace-repo-reader_generate-json_user.md` (injects `symptom`, `pipeline`,
 *    `focus`), constrained to the `RepoInsight` `schema` below.
 * 3. `API Response` (`graphqlResponseNode`) — maps the structured output straight through.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Fix |
 * |---|---|---|
 * | `insight` says the relevant file/node isn't present | `pipeline.files[]` doesn't include the source for `focus` | Ensure the ingestor pulled in the relevant file(s) before calling this flow; this is the correct, honest response otherwise — do not treat it as a bug in this flow. |
 * | `insight` is generic / not grounded in code | `focus` was too vague, or `pipeline.files[].content` was empty/truncated | Have the planner state a more specific `focus`; verify ingestion captured full file content. |
 * | Model execution fails | `generativeModelName` not configured for this flow in Studio | Configure a `generator/text` model for `InstructorLLMNode_610`. |
 *
 * ## Notes
 * - Output is strict JSON (`InstructorLLMNode` schema-constrained), not freeform prose.
 * - This flow never executes anything against AWS and never mutates investigation state
 *   itself — it only reports a finding for the orchestrator to fold back into the loop.
 */

// Flow: sparktrace-repo-reader

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "SparkTrace Repo Reader",
  "description": "Reads a specific focus area of the pipeline's source code/DAG (Sonnet) and returns a concise, code-grounded finding — join semantics, load cadence, overwrite behavior, dedup logic, and similar.",
  "tags": [
    "🕵️ Agentic",
    "🛠️ Data Engineering"
  ],
  "testInput": {
    "symptom": "The daily revenue_by_region table has undercounted revenue for the last 3 days compared to the source orders table.",
    "pipeline": {
      "repoUrl": "demo",
      "files": [
        { "path": "jobs/daily_revenue.py", "language": "python", "role": "transform", "content": "df = spark.read.table('raw.orders').join(spark.read.table('raw.dim_region'), 'region_id').groupBy('region_id','order_date').agg(sum('amount').alias('revenue'))\ndf.write.mode('overwrite').insertInto('curated.revenue_by_region')" }
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
    "focus": "jobs/daily_revenue.py: the join between orders and dim_region"
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
  "InstructorLLMNode_610": [
    {
      "mode": "instructor",
      "name": "generativeModelName",
      "type": "model",
      "label": "Generative Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "generator/text",
      "description": "Select the model used to read pipeline source/DAG (Sonnet tier).",
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
    "sparktrace_repo_reader_generate_json_system": "@prompts/sparktrace-repo-reader_generate-json_system.md",
    "sparktrace_repo_reader_generate_json_user": "@prompts/sparktrace-repo-reader_generate-json_user.md"
  },
  "modelConfigs": {
    "sparktrace_repo_reader_generate_json": "@model-configs/sparktrace-repo-reader_generate-json.ts"
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
        "advance_schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"symptom\": { \"type\": \"string\" },\n    \"pipeline\": { \"type\": \"object\" },\n    \"focus\": { \"type\": \"string\" }\n  },\n  \"required\": [\"symptom\", \"pipeline\", \"focus\"]\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_610",
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
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"focus\": { \"type\": \"string\" },\n    \"insight\": { \"type\": \"string\" }\n  },\n  \"required\": [\"focus\", \"insight\"]\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/sparktrace-repo-reader_generate-json_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/sparktrace-repo-reader_generate-json_user.md"
          }
        ],
        "memories": "@model-configs/sparktrace-repo-reader_generate-json.ts",
        "messages": "@model-configs/sparktrace-repo-reader_generate-json.ts",
        "attachments": "@model-configs/sparktrace-repo-reader_generate-json.ts",
        "generativeModelName": "@model-configs/sparktrace-repo-reader_generate-json.ts"
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
        "outputMapping": "{\n  \"focus\": \"{{InstructorLLMNode_610.output.focus}}\",\n  \"insight\": \"{{InstructorLLMNode_610.output.insight}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_610",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_610",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_610-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_610",
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
