/*
 * # Review Analyzer Flow
 * This flow receives an array of product reviews, analyzes them with an LLM, and returns structured feedback (consensus summary, pros/cons, and review trust details).
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `reviews` | `[String]` | Yes | A list of review text strings scraped from the web page. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `result` | `string` | The structured JSON output string from the LLM containing summary, pros, cons, trustScore, and trustLabel. |
 */

// Flow: review-analyzer

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Review Analyzer",
  "description": "Analyzes a list of e-commerce reviews to yield consensus summaries, pros/cons, and trust scores.",
  "tags": [
    "analyzer",
    "ecommerce",
    "extension"
  ],
  "testInput": {
    "reviews": [
      "Great build quality, very solid feel. Worth the price.",
      "The battery life is decent, but not amazing.",
      "This product broke after 2 days. Total waste of money!",
      "I received this product for free. It is okay I guess."
    ]
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/review-analyzer",
  "author": {
    "name": "Arda Ceylan",
    "email": "arda.ceylan@example.com"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "review_analyzer_llm_node_user": "@prompts/review-analyzer_llm-node_user.md",
    "review_analyzer_llm_node_system": "@prompts/review-analyzer_llm-node_system.md"
  },
  "modelConfigs": {
    "review_analyzer_llm_node": "@model-configs/review-analyzer_llm-node.ts"
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
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "LLMNode_160",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "user-prompt-1",
            "role": "user",
            "content": "@prompts/review-analyzer_llm-node_user.md"
          },
          {
            "id": "system-prompt-1",
            "role": "system",
            "content": "@prompts/review-analyzer_llm-node_system.md"
          }
        ],
        "memories": "@model-configs/review-analyzer_llm-node.ts",
        "messages": "@model-configs/review-analyzer_llm-node.ts",
        "generativeModelName": "@model-configs/review-analyzer_llm-node.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_651",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"result\": \"{{LLMNode_160.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_160",
    "source": "triggerNode_1",
    "target": "LLMNode_160",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_160-graphqlResponseNode_651",
    "source": "LLMNode_160",
    "target": "graphqlResponseNode_651",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_651",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_651",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
