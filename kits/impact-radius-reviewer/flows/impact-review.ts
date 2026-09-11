// Flow: impact-review

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "impact-review",
  "description": "Turn a diffcontext compile --json payload + PR diff into an impact-radius reviewer brief (what breaks, test coverage, blind spots).",
  "tags": ["code-review", "static-analysis", "git"],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Trakshan Mishra",
    "email": "trakshanmishra477@gmail.com"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_217": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ]
};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "impact_review_llmnode_217_system_0": "@prompts/impact-review_llmnode-217_system_0.md",
    "impact_review_llmnode_217_user_1": "@prompts/impact-review_llmnode-217_user_1.md"
  },
  "modelConfigs": {
    "impact_review_llmnode_217_generative_model_name": "@model-configs/impact-review_llmnode-217_generative-model-name.ts"
  },
  "scripts": {
    "parse_diffcontext": "@scripts/impact-review_parse-diffcontext.ts"
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
        "advance_schema": "{\n  \"diffcontext_json\": \"string\",\n  \"pr_diff\": \"string\",\n  \"credential_detected\": \"boolean\"\n}"
      }
    }
  },
  {
    "id": "codeNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_1",
        "nodeName": "Parse DiffContext JSON",
        "code": "@scripts/impact-review_parse-diffcontext.ts"
      }
    }
  },
  {
    "id": "LLMNode_217",
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
            "id": "prompt_sys_impact_0",
            "role": "system",
            "content": "@prompts/impact-review_llmnode-217_system_0.md"
          },
          {
            "id": "prompt_usr_impact_1",
            "role": "user",
            "content": "@prompts/impact-review_llmnode-217_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Brief",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/impact-review_llmnode-217_generative-model-name.ts"
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
        "outputMapping": "{\n  \"output\": \"{{LLMNode_217.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_1",
    "source": "triggerNode_1",
    "target": "codeNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_1-LLMNode_217",
    "source": "codeNode_1",
    "target": "LLMNode_217",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_217-responseNode_triggerNode_1",
    "source": "LLMNode_217",
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
