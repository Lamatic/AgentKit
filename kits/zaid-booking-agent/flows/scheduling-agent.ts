/*
 * # Scheduling Agent
 * BUILT, TESTED, AND EXPORTED from Lamatic Studio (Zaid's Organization / ZaidsProject406,
 * model claude-haiku-4-5). The `meta`/`inputs`/`references`/`nodes`/`edges` below are the real
 * export via Studio's "Export as AgentKit" menu — do not hand-edit the node graph; re-export
 * from Studio if the flow changes.
 *
 * ## Purpose
 * Checks the requested date/window against availability and either confirms the slot is open
 * or proposes 2-3 alternative slots — as clickable data, not just prose — so the customer can
 * accept one directly instead of re-typing a new request (see decision log: the accept-loop
 * bug this replaced).
 *
 * ## Trigger
 * API request (graphqlNode). Schema: `{ preferred_date: string, preferred_window: string,
 * session_id: string }`.
 *
 * ## Node Walkthrough (as built)
 * 1. `API Request` (trigger) — receives `preferred_date`, `preferred_window`, `session_id`.
 * 2. `Check Availability` (codeNode_970) — filters the inline `OPEN_SLOTS` array (see
 *    `scripts/mock-availability.js`) for same-day matches against `preferred_date`. Always
 *    executes regardless of which branch fires downstream. Sets:
 *    - `slot_available` (boolean) — true if any same-day slot exists.
 *    - `open_slots` (array) — same-day matches (empty when no slot is available).
 *    - `nearby_slots` (array) — the 3 `OPEN_SLOTS` entries closest to `preferred_date` by
 *      absolute date distance, used as fallback suggestions on the no-availability path (see
 *      decision log: the `open_slots` gap).
 *    - `proposed_slots` (array) — `open_slots` when available, else `nearby_slots`. Computed
 *      here (not in either branch node) specifically so it's non-empty regardless of which
 *      branch fires — see decision log: this is what makes suggested alternatives clickable
 *      instead of forcing the customer to re-type a new request to accept one.
 * 3. `Condition` — checks `{{codeNode_970.output.slot_available}} == "true"`.
 *    - `Condition 1` (true) → `Prepare Availability Response` (codeNode_594): sets
 *      `slot_available: true`, its own (now redundant but harmless) `proposed_slots` copy, and
 *      a `message` confirming the requested date.
 *    - `Else` (false) → `Suggest Alternatives` (LLMNode_969, Generate Text, claude-haiku-4-5):
 *      generates a natural-language message offering 2-3 alternatives drawn from
 *      `nearby_slots`. System prompt: `@prompts/scheduling-agent_llmnode-969_system_0.md`.
 *      Explicitly instructed to never invent a slot not present in the provided list. Output
 *      field: `generatedResponse` (string).
 * 4. `API Response` — output mapping:
 *    - `slot_available` ← `{{codeNode_970.output.slot_available}}` (Check Availability runs on
 *      every execution, so this is sourced directly rather than from either branch node).
 *    - `proposed_slots` ← `{{codeNode_970.output.proposed_slots}}` — sourced directly from
 *      Check Availability (same "always runs" reasoning as `slot_available`) rather than from
 *      either branch node, so it's populated on both the available and unavailable paths. Not
 *      merged via the `{{a}}{{b}}` branch-concatenation pattern used for `message` below —
 *      that trick is only proven safe for string fields in this repo, and `proposed_slots` is
 *      an array, so a single direct source avoids relying on untested merge behavior.
 *    - `message` ← `{{codeNode_594.output.message}}{{LLMNode_969.output.generatedResponse}}`
 *      — both branch outputs concatenated in sequence. Only one of the two ever executes per
 *      run, and an unexecuted node's referenced output resolves to an empty string, so the
 *      concatenation always yields exactly the one message that actually ran. See decision log:
 *      this is the same undefined-as-falsy pattern used in the Intake Agent's response merge,
 *      extended to a single field that can come from either of two different branch nodes.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `preferred_date` | `string` | Yes | From the Intake Agent's output, `YYYY-MM-DD`. |
 * | `preferred_window` | `string` | No | From the Intake Agent's output. Not currently used by
 *   `Check Availability` (date-only matching for MVP); passed through for the LLM's context. |
 * | `session_id` | `string` | Yes | Session identifier. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `slot_available` | `boolean` | True if the originally requested date has an open slot. |
 * | `proposed_slots` | `{date, time}[]` | The same-day open slot(s) when available, otherwise
 *   the 3 nearest alternative slots — always populated so the customer always has something
 *   clickable to accept, on either path. |
 * | `message` | `string` | Natural-language message to show the customer — either a
 *   confirmation (available path) or an LLM-generated alternatives offer (unavailable path). |
 *
 * ## Dependencies
 * - `scripts/mock-availability.js` (MVP) / Google Calendar API (stretch — same interface,
 *   `Check Availability` becomes an `apiNode`).
 * - LLM provider for the Suggest Alternatives node (Anthropic credential, claude-haiku-4-5).
 *
 * ## Known limitation
 * `Check Availability` matches on `preferred_date` only, not `preferred_window` — a customer
 * asking for "morning" gets any same-day slot, not just morning ones. Acceptable for MVP; the
 * mock data set is small enough that window filtering wasn't worth the added complexity yet.
 */

