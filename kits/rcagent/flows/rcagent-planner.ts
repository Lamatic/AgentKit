export const meta = {
  "name": "rcagent-planner",
  "description": "Generates a diagnostic checklist for incoming incidents.",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Shuvendu Kumar Mohapatra",
    "email": "shuvendu@example.com"
  }
};

export const inputs = {
  "LLMNode_planner": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ]
};

export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "rcagent_planner_system": "@prompts/rcagent-planner_system.md",
    "rcagent_planner_user": "@prompts/rcagent-planner_user.md"
  },
  "modelConfigs": {
    "rcagent_planner_config": "@model-configs/rcagent-planner_config.ts"
  }
};

export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"incidentTitle\": \"string\",\n  \"alertDetails\": \"string\",\n  \"logsOrSymptoms\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_planner",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "planner-sys-prompt-id",
            "role": "system",
            "content": "@prompts/rcagent-planner_system.md"
          },
          {
            "id": "planner-user-prompt-id",
            "role": "user",
            "content": "@prompts/rcagent-planner_user.md"
          }
        ],
        "memories": "@model-configs/rcagent-planner_config.ts",
        "messages": "@model-configs/rcagent-planner_config.ts",
        "nodeName": "Generate Text",
        "attachments": "@model-configs/rcagent-planner_config.ts",
        "credentials": "",
        "generativeModelName": "@model-configs/rcagent-planner_config.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"steps\": \"{{LLMNode_planner.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_planner",
    "source": "triggerNode_1",
    "target": "LLMNode_planner",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_planner-responseNode_triggerNode_1",
    "source": "LLMNode_planner",
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
