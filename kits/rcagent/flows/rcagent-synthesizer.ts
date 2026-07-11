export const meta = {
  "name": "rcagent-synthesizer",
  "description": "Synthesizes the final markdown RCA postmortem report.",
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
  "LLMNode_synthesizer": [
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
    "rcagent_synthesizer_system": "@prompts/rcagent-synthesizer_system.md",
    "rcagent_synthesizer_user": "@prompts/rcagent-synthesizer_user.md"
  },
  "modelConfigs": {
    "rcagent_synthesizer_config": "@model-configs/rcagent-synthesizer_config.ts"
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
        "advance_schema": "{\n  \"incidentTitle\": \"string\",\n  \"research\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_synthesizer",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "synthesizer-sys-prompt-id",
            "role": "system",
            "content": "@prompts/rcagent-synthesizer_system.md"
          },
          {
            "id": "synthesizer-user-prompt-id",
            "role": "user",
            "content": "@prompts/rcagent-synthesizer_user.md"
          }
        ],
        "memories": "@model-configs/rcagent-synthesizer_config.ts",
        "messages": "@model-configs/rcagent-synthesizer_config.ts",
        "nodeName": "Generate Text",
        "attachments": "@model-configs/rcagent-synthesizer_config.ts",
        "credentials": "",
        "generativeModelName": "@model-configs/rcagent-synthesizer_config.ts"
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
        "outputMapping": "{\n  \"postmortem\": \"{{LLMNode_synthesizer.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_synthesizer",
    "source": "triggerNode_1",
    "target": "LLMNode_synthesizer",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_synthesizer-responseNode_triggerNode_1",
    "source": "LLMNode_synthesizer",
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