// Flow: scheduling-agent

// -- Meta --
export const meta = {
  "name": "Scheduling Agent",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Zaid Khan",
    "email": "zaid9khn@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_969": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "scheduling_agent_llmnode_969_system_0": "@prompts/scheduling-agent_llmnode-969_system_0.md",
    "scheduling_agent_llmnode_969_user_1": "@prompts/scheduling-agent_llmnode-969_user_1.md"
  },
  "modelConfigs": {
    "scheduling_agent_llmnode_969_generative_model_name": "@model-configs/scheduling-agent_llmnode-969_generative-model-name.ts"
  },
  "scripts": {
    "scheduling_agent_code_node_970_code": "@scripts/scheduling-agent_code-node-970_code.ts",
    "scheduling_agent_code_node_594_code": "@scripts/scheduling-agent_code-node-594_code.ts"
  }
};

// -- Nodes & Edges --
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
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"preferred_date\": \"string\",\n  \"preferred_window\": \"string\",\n  \"session_id\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_970",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/scheduling-agent_code-node-970_code.ts",
        "nodeName": "Check Availability"
      }
    }
  },
  {
    "id": "conditionNode_694",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_694-addNode_867",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_970.output.slot_available}}\",\n      \"operator\": \"==\",\n      \"value\": \"true\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_694-addNode_497",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "codeNode_594",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/scheduling-agent_code-node-594_code.ts",
        "nodeName": "Prepare Availability Response"
      }
    }
  },
  {
    "id": "LLMNode_969",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/scheduling-agent_llmnode-969_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/scheduling-agent_llmnode-969_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Suggest Alternatives",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/scheduling-agent_llmnode-969_generative-model-name.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"slot_available\": \"{{codeNode_970.output.slot_available}}\",\n  \"proposed_slots\": \"{{codeNode_970.output.proposed_slots}}\",\n  \"message\": \"{{codeNode_594.output.message}}{{LLMNode_969.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_970",
    "source": "triggerNode_1",
    "target": "codeNode_970",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_970-conditionNode_694",
    "source": "codeNode_970",
    "target": "conditionNode_694",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_694-codeNode_594-145",
    "source": "conditionNode_694",
    "target": "codeNode_594",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "codeNode_594-responseNode_triggerNode_1-849",
    "source": "codeNode_594",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_694-LLMNode_969-413",
    "source": "conditionNode_694",
    "target": "LLMNode_969",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "LLMNode_969-responseNode_triggerNode_1-402",
    "source": "LLMNode_969",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
