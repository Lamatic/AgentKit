/*
 * # SparkTrace Analyst
 * The evidence-analysis and root-cause-reporting reasoning flow of the SparkTrace
 * investigation loop. Operates in two modes selected by an input `mode` field: `"analyze"`
 * turns one query's execution result into a verdict + next action; `"report"` synthesizes
 * the full investigation into a final root-cause report.
 *
 * ## Purpose
 * This single flow backs two calls in the orchestrator's loop
 * (`apps/actions/orchestrate.ts`):
 * - `reasoner.analyze({symptom, hypothesis, query, execution})` (step 3e) — called once per
 *   investigation step, right after `executor.execute()` returns a `QueryExecutionResult`.
 *   It decides whether the hypothesis just tested is `confirmed`/`refuted`/`inconclusive`
 *   and what the loop should do next.
 * - `reasoner.report({investigation})` (step 4) — called once, after the loop has confirmed
 *   a hypothesis or exhausted `maxSteps`, to synthesize the final `RootCauseReport`.
 *
 * Both responsibilities share the same evidence-discipline requirements (ground every claim
 * in real query results, never fabricate rows, always state confidence), so they are
 * implemented as one flow whose system prompt branches on `mode` rather than as two
 * near-duplicate flows. **The `mode` field on the trigger input is what switches behavior**;
 * the node's JSON schema is a superset covering both output shapes, and the prompt
 * instructs the model to populate only the fields for the requested mode.
 *
 * ## When To Use
 * - `mode: "analyze"` — immediately after any `QueryExecutionResult` comes back from the
 *   `QueryExecutor`, to decide the verdict on the hypothesis just tested.
 * - `mode: "report"` — once, at the end of the loop (hypothesis confirmed or `maxSteps`
 *   reached), to produce the caller-facing root-cause report.
 *
 * ## When Not To Use
 * - Do not call `mode: "report"` mid-loop before any steps have real evidence — the report
 *   will correctly say "inconclusive", but it wastes a call; prefer calling it once the loop
 *   naturally terminates.
 * - Do not call `mode: "analyze"` without a real `execution` result — this flow never
 *   fabricates evidence, so an empty/missing `execution` will only ever yield `inconclusive`.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `mode` | `"analyze" \| "report"` | Yes | Selects which output shape/behavior to run. |
 * | `symptom` | `string` | analyze mode only | The original reported problem. |
 * | `hypothesis` | `Hypothesis` | analyze mode only | The hypothesis this query tested. |
 * | `query` | `DiagnosticQuery` | analyze mode only | The query that was executed. |
 * | `execution` | `QueryExecutionResult` | analyze mode only | The real result of running `query`. |
 * | `investigation` | `Investigation` | report mode only | The full investigation state (`plan`, `hypotheses`, `steps`, etc). |
 *
 * ## Outputs
 * **analyze mode** — `StepAnalysis`:
 * | Field | Type | Description |
 * |---|---|---|
 * | `verdict` | `"confirmed" \| "refuted" \| "inconclusive"` | Whether the evidence supports the hypothesis. |
 * | `reasoning` | `string` | Evidence-grounded explanation citing the actual execution result. |
 * | `nextAction` | `"conclude" \| "next-hypothesis" \| "refine-query"` | What the orchestrator loop should do next. |
 *
 * **report mode** — `RootCauseReport`:
 * | Field | Type | Description |
 * |---|---|---|
 * | `rootCause` | `string` | The identified cause, or an explicit inconclusive statement. |
 * | `confidence` | `number` | 0–1 confidence in the root cause. |
 * | `evidence` | `EvidenceItem[]` | `{ hypothesisId, queryId, finding }[]` pulled from `investigation.steps`. |
 * | `suggestedFix` | `string` | Concrete engineering fix (or next diagnostic step if inconclusive). |
 * | `caveats` | `string[]` | Limitations on confidence (truncated results, untested hypotheses, etc). |
 *
 * ## Dependencies
 * ### Upstream
 * - `sparktrace-query-gen` + `QueryExecutor.execute` — supply `query`/`execution` for analyze mode.
 * - The orchestrator's accumulated `Investigation` state — supplies `investigation` for report mode.
 * ### Downstream
 * - The orchestrator branches its loop on `nextAction` (analyze mode) or emits the final
 *   `{ type: "report", report }` `InvestigationEvent` (report mode) straight to the UI.
 * ### External Services
 * - Configured text generation model via `generativeModelName` on the `Generate JSON` node.
 * ### Environment Variables
 * - `SPARKTRACE_ANALYST` — deployed flow id used by `apps/lib/lamatic-client.ts` for both calls.
 * - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — Lamatic client credentials.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode` / `graphqlNode`) — receives the mode-tagged payload.
 * 2. `Generate JSON` (`InstructorLLMNode`) — applies
 *    `@prompts/sparktrace-analyst_generate-json_system.md` (branches instructions on `mode`,
 *    shared evidence/confidence/no-fabrication discipline) and
 *    `@prompts/sparktrace-analyst_generate-json_user.md` (injects the mode-appropriate
 *    fields), constrained to a schema that is a superset of `StepAnalysis` and
 *    `RootCauseReport` plus the echoed `mode`.
 * 3. `API Response` (`graphqlResponseNode`) — maps all possible output fields through; the
 *    caller (`apps/lib/lamatic-client.ts`) reads only the fields relevant to the `mode` it
 *    invoked with and validates/casts into `StepAnalysis` or `RootCauseReport`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Fix |
 * |---|---|---|
 * | `verdict` always `inconclusive` | `execution.rows`/`columns` genuinely empty or `execution.error` set | Check the upstream query/executor; this is often correct behavior, not a bug. |
 * | `report` mode returns generic-sounding `rootCause` | No step in `investigation.steps` actually reached `verdict: "confirmed"` | Expected when the loop was cut short by `maxSteps`; surfaced via `caveats`. |
 * | `evidence[].queryId` not found in `investigation.steps` | Model hallucinated an id despite instructions | Add downstream validation in `lamatic-client.ts` and reject/retry if ids don't match `steps[].query.id`. |
 * | Wrong output fields populated for the requested `mode` | `mode` was omitted or malformed in the request | Always pass `mode: "analyze"` or `mode: "report"` explicitly; validate before calling. |
 *
 * ## Notes
 * - Output is strict JSON (`InstructorLLMNode` schema-constrained). The schema below is a
 *   superset covering both modes' fields plus `mode`; the client should only trust the
 *   subset matching the `mode` it requested.
 * - This flow never queries AWS itself — it only reasons over evidence it is handed.
 */

