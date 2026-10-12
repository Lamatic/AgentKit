// Flow: analyze-schema-drift

// -- Meta --
export const meta = {
  "name": "Analyze Schema Drift",
  "description": "Analyzes breaking API schema changes and outputs grounded migration impact.",
  "tags": ["drift", "schema", "openapi"],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Mohamad Shafeez",
    "email": "shafeezchappi18@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_1": [
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
    "analyze_schema_drift_llm_node_system": "@prompts/analyze-schema-drift_llm-node_system.md"
  },
  "modelConfigs": {
    "analyze_schema_drift_llm_node_generative_model_name": "@model-configs/analyze-schema-drift_llm-node_generative-model-name.ts"
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
        "advance_schema": "{\n  \"sampleInput\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_1",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"impactSummary\": {\n      \"type\": \"string\"\n    },\n    \"affectedClients\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"migrationGuidance\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"deploymentRecommendation\": {\n      \"type\": \"string\"\n    }\n  },\n  \"required\": [\n    \"impactSummary\",\n    \"affectedClients\",\n    \"migrationGuidance\",\n    \"deploymentRecommendation\"\n  ],\n  \"additionalProperties\": false\n}",
        "prompts": [
          {
            "id": "analyze-schema-drift-system",
            "role": "system",
            "content": "@prompts/analyze-schema-drift_llm-node_system.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/analyze-schema-drift_llm-node_generative-model-name.ts"
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
        "outputMapping": "{\n  \"impactSummary\": \"{{LLMNode_1.output.impactSummary}}\",\n  \"affectedClients\": \"{{LLMNode_1.output.affectedClients}}\",\n  \"migrationGuidance\": \"{{LLMNode_1.output.migrationGuidance}}\",\n  \"deploymentRecommendation\": \"{{LLMNode_1.output.deploymentRecommendation}}\"\n}"
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
    "id": "LLMNode_1-responseNode_triggerNode_1",
    "source": "LLMNode_1",
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

export default {
  meta,
  inputs,
  references,
  nodes,
  edges
};