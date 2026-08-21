// Flow: compliance-audit

// -- Meta --
export const meta = {
  "name": "complianceAudit",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "name",
    "email": "mail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_286": [
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
    "compliance_audit_instructor_llmnode_286_system_0": "@prompts/compliance-audit_instructor-llmnode-286_system_0.md",
    "compliance_audit_instructor_llmnode_286_user_1": "@prompts/compliance-audit_instructor-llmnode-286_user_1.md"
  },
  "modelConfigs": {
    "compliance_audit_instructor_llmnode_286_generative_model_name": "@model-configs/compliance-audit_instructor-llmnode-286_generative-model-name.ts"
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
        "nodeName": "APIRequest",
        "responeType": "realtime",
        "advance_schema": "{\n  \"documentText\": \"string\",\n  \"guidelines\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_286",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"array\",\n  \"items\": {\n    \"type\": \"object\",\n    \"properties\": {\n      \"requirement\": {\n        \"type\": \"string\"\n      },\n      \"status\": {\n        \"type\": \"string\"\n      },\n      \"analysis\": {\n        \"type\": \"string\"\n      },\n      \"remediation\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/compliance-audit_instructor-llmnode-286_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/compliance-audit_instructor-llmnode-286_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/compliance-audit_instructor-llmnode-286_generative-model-name.ts"
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
        "nodeName": "APIResponse",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"output\": \"{{InstructorLLMNode_286.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_286",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_286",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_286-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_286",
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