// Flow: error-log-summariser

// -- Meta --
export const meta = {
  "name": "error-log-summariser",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Manas",
    "email": "manasmahatooo293@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_262": [
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
    "error_log_summariser_llmnode_262_system_0": "@prompts/error-log-summariser_llmnode-262_system_0.md",
    "error_log_summariser_llmnode_262_user_1": "@prompts/error-log-summariser_llmnode-262_user_1.md"
  },
  "modelConfigs": {
    "error_log_summariser_llmnode_262_generative_model_name": "@model-configs/error-log-summariser_llmnode-262_generative-model-name.ts"
  },
  "scripts": {
    "error_log_summariser_request_validator_code": "@scripts/error-log-summariser_request-validator_code.ts",
    "error_log_summariser_response_sanitizer_code": "@scripts/error-log-summariser_response-sanitizer_code.ts"
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
        "advance_schema": "{\n  \"log\": \"string\",\n  \"context\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_validate_request",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/error-log-summariser_request-validator_code.ts",
        "nodeName": "Validate Request"
      }
    }
  },
  {
    "id": "LLMNode_262",
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
            "content": "@prompts/error-log-summariser_llmnode-262_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/error-log-summariser_llmnode-262_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/error-log-summariser_llmnode-262_generative-model-name.ts"
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
        "code": "@scripts/error-log-summariser_response-sanitizer_code.ts",
        "nodeName": "Response Sanitizer"
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
        "outputMapping": "{\n  \"summary\": \"{{codeNode_1.output.summary}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_validate_request",
    "source": "triggerNode_1",
    "target": "codeNode_validate_request",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_validate_request-LLMNode_262",
    "source": "codeNode_validate_request",
    "target": "LLMNode_262",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_262-codeNode_1",
    "source": "LLMNode_262",
    "target": "codeNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_1-responseNode_triggerNode_1",
    "source": "codeNode_1",
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
