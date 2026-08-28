/*
 * # SparkTrace Analyst
 * The evidence-analysis reasoning flow of the SparkTrace investigation loop. Turns one
 * diagnostic query's COMPACTED execution result into a verdict on the single hypothesis it
 * tested, plus an advisory hint for the planner.
 *
 * ## Purpose
 * Backs the single `reasoner.analyze({symptom, hypothesis, query, result})` call in the
 * orchestrator's loop (`apps/actions/orchestrate.ts`) — called once per investigation step,
 * right after `compact()` turns a `QueryExecutionResult` into a `CompactResult`. It decides
 * whether the hypothesis just tested is `confirmed`/`refuted`/`inconclusive` and, optionally,
 * what it thinks the loop should do next (advisory only — the PLANNER makes the actual next
 * action decision, in v2).
 *
 * Root-cause synthesis is a SEPARATE flow (`sparktrace-reporter.ts`); this flow is
 * single-purpose and never echoes a `mode`.
 *
 * ## When To Use
 * - Immediately after any `QueryExecutionResult` is compacted into a `CompactResult`, to
 *   decide the verdict on the hypothesis just tested.
 *
 * ## When Not To Use
 * - Do not call without a real `result` (`CompactResult`) — this flow never fabricates
 *   evidence, so an empty/errored `result` will only ever yield `inconclusive`.
 * - Do not call this flow for final root-cause synthesis — use `sparktrace-reporter`.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `symptom` | `string` | Yes | The original reported problem. |
 * | `hypothesis` | `Hypothesis` | Yes | The hypothesis this query tested. |
 * | `query` | `DiagnosticQuery` | Yes | The query that was executed. |
 * | `result` | `CompactResult` | Yes | The compacted digest of the execution (<=10 sample rows + stats) — never raw rows. |
 *
 * ## Outputs — `StepAnalysis`
 * | Field | Type | Description |
 * |---|---|---|
 * | `verdict` | `"confirmed" \| "refuted" \| "inconclusive"` | Whether the evidence supports the hypothesis. |
 * | `reasoning` | `string` | Evidence-grounded explanation citing the actual `result`. |
 * | `hint` | `"conclude" \| "next-hypothesis" \| "refine-query"` (optional) | Advisory only — the planner decides the actual next action. |
 *
 * ## Dependencies
 * ### Upstream
 * - `sparktrace-query-gen` + `QueryExecutor.execute` + the deterministic `compact()` layer —
 *   supply `query`/`result` (never the raw `QueryExecutionResult.rows`).
 * ### Downstream
 * - The orchestrator's planner reads `verdict` (hard gate on hypothesis status) and may
 *   consider `hint` alongside the full accumulated evidence.
 * ### External Services
 * - Configured text generation model via `generativeModelName` on the `Generate JSON` node.
 * ### Environment Variables
 * - `SPARKTRACE_ANALYST_FLOW_ID` — deployed flow id used by `apps/lib/lamatic-client.ts`.
 * - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — Lamatic client credentials.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode` / `graphqlNode`) — receives `{ symptom, hypothesis, query, result }`.
 * 2. `Generate JSON` (`InstructorLLMNode`) — applies
 *    `@prompts/sparktrace-analyst_generate-json_system.md` (evidence/confidence/no-fabrication
 *    discipline) and `@prompts/sparktrace-analyst_generate-json_user.md` (injects `symptom`,
 *    `hypothesis`, `query`, `result`), constrained to the `StepAnalysis` schema.
 * 3. `API Response` (`graphqlResponseNode`) — maps `verdict`, `reasoning`, `hint` straight
 *    through; the caller (`apps/lib/lamatic-client.ts`) validates/casts into `StepAnalysis`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Fix |
 * |---|---|---|
 * | `verdict` always `inconclusive` | `result.sampleRows`/`stats` genuinely empty or `result.error` set | Check the upstream query/executor/compactor; this is often correct behavior, not a bug. |
 * | `hint` missing | Model had no strong opinion | Expected — `hint` is optional/advisory; the planner still decides. |
 *
 * ## Notes
 * - Output is strict JSON (`InstructorLLMNode` schema-constrained), matching `StepAnalysis`
 *   exactly — no superset, no `mode` field.
 * - This flow never queries AWS itself — it only reasons over the compacted evidence it is handed.
 */

