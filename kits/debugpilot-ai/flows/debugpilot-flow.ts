// Flow: debugpilot-flow

// -- Meta --
export const meta = {
  "name": "debugpilot-flow",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Yash Ramnani",
    "email": "yashyr190@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_857": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "agentClassifierNode_801": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_211": [
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
    "debugpilot_flow_instructor_llmnode_857_system_0": "@prompts/debugpilot-flow_instructor-llmnode-857_system_0.md",
    "debugpilot_flow_instructor_llmnode_857_user_1": "@prompts/debugpilot-flow_instructor-llmnode-857_user_1.md",
    "debugpilot_flow_agent_classifier_node_801_system_0": "@prompts/debugpilot-flow_agent-classifier-node-801_system_0.md",
    "debugpilot_flow_agent_classifier_node_801_user_1": "@prompts/debugpilot-flow_agent-classifier-node-801_user_1.md",
    "debugpilot_flow_llmnode_211_system_0": "@prompts/debugpilot-flow_llmnode-211_system_0.md",
    "debugpilot_flow_llmnode_211_user_1": "@prompts/debugpilot-flow_llmnode-211_user_1.md"
  },
  "modelConfigs": {
    "debugpilot_flow_instructor_llmnode_857_generative_model_name": "@model-configs/debugpilot-flow_instructor-llmnode-857_generative-model-name.ts",
    "debugpilot_flow_agent_classifier_node_801_generative_model_name": "@model-configs/debugpilot-flow_agent-classifier-node-801_generative-model-name.ts",
    "debugpilot_flow_llmnode_211_generative_model_name": "@model-configs/debugpilot-flow_llmnode-211_generative-model-name.ts"
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
        "nodeName": "API Request",
        "advance_schema": "{\n  \"sampleInput\": \"string\"\n}",
        "responeType": "realtime",
        "id": "triggerNode_1"
      }
    }
  },
  {
    "id": "InstructorLLMNode_857",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "nodeName": "Generate JSON",
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"category\": {\n      \"type\": \"string\"\n    },\n    \"severity\": {\n      \"type\": \"string\"\n    },\n    \"subsystem\": {\n      \"type\": \"string\"\n    },\n    \"confidence\": {\n      \"type\": \"number\"\n    },\n    \"rootCause\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "content": "@prompts/debugpilot-flow_instructor-llmnode-857_system_0.md",
            "role": "system"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "content": "@prompts/debugpilot-flow_instructor-llmnode-857_user_1.md",
            "role": "user"
          }
        ],
        "tools": [],
        "messages": "[]",
        "memories": "[]",
        "attachments": "",
        "generativeModelName": "@model-configs/debugpilot-flow_instructor-llmnode-857_generative-model-name.ts"
      }
    }
  },
  {
    "id": "addNode_513",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  },
  {
    "id": "agentClassifierNode_801",
    "type": "agentClassifierNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "agentClassifierNode",
      "values": {
        "nodeName": "Classifier",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "content": "@prompts/debugpilot-flow_agent-classifier-node-801_system_0.md",
            "role": "system"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "content": "@prompts/debugpilot-flow_agent-classifier-node-801_user_1.md",
            "role": "user"
          }
        ],
        "classifier": [
          {
            "label": "Classifier 5",
            "value": "agentClassifierNode_801-plus-node-addNode_884262-739",
            "description": "Authentication Error"
          },
          {
            "label": "Classifier 4",
            "value": "agentClassifierNode_801-plus-node-addNode_399403-279",
            "description": "Database Error "
          },
          {
            "label": "Classifier 3",
            "value": "agentClassifierNode_801-plus-node-addNode_687967-919",
            "description": "API Error "
          },
          {
            "label": "Classifier 1",
            "value": "agentClassifierNode_801-addNode_867",
            "description": "Runtime Error"
          },
          {
            "label": "Classifier 2",
            "value": "agentClassifierNode_801-addNode_513",
            "description": "Deployment Failure"
          }
        ],
        "generativeModelName": "@model-configs/debugpilot-flow_agent-classifier-node-801_generative-model-name.ts"
      }
    }
  },
  {
    "id": "plus-node-addNode_884262",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  },
  {
    "id": "plus-node-addNode_399403",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  },
  {
    "id": "plus-node-addNode_687967",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  },
  {
    "id": "LLMNode_211",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "content": "@prompts/debugpilot-flow_llmnode-211_system_0.md",
            "role": "system"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "content": "@prompts/debugpilot-flow_llmnode-211_user_1.md",
            "role": "user"
          }
        ],
        "tools": [],
        "credentials": "",
        "messages": "[]",
        "memories": "[]",
        "attachments": "",
        "generativeModelName": "@model-configs/debugpilot-flow_llmnode-211_generative-model-name.ts"
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
        "nodeName": "API Response",
        "outputMapping": "{}",
        "webhookUrl": "",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "retry_delay": "0"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_857",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_857",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_857-agentClassifierNode_801",
    "source": "InstructorLLMNode_857",
    "target": "agentClassifierNode_801",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agentClassifierNode_801-addNode_513",
    "source": "agentClassifierNode_801",
    "target": "addNode_513",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentClassifierEdge"
  },
  {
    "id": "addNode_513-responseNode_triggerNode_1",
    "source": "addNode_513",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agentClassifierNode_801-LLMNode_211-155",
    "source": "agentClassifierNode_801",
    "target": "LLMNode_211",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentClassifierEdge"
  },
  {
    "id": "LLMNode_211-responseNode_triggerNode_1-342",
    "source": "LLMNode_211",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agentClassifierNode_801-plus-node-addNode_687967-919",
    "source": "agentClassifierNode_801",
    "target": "plus-node-addNode_687967",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentClassifierEdge"
  },
  {
    "id": "plus-node-addNode_687967-responseNode_triggerNode_1-314",
    "source": "plus-node-addNode_687967",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agentClassifierNode_801-plus-node-addNode_399403-279",
    "source": "agentClassifierNode_801",
    "target": "plus-node-addNode_399403",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentClassifierEdge"
  },
  {
    "id": "plus-node-addNode_399403-responseNode_triggerNode_1-149",
    "source": "plus-node-addNode_399403",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agentClassifierNode_801-plus-node-addNode_884262-739",
    "source": "agentClassifierNode_801",
    "target": "plus-node-addNode_884262",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentClassifierEdge"
  },
  {
    "id": "plus-node-addNode_884262-responseNode_triggerNode_1-698",
    "source": "plus-node-addNode_884262",
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