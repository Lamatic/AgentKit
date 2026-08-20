/*
 * # SparkTrace Reporter
 * The final synthesis flow of the SparkTrace investigation loop. Takes the full
 * `Investigation` state (symptom, planner decisions, hypotheses, steps with their compacted
 * results, repo insights) and produces the caller-facing `RootCauseReport`.
 *
 * ## Purpose
 * Backs the single `reasoner.report({ investigation })` call in the orchestrator loop
 * (`apps/actions/orchestrate.ts`, step 3 of the planner loop). It runs once, after the
 * planner has emitted a `conclude` decision (or the step budget is exhausted), and its output
 * is emitted straight to the UI as the terminal `{ type: "report", report }` InvestigationEvent.
 *
 * Tier: **Claude Sonnet 5** (`claude-sonnet-5`) — user-facing prose quality matters here; set
 * in `@model-configs/sparktrace-reporter_generate-json.ts`.
 *
 * ## When To Use
 * - Once, at the end of the planner loop, to synthesize everything gathered into a root cause,
 *   confidence, evidence list, suggested fix, and caveats.
 *
 * ## When Not To Use
 * - Not mid-loop: the planner decides when the investigation concludes. Calling this before any
 *   step reached `confirmed` will correctly return a low-confidence / inconclusive report, but
 *   that wastes a call.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `investigation` | `Investigation` | Yes | Full investigation state: `symptom`, `decisions`, `hypotheses`, `steps` (each with `hypothesis`/`query`/`compact`/`analysis`), `repoInsights`. |
 *
 * ## Outputs — `RootCauseReport`
 * | Field | Type | Description |
 * |---|---|---|
 * | `rootCause` | `string` | The identified cause, or an explicit inconclusive statement. |
 * | `confidence` | `number` | 0–1 confidence in the root cause. |
 * | `evidence` | `EvidenceItem[]` | `{ hypothesisId, queryId, finding }[]` pulled from `investigation.steps`. |
 * | `suggestedFix` | `string` | Concrete engineering fix (or the next diagnostic step if inconclusive). |
 * | `caveats` | `string[]` | Limits on confidence (truncated results, untested hypotheses, demo fixtures, etc). |
 *
 * ## Dependencies
 * ### Upstream
 * - The orchestrator's accumulated `Investigation` — populated by planner/query-gen/analyst/repo-reader.
 * ### Downstream
 * - The orchestrator emits `{ type: "report", report }` straight to the UI's RootCauseReport panel.
 * ### External Services
 * - Configured text model via `generativeModelName` on the `Generate JSON` node.
 * ### Environment Variables
 * - `SPARKTRACE_REPORTER_FLOW_ID` — deployed flow id used by `apps/lib/lamatic-client.ts`.
 * - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — Lamatic client credentials.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode` / `graphqlNode`) — receives `{ investigation }`.
 * 2. `Generate JSON` (`InstructorLLMNode`) — applies
 *    `@prompts/sparktrace-reporter_generate-json_system.md` (evidence discipline: ground every
 *    claim in `steps[].analysis`/`compact`, cite ids that exist, state confidence, no fabricated
 *    rows) and `@prompts/sparktrace-reporter_generate-json_user.md` (injects the investigation),
 *    constrained to the `RootCauseReport` schema.
 * 3. `API Response` (`graphqlResponseNode`) — maps the report fields to the caller.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Fix |
 * |---|---|---|
 * | Generic-sounding `rootCause` | No step reached `verdict: "confirmed"` | Expected when the loop was cut short; surfaced via `caveats`. |
 * | `evidence[].queryId` not in `investigation.steps` | Model hallucinated an id | `lamatic-client.ts` validates ids against `steps[].query.id`; reject/retry. |
 *
 * ## Notes
 * - Output is strict JSON (`InstructorLLMNode` schema-constrained).
 * - This flow never queries AWS — it only reasons over evidence handed to it.
 */

