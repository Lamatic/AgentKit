/*
 * # DockerGuard Audit
 * Accepts the raw text of a Dockerfile or docker-compose file and returns a
 * structured security + best-practice audit as JSON. This is the single flow
 * behind the DockerGuard kit, exported from Lamatic Studio.
 *
 * ## Purpose
 * The flow turns an unstructured container build file into an actionable,
 * machine-readable report. A caller sends the file contents; the LLM node
 * analyses them against a fixed catalog of container-security and best-practice
 * rules (running as root, `latest` base tags, hardcoded secrets, cache-busting
 * layer order, missing multi-stage builds, and so on) and returns a JSON object
 * with an overall score, a letter grade, a short summary, a severity-sorted list
 * of findings, and the good practices already present. It performs static
 * analysis only — nothing is executed, built, pulled, or fetched.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `dockerfile` | `string` | Yes | Raw contents of the Dockerfile or compose file. |
 * | `file_type`  | `string` | No  | Hint: `dockerfile` or `compose`. |
 * | `filename`   | `string` | No  | Original file name, for context. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `report` | `string` | A JSON string (score, grade, summary, findings[], passed_checks[]). |
 *
 * The response maps `report` from `{{LLMNode_540.output.generatedResponse}}`. The
 * calling app `JSON.parse`s it; the prompt constrains the model to a single strict
 * JSON object.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) — trigger; exposes `dockerfile`, `file_type`,
 *    `filename` (declared in `advance_schema`) to downstream nodes.
 * 2. `Generate Text` (`LLMNode`) — sends the config to the model with the system +
 *    user prompts referenced from `@prompts/...` and the model settings from
 *    `@model-configs/...`; emits `generatedResponse` (the JSON report).
 * 3. `API Response` (`graphqlResponseNode`) — maps `report` to the model output.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Fix |
 * |---|---|---|
 * | Empty/invalid `report` | Model returned prose or fenced JSON | Lower temperature; keep the strict-JSON instruction. |
 * | Auth error on the LLM node | Missing provider credentials | Configure the model provider for the `Generate Text` node. |
 * | `input_type: "unknown"` | Input was not a Dockerfile/compose file | Send the raw build file contents. |
 */

// Flow: dockerguard-audit

// -- Meta --
export const meta = {
  "name": "dockerguard-audit",
  "description":
    "Statically audits a Dockerfile or docker-compose file and returns a structured JSON report: overall score, letter grade, prioritized findings (severity, line, why, fix), and the good practices already present.",
  "tags": ["devops", "security", "generative"],
  "testInput": {
    "dockerfile":
      "FROM node:latest\nADD . /app\nWORKDIR /app\nENV API_KEY=sk-live-123456\nRUN apt-get update\nRUN npm install\nEXPOSE 3000\nCMD npm start",
    "file_type": "dockerfile",
    "filename": "Dockerfile"
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/dockerguard",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Yash Tripathi",
    "email": "hydra191102@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_540": [
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
    "dockerguard_audit_llmnode_540_system_0": "@prompts/dockerguard-audit_llmnode-540_system_0.md",
    "dockerguard_audit_llmnode_540_user_1": "@prompts/dockerguard-audit_llmnode-540_user_1.md"
  },
  "modelConfigs": {
    "dockerguard_audit_llmnode_540_generative_model_name": "@model-configs/dockerguard-audit_llmnode-540_generative-model-name.ts"
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
        "advance_schema": "{\n  \"dockerfile\": \"string\",\n  \"file_type\": \"string\",\n  \"filename\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_540",
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
            "content": "@prompts/dockerguard-audit_llmnode-540_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/dockerguard-audit_llmnode-540_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/dockerguard-audit_llmnode-540_generative-model-name.ts"
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
        "outputMapping": "{\n  \"report\": \"{{LLMNode_540.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_540",
    "source": "triggerNode_1",
    "target": "LLMNode_540",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_540-responseNode_triggerNode_1",
    "source": "LLMNode_540",
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
