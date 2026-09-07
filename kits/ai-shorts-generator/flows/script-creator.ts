// Flow: script-creator

// -- Meta --
export const meta = {
  "name": "scriptCreator",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Bhavik Joshi",
    "email": "bhavikjoshi8989@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_175": [
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
    "script_creator_instructor_llmnode_175_system_0": "@prompts/script-creator_instructor-llmnode-175_system_0.md",
    "script_creator_instructor_llmnode_175_user_1": "@prompts/script-creator_instructor-llmnode-175_user_1.md"
  },
  "modelConfigs": {
    "script_creator_instructor_llmnode_175_generative_model_name": "@model-configs/script-creator_instructor-llmnode-175_generative-model-name.ts"
  },
  "scripts": {
    "script_creator_code_node_894_code": "@scripts/script-creator_code-node-894_code.ts",
    "script_creator_code_node_637_code": "@scripts/script-creator_code-node-637_code.ts"
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
        "responeType": "realtime",
        "advance_schema": "{\"sampleInput\":\"string\"}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_175",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"scenes\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"scene_number\": {\n            \"type\": \"number\"\n          },\n          \"voiceover_text\": {\n            \"type\": \"string\"\n          },\n          \"image_prompt\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/script-creator_instructor-llmnode-175_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/script-creator_instructor-llmnode-175_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/script-creator_instructor-llmnode-175_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_894",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/script-creator_code-node-894_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "forLoopNode_677",
    "type": "forLoopNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopNode",
      "values": {
        "id": "forLoopNode_677",
        "wait": 0,
        "endValue": "10",
        "nodeName": "Loop",
        "increment": "1",
        "connectedTo": "forLoopEndNode_779",
        "iterateOver": "list",
        "iteratorValue": "{{codeNode_894.output.scenes}}"
      }
    }
  },
  {
    "id": "apiNode_224",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_224",
        "url": "https://api.cloudflare.com/client/v4/accounts/{{secrets.project.cloudfare_id}}/ai/run/@cf/black-forest-labs/flux-1-schnell",
        "body": "{\n  \"prompt\": \"{{forLoopNode_677.output.currentValue.image_prompt}}\"\n}",
        "method": "POST",
        "headers": "{\"Content-Type\":\"application/json\",\"Authorization\":\"Bearer {{secrets.project.cloudfare_worker_ai}}\"}",
        "retries": "0",
        "nodeName": "API",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "forLoopEndNode_779",
    "type": "forLoopEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopEndNode",
      "values": {
        "nodeName": "Loop End",
        "connectedTo": "forLoopNode_677"
      }
    }
  },
  {
    "id": "codeNode_637",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/script-creator_code-node-637_code.ts",
        "nodeName": "Code"
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
        "outputMapping": "{\n  \"output\": \"{{codeNode_637.output.scenes}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_175",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_175",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_175-codeNode_894",
    "source": "InstructorLLMNode_175",
    "target": "codeNode_894",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_894-forLoopNode_677-157",
    "source": "codeNode_894",
    "target": "forLoopNode_677",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "forLoopNode_677-apiNode_224-287",
    "source": "forLoopNode_677",
    "target": "apiNode_224",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "apiNode_224-forLoopEndNode_779-663",
    "source": "apiNode_224",
    "target": "forLoopEndNode_779",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "forLoopEndNode_779-codeNode_637",
    "source": "forLoopEndNode_779",
    "target": "codeNode_637",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_637-responseNode_triggerNode_1",
    "source": "codeNode_637",
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
  },
  {
    "id": "forLoopNode_677-forLoopEndNode_779-126",
    "source": "forLoopNode_677",
    "target": "forLoopEndNode_779",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "loopEdge"
  },
  {
    "id": "forLoopEndNode_779-forLoopNode_677-541",
    "source": "forLoopEndNode_779",
    "target": "forLoopNode_677",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "loopEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
