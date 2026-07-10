/*
 * # Confirmation Agent
 * BUILT, TESTED, AND EXPORTED from Lamatic Studio (Zaid's Organization / ZaidsProject406,
 * model claude-haiku-4-5), both branches verified end-to-end. The
 * `meta`/`inputs`/`references`/`nodes`/`edges` below are the real export via Studio's "Export
 * as AgentKit" menu — do not hand-edit the node graph; re-export from Studio if the flow
 * changes.
 *
 * ## Purpose
 * Writes the booking once the customer has picked a specific slot, and generates a
 * natural-language confirmation message — or, if the slot was taken in the meantime, a
 * same-shape decline message instead of a false confirmation.
 *
 * ## Trigger
 * API request (graphqlNode). Schema: `{ confirmed_date: string, confirmed_time: string,
 * service_type: string, customer_name: string, session_id: string }`.
 *
 * ## Node Walkthrough (as built)
 * 1. `API Request` (trigger) — receives `confirmed_date`, `confirmed_time`, `service_type`,
 *    `customer_name`, `session_id`.
 * 2. `Write Booking` (codeNode) — re-checks the confirmed slot is still present in the inline
 *    `OPEN_SLOTS` array (see `scripts/mock-availability.js`) immediately before "writing", to
 *    guard against a double-booking race between two customers confirming near-simultaneously.
 *    Sets `output.booked` (boolean). Always executes regardless of which branch fires
 *    downstream, so `booked` is safe to source directly from this node for the response.
 * 3. `Condition` — checks `{{codeNode_672.output.booked}} == "true"`.
 *    - `Condition 1` (true) → `Generate Confirmation` (Generate Text LLM node,
 *      claude-haiku-4-5): produces a short, warm confirmation message restating service, date,
 *      time, and customer name. System prompt:
 *      `@prompts/confirmation-agent_llmnode-440_system_0.md`. Output field:
 *      `generatedResponse` (string).
 *    - `Else` (false) → `Prepare Failure Message` (codeNode): sets `booked: false` and a fixed
 *      `confirmation_message` apologizing that the slot was taken and asking the customer to
 *      pick another time. No LLM call needed here — the message is a static string since there
 *      is nothing to personalize about a failed booking.
 * 4. `API Response` — output mapping:
 *    - `booked` ← `{{codeNode_672.output.booked}}` (Write Booking runs on every execution).
 *    - `confirmation_message` ←
 *      `{{codeNode_676.output.confirmation_message}}{{LLMNode_440.output.generatedResponse}}`
 *      — both branch outputs concatenated in sequence. Only one of the two ever executes per
 *      run, and an unexecuted node's referenced output resolves to an empty string, so the
 *      concatenation always yields exactly the one message that actually ran. Same
 *      undefined-as-falsy merge pattern used in the Scheduling Agent's `message` field — see
 *      decision log.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `confirmed_date` | `string` | Yes | The date the customer selected, `YYYY-MM-DD`. |
 * | `confirmed_time` | `string` | Yes | The time the customer selected. |
 * | `service_type` | `string` | Yes | From the Intake Agent's output. |
 * | `customer_name` | `string` | Yes | From the session object / Intake Agent's output. |
 * | `session_id` | `string` | Yes | Session identifier. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `booked` | `boolean` | False if the re-check found the slot was taken in the meantime. |
 * | `confirmation_message` | `string` | Natural-language confirmation (LLM-generated) or a
 *   fixed decline message, depending on `booked`. |
 *
 * ## Dependencies
 * - `scripts/mock-availability.js` (MVP: `OPEN_SLOTS` inline array) / Google Calendar API
 *   (stretch — same interface, `Write Booking` becomes an `apiNode`).
 * - LLM provider for the Generate Confirmation node (Anthropic credential, claude-haiku-4-5).
 * - Twilio (stretch only, not built) for actually sending the confirmation as SMS/email.
 *
 * ## Known limitation
 * `Write Booking`'s re-check reads the same static `OPEN_SLOTS` array every time — it doesn't
 * actually remove a slot once booked, since there's no persistent store on the Lamatic side
 * (the Next.js app's session object is the source of truth for booking status across the
 * pipeline). This means the double-booking guard only catches slots that were never in
 * `OPEN_SLOTS` to begin with, not slots booked by an earlier request in the same session run.
 * Acceptable for MVP; a real implementation would back this with the same store the Scheduling
 * Agent reads from.
 */

// Flow: confirmation-agent

// -- Meta --
export const meta = {
  "name": "Confirmation Agent",
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
  "LLMNode_440": [
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
    "confirmation_agent_llmnode_440_system_0": "@prompts/confirmation-agent_llmnode-440_system_0.md",
    "confirmation_agent_llmnode_440_user_1": "@prompts/confirmation-agent_llmnode-440_user_1.md"
  },
  "modelConfigs": {
    "confirmation_agent_llmnode_440_generative_model_name": "@model-configs/confirmation-agent_llmnode-440_generative-model-name.ts"
  },
  "scripts": {
    "confirmation_agent_code_node_672_code": "@scripts/confirmation-agent_code-node-672_code.ts",
    "confirmation_agent_code_node_676_code": "@scripts/confirmation-agent_code-node-676_code.ts"
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
        "advance_schema": "{\n  \"confirmed_date\": \"string\",\n  \"confirmed_time\": \"string\",\n  \"service_type\": \"string\",\n  \"customer_name\": \"string\",\n  \"session_id\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_672",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/confirmation-agent_code-node-672_code.ts",
        "nodeName": "Write Booking"
      }
    }
  },
  {
    "id": "conditionNode_773",
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
            "value": "conditionNode_773-addNode_379",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_672.output.booked}}\",\n      \"operator\": \"==\",\n      \"value\": \"true\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_773-addNode_370",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "codeNode_676",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/confirmation-agent_code-node-676_code.ts",
        "nodeName": "Prepare Failure Message"
      }
    }
  },
  {
    "id": "LLMNode_440",
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
            "content": "@prompts/confirmation-agent_llmnode-440_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/confirmation-agent_llmnode-440_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Confirmation",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/confirmation-agent_llmnode-440_generative-model-name.ts"
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
        "outputMapping": "{\n  \"booked\": \"{{codeNode_672.output.booked}}\",\n  \"confirmation_message\": \"{{codeNode_676.output.confirmation_message}}{{LLMNode_440.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_672",
    "source": "triggerNode_1",
    "target": "codeNode_672",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_672-conditionNode_773",
    "source": "codeNode_672",
    "target": "conditionNode_773",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_773-LLMNode_440-183",
    "source": "conditionNode_773",
    "target": "LLMNode_440",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "LLMNode_440-responseNode_triggerNode_1-730",
    "source": "LLMNode_440",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_773-codeNode_676-261",
    "source": "conditionNode_773",
    "target": "codeNode_676",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "codeNode_676-responseNode_triggerNode_1-985",
    "source": "codeNode_676",
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
