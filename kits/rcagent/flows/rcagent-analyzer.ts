export const meta = {
  "name": "rcagent-analyzer",
  "description": "Performs deep analysis of stack traces, git diffs and configs.",
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
  "LLMNode_analyzer": [
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
    "rcagent_analyzer_system": "@prompts/rcagent-analyzer_system.md",
    "rcagent_analyzer_user": "@prompts/rcagent-analyzer_user.md"
  },
  "modelConfigs": {
    "rcagent_analyzer_config": "@model-configs/rcagent-analyzer_config.ts"
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
        "advance_schema": "{\n  \"steps\": \"string\",\n  \"gitDiff\": \"string\",\n  \"configSettings\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_analyzer",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "analyzer-sys-prompt-id",
            "role": "system",
            "content": "@prompts/rcagent-analyzer_system.md"
          },
          {
            "id": "analyzer-user-prompt-id",
            "role": "user",
            "content": "@prompts/rcagent-analyzer_user.md"
          }
        ],
        "memories": "@model-configs/rcagent-analyzer_config.ts",
        "messages": "@model-configs/rcagent-analyzer_config.ts",
        "nodeName": "Generate Text",
        "attachments": "@model-configs/rcagent-analyzer_config.ts",
        "credentials": "",
        "generativeModelName": "@model-configs/rcagent-analyzer_config.ts"
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
        "outputMapping": "{\n  \"research\": \"{{LLMNode_analyzer.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_analyzer",
    "source": "triggerNode_1",
    "target": "LLMNode_analyzer",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_analyzer-responseNode_triggerNode_1",
    "source": "LLMNode_analyzer",
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
