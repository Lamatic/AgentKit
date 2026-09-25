// Flow: roster-rules-auditor

// -- Meta --
export const meta = {
  "name": "roster-rules-auditor",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Harsh Kamat",
    "email": "harshkamat.2307@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_260": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_836": [
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
    "roster_rules_auditor_llmnode_260_system_0": "@prompts/roster-rules-auditor_llmnode-260_system_0.md",
    "roster_rules_auditor_llmnode_260_user_1": "@prompts/roster-rules-auditor_llmnode-260_user_1.md",
    "roster_rules_auditor_llmnode_836_system_0": "@prompts/roster-rules-auditor_llmnode-836_system_0.md",
    "roster_rules_auditor_llmnode_836_user_1": "@prompts/roster-rules-auditor_llmnode-836_user_1.md"
  },
  "modelConfigs": {
    "roster_rules_auditor_llmnode_260_generative_model_name": "@model-configs/roster-rules-auditor_llmnode-260_generative-model-name.ts",
    "roster_rules_auditor_llmnode_836_generative_model_name": "@model-configs/roster-rules-auditor_llmnode-836_generative-model-name.ts"
  },
  "scripts": {
    "roster_rules_auditor_code_node_986_code": "@scripts/roster-rules-auditor_code-node-986_code.ts"
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
        "nodeName": "Audit Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"roster_text\": \"string\",\n  \"rules_text\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_260",
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
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/roster-rules-auditor_llmnode-260_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/roster-rules-auditor_llmnode-260_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Roster Parser",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/roster-rules-auditor_llmnode-260_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_836",
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
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/roster-rules-auditor_llmnode-836_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/roster-rules-auditor_llmnode-836_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Rules Parser",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/roster-rules-auditor_llmnode-836_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_986",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/roster-rules-auditor_code-node-986_code.ts",
        "nodeName": "Roster Rules Evaluator"
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
        "nodeName": "Audit Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"result\": \"{{codeNode_986.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "LLMNode_260-LLMNode_836",
    "source": "LLMNode_260",
    "target": "LLMNode_836",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_836-codeNode_986",
    "source": "LLMNode_836",
    "target": "codeNode_986",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_986-responseNode_triggerNode_1",
    "source": "codeNode_986",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-LLMNode_260-864",
    "source": "triggerNode_1",
    "target": "LLMNode_260",
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
