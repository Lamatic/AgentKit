/*
 * # Interview Coach Flow
 * Takes job role, company, background, and experience level as inputs.
 * Returns a structured JSON with technical questions, behavioral questions, answer tips, company insights, and a 30-60-90 day plan.
 */

// Flow: interview-coach-flow

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Interview Coach Flow",
  "description": "Takes job role, company, background, and experience level as inputs. Returns a structured JSON with technical questions, behavioral questions, answer tips, company insights, and a 30-60-90 day plan.",
  "tags": [
    "assistant",
    "interview",
    "prep"
  ],
  "testInput": {
    "jobRole": "Frontend Developer",
    "company": "Lamatic.ai",
    "background": "React, TypeScript, 2 years of experience",
    "experienceLevel": "junior"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_1": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "isPrivate": true
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "interview_coach_flow_system": "@prompts/interview-coach-flow_system.md",
    "interview_coach_flow_user": "@prompts/interview-coach-flow_user.md"
  },
  "modelConfigs": {
    "interview_coach_flow_llm": "@model-configs/interview-coach-flow_llm.ts"
  },
  "scripts": {
    "interview_coach_flow_parse_json": "@scripts/interview-coach-flow_parse-json.ts"
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
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"jobRole\": \"string\",\n  \"company\": \"string\",\n  \"background\": \"string\",\n  \"experienceLevel\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 150
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Prep Kit",
        "tools": [],
        "prompts": [
          {
            "role": "system",
            "content": "@prompts/interview-coach-flow_system.md"
          },
          {
            "role": "user",
            "content": "@prompts/interview-coach-flow_user.md"
          }
        ],
        "memories": "@model-configs/interview-coach-flow_llm.ts",
        "messages": "@model-configs/interview-coach-flow_llm.ts",
        "attachments": "@model-configs/interview-coach-flow_llm.ts",
        "credentials": "@model-configs/interview-coach-flow_llm.ts",
        "generativeModelName": "@model-configs/interview-coach-flow_llm.ts"
      }
    }
  },
  {
    "id": "codeNode_parse_json",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 300
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Parse JSON",
        "code": "@scripts/interview-coach-flow_parse-json.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 450
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"output\": \"{{codeNode_parse_json.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_1",
    "source": "triggerNode_1",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_1-codeNode_parse_json",
    "source": "LLMNode_1",
    "target": "codeNode_parse_json",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_parse_json-graphqlResponseNode_1",
    "source": "codeNode_parse_json",
    "target": "graphqlResponseNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_1",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