// Flow: sparktrace-reporter

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "SparkTrace Reporter",
  "description": "Synthesizes the full SparkTrace investigation (decisions, steps, compacted evidence, repo insights) into a final root-cause report with confidence, evidence, a suggested fix, and caveats.",
  "tags": [
    "🕵️ Agentic",
    "🛠️ Data Engineering"
  ],
  "testInput": {
    "investigation": {
      "id": "inv-demo-1",
      "symptom": "The daily revenue_by_region table has undercounted revenue for the last 3 days compared to the source orders table.",
      "mode": "demo",
      "pipeline": { "repoUrl": "", "files": [], "tables": [], "dag": [], "summary": "Nightly job joins orders to dim_region and writes revenue_by_region." },
      "decisions": [],
      "hypotheses": [],
      "steps": [
        {
          "hypothesis": {
            "id": "hyp-late-1",
            "title": "Late-arriving dimension drops recent orders via INNER JOIN",
            "rationale": "orders is inner-joined to a lagged dim_region; recent-customer orders have no dimension row and are dropped.",
            "category": "late-arriving",
            "confidence": 0.8,
            "status": "confirmed"
          },
          "query": {
            "id": "qry-late-1",
            "hypothesisId": "hyp-late-1",
            "engine": "athena",
            "sql": "SELECT o.order_date, COUNT(*) AS dropped FROM orders o LEFT JOIN dim_region d ON o.region_id = d.region_id WHERE d.region_id IS NULL GROUP BY o.order_date ORDER BY o.order_date LIMIT 1000",
            "purpose": "Anti-join to find orders with no matching dimension row."
          },
          "guard": { "ok": true, "violations": [], "normalizedSql": "", "rewritten": true },
          "compact": {
            "queryId": "qry-late-1",
            "columns": ["order_date", "dropped"],
            "sampleRows": [
              { "order_date": "2024-01-08", "dropped": 3 },
              { "order_date": "2024-01-09", "dropped": 3 },
              { "order_date": "2024-01-10", "dropped": 3 }
            ],
            "stats": { "columns": [] },
            "rowCount": 3,
            "runtimeMs": 12,
            "truncated": false
          },
          "analysis": {
            "verdict": "confirmed",
            "reasoning": "Unmatched orders cluster on the 3 most recent dates, matching the undercount window."
          }
        }
      ],
      "repoInsights": [
        { "focus": "daily_revenue.py join", "insight": "Inner join to a 2-day-lagged dim_region; mart overwritten each run so the gap never self-heals." }
      ],
      "status": "reporting"
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
  "InstructorLLMNode_640": [
    {
      "mode": "instructor",
      "name": "generativeModelName",
      "type": "model",
      "label": "Generative Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "generator/text",
      "description": "Select the model used to synthesize the final root-cause report (Sonnet 5 tier).",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "defaultValue": ""
    }
  ]
};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "sparktrace_reporter_generate_json_system": "@prompts/sparktrace-reporter_generate-json_system.md",
    "sparktrace_reporter_generate_json_user": "@prompts/sparktrace-reporter_generate-json_user.md"
  },
  "modelConfigs": {
    "sparktrace_reporter_generate_json": "@model-configs/sparktrace-reporter_generate-json.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "modes": {},
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"investigation\": { \"type\": \"object\" }\n  },\n  \"required\": [\"investigation\"]\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_640",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "InstructorLLMNode",
      "modes": {},
      "values": {
        "nodeName": "Generate JSON",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"rootCause\": { \"type\": \"string\" },\n    \"confidence\": { \"type\": \"number\" },\n    \"evidence\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"hypothesisId\": { \"type\": \"string\" },\n          \"queryId\": { \"type\": \"string\" },\n          \"finding\": { \"type\": \"string\" }\n        },\n        \"required\": [\"hypothesisId\", \"queryId\", \"finding\"]\n      }\n    },\n    \"suggestedFix\": { \"type\": \"string\" },\n    \"caveats\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } }\n  },\n  \"required\": [\"rootCause\", \"confidence\", \"evidence\", \"suggestedFix\", \"caveats\"]\n}",
        "prompts": [
          {
            "id": "3a1f7c22-9b44-4a1e-8c31-000000000001",
            "role": "system",
            "content": "@prompts/sparktrace-reporter_generate-json_system.md"
          },
          {
            "id": "3a1f7c22-9b44-4a1e-8c31-000000000002",
            "role": "user",
            "content": "@prompts/sparktrace-reporter_generate-json_user.md"
          }
        ],
        "memories": "@model-configs/sparktrace-reporter_generate-json.ts",
        "messages": "@model-configs/sparktrace-reporter_generate-json.ts",
        "attachments": "@model-configs/sparktrace-reporter_generate-json.ts",
        "generativeModelName": "@model-configs/sparktrace-reporter_generate-json.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "retries": "0",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"rootCause\": \"{{InstructorLLMNode_640.output.rootCause}}\",\n  \"confidence\": \"{{InstructorLLMNode_640.output.confidence}}\",\n  \"evidence\": \"{{InstructorLLMNode_640.output.evidence}}\",\n  \"suggestedFix\": \"{{InstructorLLMNode_640.output.suggestedFix}}\",\n  \"caveats\": \"{{InstructorLLMNode_640.output.caveats}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_640",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_640",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_640-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_640",
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
