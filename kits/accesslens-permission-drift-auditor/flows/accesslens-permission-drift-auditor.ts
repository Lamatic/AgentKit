// Flow: accesslens-permission-drift-auditor

// -- Meta --
export const meta = {
  "name": "accesslens-permission-drift-auditor",
  "description": "Compare intended permissions against current access and identify permission drift.",
  "tags": ["security", "access-control", "permission-drift", "audit"],
  "testInput": null,
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/accesslens-permission-drift-auditor",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Sagnik Sengupta",
    "email": "sagniksenguptaa@gmail.com"
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
    "audit_system": "@prompts/audit-system.md",
    "audit_user": "@prompts/audit-user.md"
  },
  "modelConfigs": {
    "audit_generative_model_name": "@model-configs/accesslens_audit_generative-model-name.ts"
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
        "advance_schema": "{\n  \"intended_policy\": \"string\",\n  \"current_access\": \"string\"\n}"
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
        "tools": [],
        "prompts": [
          {
            "id": "accesslens-system-prompt",
            "role": "system",
            "content": "@prompts/audit-system.md"
          },
          {
            "id": "accesslens-user-prompt",
            "role": "user",
            "content": "@prompts/audit-user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Audit Permissions",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/accesslens_audit_generative-model-name.ts"
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
        "outputMapping": "{\n  \"report\": \"{{LLMNode_1.output.generatedResponse}}\"\n}"
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

export default { meta, inputs, references, nodes, edges };