// Flow: sparktrace-analyst

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "SparkTrace Analyst",
  "description": "Analyzes a diagnostic query's execution result to confirm/refute a hypothesis (analyze mode), or synthesizes the full investigation into a root-cause report (report mode).",
  "tags": [
    "🕵️ Agentic",
    "🛠️ Data Engineering"
  ],
  "testInput": {
    "mode": "analyze",
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
    "execution": {
      "queryId": "qry-hyp-join-explosion-1-1",
      "columns": ["region_id", "dropped_orders", "dropped_amount"],
      "rows": [
        { "region_id": "R-99", "dropped_orders": 214, "dropped_amount": 18342.51 }
      ],
      "rowCount": 1,
      "bytesScanned": 5242880,
      "runtimeMs": 812,
      "engine": "athena",
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
      "description": "Select the model used to analyze query evidence and synthesize the root-cause report.",
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
        "advance_schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"mode\": { \"type\": \"string\", \"enum\": [\"analyze\", \"report\"] },\n    \"symptom\": { \"type\": \"string\" },\n    \"hypothesis\": { \"type\": \"object\" },\n    \"query\": { \"type\": \"object\" },\n    \"execution\": { \"type\": \"object\" },\n    \"investigation\": { \"type\": \"object\" }\n  },\n  \"required\": [\"mode\"]\n}"
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
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"mode\": { \"type\": \"string\", \"enum\": [\"analyze\", \"report\"] },\n    \"verdict\": { \"type\": \"string\", \"enum\": [\"confirmed\", \"refuted\", \"inconclusive\"], \"description\": \"analyze mode only\" },\n    \"reasoning\": { \"type\": \"string\", \"description\": \"analyze mode only\" },\n    \"nextAction\": { \"type\": \"string\", \"enum\": [\"conclude\", \"next-hypothesis\", \"refine-query\"], \"description\": \"analyze mode only\" },\n    \"rootCause\": { \"type\": \"string\", \"description\": \"report mode only\" },\n    \"confidence\": { \"type\": \"number\", \"description\": \"report mode only\" },\n    \"evidence\": {\n      \"type\": \"array\",\n      \"description\": \"report mode only\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"hypothesisId\": { \"type\": \"string\" },\n          \"queryId\": { \"type\": \"string\" },\n          \"finding\": { \"type\": \"string\" }\n        },\n        \"required\": [\"hypothesisId\", \"queryId\", \"finding\"]\n      }\n    },\n    \"suggestedFix\": { \"type\": \"string\", \"description\": \"report mode only\" },\n    \"caveats\": { \"type\": \"array\", \"description\": \"report mode only\", \"items\": { \"type\": \"string\" } }\n  },\n  \"required\": [\"mode\"]\n}",
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
        "outputMapping": "{\n  \"mode\": \"{{InstructorLLMNode_530.output.mode}}\",\n  \"verdict\": \"{{InstructorLLMNode_530.output.verdict}}\",\n  \"reasoning\": \"{{InstructorLLMNode_530.output.reasoning}}\",\n  \"nextAction\": \"{{InstructorLLMNode_530.output.nextAction}}\",\n  \"rootCause\": \"{{InstructorLLMNode_530.output.rootCause}}\",\n  \"confidence\": \"{{InstructorLLMNode_530.output.confidence}}\",\n  \"evidence\": \"{{InstructorLLMNode_530.output.evidence}}\",\n  \"suggestedFix\": \"{{InstructorLLMNode_530.output.suggestedFix}}\",\n  \"caveats\": \"{{InstructorLLMNode_530.output.caveats}}\"\n}"
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
