// Flow: defect-triage

// -- Meta --
export const meta = {
  "name": "defect-triage",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "SHARVESH",
    "email": "sharvesh0519@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_359": [
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
    "defect_triage_instructor_llmnode_359_system_0": "@prompts/defect-triage_instructor-llmnode-359_system_0.md",
    "defect_triage_instructor_llmnode_359_user_1": "@prompts/defect-triage_instructor-llmnode-359_user_1.md"
  },
  "modelConfigs": {
    "defect_triage_instructor_llmnode_359_generative_model_name": "@model-configs/defect-triage_instructor-llmnode-359_generative-model-name.ts"
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
        "advance_schema": "{\n  \"defectDescription\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_359",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"severity\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"One of: low, medium, high, critical\"\n    },\n    \"root_cause_hypothesis\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"A short, specific explanation of the most likely cause of the defect\"\n    },\n    \"recommended_action\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"One of: pass, rework, reject, escalate\"\n    },\n    \"reasoning\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"One or two sentences explaining why this severity and action were chosen\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/defect-triage_instructor-llmnode-359_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/defect-triage_instructor-llmnode-359_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/defect-triage_instructor-llmnode-359_generative-model-name.ts"
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
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_359",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_359",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_359-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_359",
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
