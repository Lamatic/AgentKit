// Flow: sentinel-triage

// -- Meta --
export const meta = {
  "name": "sentinel-triage",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Amaresh Hebbar",
    "email": "test@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_808": [
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
    "sentinel_triage_instructor_llmnode_808_system_0": "@prompts/sentinel-triage_instructor-llmnode-808_system_0.md",
    "sentinel_triage_instructor_llmnode_808_user_1": "@prompts/sentinel-triage_instructor-llmnode-808_user_1.md"
  },
  "modelConfigs": {
    "sentinel_triage_instructor_llmnode_808_generative_model_name": "@model-configs/sentinel-triage_instructor-llmnode-808_generative-model-name.ts"
  },
  "scripts": {
    "sentinel_triage_code_node_123_code": "@scripts/sentinel-triage_code-node-123_code.ts"
  }
};

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
        "responeType": "async",
        "advance_schema": "{\n  \"alert_text\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_123",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/sentinel-triage_code-node-123_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "InstructorLLMNode_808",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"severity\": {\n      \"type\": \"string\"\n    },\n    \"confidence\": {\n      \"type\": \"string\"\n    },\n    \"attack_technique_id\": {\n      \"type\": \"string\"\n    },\n    \"attack_technique_name\": {\n      \"type\": \"string\"\n    },\n    \"attack_tactic\": {\n      \"type\": \"string\"\n    },\n    \"summary\": {\n      \"type\": \"string\"\n    },\n    \"iocs\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"remediation_steps\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/sentinel-triage_instructor-llmnode-808_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/sentinel-triage_instructor-llmnode-808_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/sentinel-triage_instructor-llmnode-808_generative-model-name.ts"
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
        "outputMapping": "{\n  \"severity\": \"{{InstructorLLMNode_808.output.severity}}\",\n  \"confidence\": \"{{InstructorLLMNode_808.output.confidence}}\",\n  \"attack_technique_id\": \"{{InstructorLLMNode_808.output.attack_technique_id}}\",\n  \"attack_technique_name\": \"{{InstructorLLMNode_808.output.attack_technique_name}}\",\n  \"attack_tactic\": \"{{InstructorLLMNode_808.output.attack_tactic}}\",\n  \"summary\": \"{{InstructorLLMNode_808.output.summary}}\",\n  \"iocs\": \"{{InstructorLLMNode_808.output.iocs}}\",\n  \"remediation_steps\": \"{{InstructorLLMNode_808.output.remediation_steps}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_123-512",
    "source": "triggerNode_1",
    "target": "codeNode_123",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_123-InstructorLLMNode_808",
    "source": "codeNode_123",
    "target": "InstructorLLMNode_808",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_808-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_808",
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
