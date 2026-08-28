// Flow: cicd

// -- Meta --
export const meta = {
  "name": "cicd",
  "description": "An AI-powered multi-agent workflow that analyses GitHub Actions and GitLab CI logs, identifies root causes, and generates actionable, verified fixes using RAG-backed knowledge retrieval.",
  "tags": ["ci-cd", "devops", "rag", "multi-agent", "gemini"],
  "testInput": null,
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/ci-cd-diagnosis-agent",
  "documentationUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/ci-cd-diagnosis-agent/lamatic-setup.md",
  "deployUrl": "",
  "author": {
    "name": "Pawan Chhimwal",
    "email": ""
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_939": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_526": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_291": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_487": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_683": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_660": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_906": [
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
    "cicd_llmnode_939_system_0": "@prompts/cicd_llmnode-939_system_0.md",
    "cicd_llmnode_939_user_1": "@prompts/cicd_llmnode-939_user_1.md",
    "cicd_llmnode_526_system_0": "@prompts/cicd_llmnode-526_system_0.md",
    "cicd_llmnode_526_user_1": "@prompts/cicd_llmnode-526_user_1.md",
    "cicd_llmnode_291_system_0": "@prompts/cicd_llmnode-291_system_0.md",
    "cicd_llmnode_291_user_1": "@prompts/cicd_llmnode-291_user_1.md",
    "cicd_llmnode_487_system_0": "@prompts/cicd_llmnode-487_system_0.md",
    "cicd_llmnode_487_user_1": "@prompts/cicd_llmnode-487_user_1.md",
    "cicd_llmnode_683_system_0": "@prompts/cicd_llmnode-683_system_0.md",
    "cicd_llmnode_683_user_1": "@prompts/cicd_llmnode-683_user_1.md",
    "cicd_llmnode_660_system_0": "@prompts/cicd_llmnode-660_system_0.md",
    "cicd_llmnode_660_user_1": "@prompts/cicd_llmnode-660_user_1.md",
    "cicd_llmnode_906_system_0": "@prompts/cicd_llmnode-906_system_0.md",
    "cicd_llmnode_906_user_1": "@prompts/cicd_llmnode-906_user_1.md"
  },
  "modelConfigs": {
    "cicd_llmnode_939_generative_model_name": "@model-configs/cicd_llmnode-939_generative-model-name.ts",
    "cicd_llmnode_526_generative_model_name": "@model-configs/cicd_llmnode-526_generative-model-name.ts",
    "cicd_llmnode_291_generative_model_name": "@model-configs/cicd_llmnode-291_generative-model-name.ts",
    "cicd_llmnode_487_generative_model_name": "@model-configs/cicd_llmnode-487_generative-model-name.ts",
    "cicd_llmnode_683_generative_model_name": "@model-configs/cicd_llmnode-683_generative-model-name.ts",
    "cicd_llmnode_660_generative_model_name": "@model-configs/cicd_llmnode-660_generative-model-name.ts",
    "cicd_llmnode_906_generative_model_name": "@model-configs/cicd_llmnode-906_generative-model-name.ts"
  },
  "scripts": {
    "cicd_code_node_675_code": "@scripts/cicd_code-node-675_code.ts",
    "cicd_code_node_435_code": "@scripts/cicd_code-node-435_code.ts",
    "cicd_code_node_823_code": "@scripts/cicd_code-node-823_code.ts"
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
        "advance_schema": "{\n  \"logContent\": \"string\",\n  \"ciProvider\": \"string\",\n  \"job_id\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_675",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/cicd_code-node-675_code.ts",
        "nodeName": "Cod Evidence Extractor"
      }
    }
  },
  {
    "id": "LLMNode_939",
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
            "content": "@prompts/cicd_llmnode-939_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/cicd_llmnode-939_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Error Classifier",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/cicd_llmnode-939_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_526",
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
            "content": "@prompts/cicd_llmnode-526_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/cicd_llmnode-526_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Planner",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/cicd_llmnode-526_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_291",
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
            "content": "@prompts/cicd_llmnode-291_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/cicd_llmnode-291_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Mock Knowledge Base (rag need subscription)",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/cicd_llmnode-291_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_435",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/cicd_code-node-435_code.ts",
        "nodeName": "Root Cause Analyzer"
      }
    }
  },
  {
    "id": "LLMNode_487",
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
            "content": "@prompts/cicd_llmnode-487_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/cicd_llmnode-487_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Fix Generator",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/cicd_llmnode-487_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_683",
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
            "content": "@prompts/cicd_llmnode-683_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/cicd_llmnode-683_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Fix Verifier",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/cicd_llmnode-683_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_660",
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
            "content": "@prompts/cicd_llmnode-660_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/cicd_llmnode-660_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Risk Reviewer",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/cicd_llmnode-660_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_906",
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
            "content": "@prompts/cicd_llmnode-906_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/cicd_llmnode-906_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/cicd_llmnode-906_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_823",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/cicd_code-node-823_code.ts",
        "nodeName": "Output Formatter"
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
        "outputMapping": "{\n  \"metadata\": \"{{codeNode_823.output.metadata}}\",\n  \"classification\": \"{{codeNode_823.output.classification}}\",\n  \"analysis\": \"{{codeNode_823.output.analysis}}\",\n  \"resolution\": \"{{codeNode_823.output.resolution}}\",\n  \"risk\": \"{{codeNode_823.output.risk}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_675",
    "source": "triggerNode_1",
    "target": "codeNode_675",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_675-LLMNode_939",
    "source": "codeNode_675",
    "target": "LLMNode_939",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_939-LLMNode_526",
    "source": "LLMNode_939",
    "target": "LLMNode_526",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_526-LLMNode_291",
    "source": "LLMNode_526",
    "target": "LLMNode_291",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_291-codeNode_435",
    "source": "LLMNode_291",
    "target": "codeNode_435",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_435-LLMNode_487",
    "source": "codeNode_435",
    "target": "LLMNode_487",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_487-LLMNode_683",
    "source": "LLMNode_487",
    "target": "LLMNode_683",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_683-LLMNode_660",
    "source": "LLMNode_683",
    "target": "LLMNode_660",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_660-LLMNode_906",
    "source": "LLMNode_660",
    "target": "LLMNode_906",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_906-codeNode_823",
    "source": "LLMNode_906",
    "target": "codeNode_823",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_823-responseNode_triggerNode_1",
    "source": "codeNode_823",
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
