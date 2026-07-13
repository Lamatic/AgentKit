/*
 * # draft-comms
 * The communications flow for Incident Copilot. Given the leading hypothesis and
 * evidence from an investigation, it drafts (a) a hedged Slack status update and
 * (b) a blameless postmortem skeleton — in parallel. It only drafts; it never posts.
 *
 * ## Inputs (trigger advance_schema)
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `hypothesis`        | string | Yes | The leading hypothesis title + reasoning. |
 * | `evidence`          | string | Yes | Supporting & contradicting evidence for it. |
 * | `rankedHypotheses`  | string | Yes | The full ranked list (for contributing factors / action items). |
 * | `incidentId`        | string | Yes | Incident identifier, for the postmortem header. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `slackUpdate` | string | A 3–4 sentence, honestly-hedged incident-channel update. |
 * | `postmortem`  | string | A Markdown postmortem skeleton with TBDs for genuine unknowns. |
 *
 * ## Node walkthrough
 * 1. `API Request` (graphqlNode) — receives the investigation result.
 * 2. `Draft_Slack` (LLMNode) — writes the status update (moderate temperature).
 * 3. `Draft_Postmortem` (LLMNode) — writes the postmortem skeleton (low temperature).
 * 4. `API Response` — returns both drafts.
 *
 * The two drafts are independent and run in parallel from the trigger.
 */

// Flow: draft-comms

// -- Meta --
export const meta = {
  "name": "draft-comms",
  "description": "Drafts a hedged Slack incident update and a blameless postmortem skeleton from an investigation result. Drafts only — never posts.",
  "tags": ["🤖 Agentic", "🛠️ Devtools"],
  "testInput": {
    "hypothesis": "Database connection pool exhaustion on the orders DB (medium confidence).",
    "evidence": "Supporting: alert shows latency + 5xx on checkout and orders; RB-03 matches 'pool timeout' symptoms. Contradicting: no direct connection-count metric in the alert yet.",
    "rankedHypotheses": "1) DB pool exhaustion (medium) 2) Bad deploy to orders-service (medium) 3) Cache stampede after deploy (low)",
    "incidentId": "INC-2043"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": { "name": "Tushar Anand", "email": "tusharanand797@gmail.com" }
};

// -- Inputs --
export const inputs = {};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "draft_comms_slack_system": "@prompts/draft-comms_slack_system.md",
    "draft_comms_postmortem_system": "@prompts/draft-comms_postmortem_system.md",
    "draft_comms_user": "@prompts/draft-comms_user.md"
  },
  "modelConfigs": {
    "draft_comms_slack": "@model-configs/draft-comms_slack.ts",
    "draft_comms_postmortem": "@model-configs/draft-comms_postmortem.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"hypothesis\": \"string\",\n  \"evidence\": \"string\",\n  \"rankedHypotheses\": \"string\",\n  \"incidentId\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_slack",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_slack",
        "tools": [],
        "nodeName": "Draft_Slack",
        "prompts": [
          {
            "id": "b1c2d3e4-0001-4a5b-8c7d-000000000001",
            "role": "system",
            "content": "@prompts/draft-comms_slack_system.md"
          },
          {
            "id": "b1c2d3e4-0002-4a5b-8c7d-000000000002",
            "role": "user",
            "content": "@prompts/draft-comms_user.md"
          }
        ],
        "memories": "@model-configs/draft-comms_slack.ts",
        "messages": "@model-configs/draft-comms_slack.ts",
        "attachments": "@model-configs/draft-comms_slack.ts",
        "credentials": "@model-configs/draft-comms_slack.ts",
        "generativeModelName": "@model-configs/draft-comms_slack.ts"
      }
    }
  },
  {
    "id": "LLMNode_postmortem",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_postmortem",
        "tools": [],
        "nodeName": "Draft_Postmortem",
        "prompts": [
          {
            "id": "b1c2d3e4-0003-4a5b-8c7d-000000000003",
            "role": "system",
            "content": "@prompts/draft-comms_postmortem_system.md"
          },
          {
            "id": "b1c2d3e4-0004-4a5b-8c7d-000000000004",
            "role": "user",
            "content": "@prompts/draft-comms_user.md"
          }
        ],
        "memories": "@model-configs/draft-comms_postmortem.ts",
        "messages": "@model-configs/draft-comms_postmortem.ts",
        "attachments": "@model-configs/draft-comms_postmortem.ts",
        "credentials": "@model-configs/draft-comms_postmortem.ts",
        "generativeModelName": "@model-configs/draft-comms_postmortem.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"slackUpdate\": \"{{LLMNode_slack.output.generatedResponse}}\",\n  \"postmortem\": \"{{LLMNode_postmortem.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_slack",
    "source": "triggerNode_1",
    "target": "LLMNode_slack",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-LLMNode_postmortem",
    "source": "triggerNode_1",
    "target": "LLMNode_postmortem",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_slack-responseNode_triggerNode_1",
    "source": "LLMNode_slack",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_postmortem-responseNode_triggerNode_1",
    "source": "LLMNode_postmortem",
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