// Flow: sparktrace-analyst

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "SparkTrace Analyst",
  "description": "Analyzes a diagnostic query's compacted execution result to confirm/refute a hypothesis, returning a verdict, evidence-grounded reasoning, and an advisory next-step hint.",
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
    "query": {
      "id": "qry-hyp-join-explosion-1-1",
      "hypothesisId": "hyp-join-explosion-1",
      "engine": "athena",
      "sql": "SELECT o.region_id, COUNT(*) AS dropped_orders, SUM(o.amount) AS dropped_amount FROM raw.orders o LEFT JOIN raw.dim_region d ON o.region_id = d.region_id WHERE d.region_id IS NULL AND o.order_date >= date_add('day', -3, current_date) GROUP BY o.region_id",
      "purpose": "Finds orders whose region_id has no match in dim_region, which an inner join would silently drop, undercounting revenue."
    },
    "result": {
      "queryId": "qry-hyp-join-explosion-1-1",
      "columns": ["region_id", "dropped_orders", "dropped_amount"],
      "sampleRows": [
        { "region_id": "R-99", "dropped_orders": 214, "dropped_amount": 18342.51 }
      ],
      "stats": {
        "columns": [
          { "name": "dropped_orders", "type": "bigint", "min": 214, "max": 214, "avg": 214, "nulls": 0, "distinct": 1 }
        ]
      },
      "rowCount": 1,
      "bytesScanned": 5242880,
      "runtimeMs": 812,
      "truncated": false
    }
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
  "InstructorLLMNode_530": [
    {
      "mode": "instructor",
      "name": "generativeModelName",
      "type": "model",
      "label": "Generative Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "generator/text",
      "description": "Select the model used to analyze the compacted query evidence and produce a verdict.",
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
    "sparktrace_analyst_generate_json_system": "@prompts/sparktrace-analyst_generate-json_system.md",
    "sparktrace_analyst_generate_json_user": "@prompts/sparktrace-analyst_generate-json_user.md"
  },
  "modelConfigs": {
    "sparktrace_analyst_generate_json": "@model-configs/sparktrace-analyst_generate-json.ts"
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
        "advance_schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"symptom\": { \"type\": \"string\" },\n    \"hypothesis\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"id\": { \"type\": \"string\" },\n        \"title\": { \"type\": \"string\" }\n      },\n      \"required\": [\"id\", \"title\"]\n    },\n    \"query\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"id\": { \"type\": \"string\" },\n        \"sql\": { \"type\": \"string\" }\n      },\n      \"required\": [\"id\", \"sql\"]\n    },\n    \"result\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"columns\": { \"type\": \"array\" },\n        \"sampleRows\": { \"type\": \"array\", \"maxItems\": 10 },\n        \"stats\": { \"type\": \"object\" },\n        \"rowCount\": { \"type\": \"number\" }\n      },\n      \"required\": [\"columns\", \"sampleRows\", \"stats\", \"rowCount\"],\n      \"additionalProperties\": false\n    }\n  },\n  \"required\": [\"symptom\", \"hypothesis\", \"query\", \"result\"]\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_530",
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
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"verdict\": { \"type\": \"string\", \"enum\": [\"confirmed\", \"refuted\", \"inconclusive\"] },\n    \"reasoning\": { \"type\": \"string\" },\n    \"hint\": { \"type\": \"string\", \"enum\": [\"conclude\", \"next-hypothesis\", \"refine-query\"], \"description\": \"optional — advisory only\" }\n  },\n  \"required\": [\"verdict\", \"reasoning\"]\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/sparktrace-analyst_generate-json_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/sparktrace-analyst_generate-json_user.md"
          }
        ],
        "memories": "@model-configs/sparktrace-analyst_generate-json.ts",
        "messages": "@model-configs/sparktrace-analyst_generate-json.ts",
        "attachments": "@model-configs/sparktrace-analyst_generate-json.ts",
        "generativeModelName": "@model-configs/sparktrace-analyst_generate-json.ts"
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
        "outputMapping": "{\n  \"verdict\": \"{{InstructorLLMNode_530.output.verdict}}\",\n  \"reasoning\": \"{{InstructorLLMNode_530.output.reasoning}}\",\n  \"hint\": \"{{InstructorLLMNode_530.output.hint}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_530",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_530",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_530-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_530",
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
