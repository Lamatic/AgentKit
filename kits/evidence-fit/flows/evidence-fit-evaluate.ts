// Flow: evidence-fit-evaluate

// -- Meta --
export const meta = {
  "name": "evidence-fit-evaluate",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Naman Gupta",
    "email": "namanguptabhopal@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "searchNode_3": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select"
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "searchNode_4": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select"
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "LLMNode_8": [
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
    "evidence_fit_evaluate_llmnode_8_system_0": "@prompts/evidence-fit-evaluate_llmnode-8_system_0.md",
    "evidence_fit_evaluate_llmnode_8_user_1": "@prompts/evidence-fit-evaluate_llmnode-8_user_1.md"
  },
  "modelConfigs": {
    "evidence_fit_evaluate_search_node_3_embedding_model_name": "@model-configs/evidence-fit-evaluate_search-node-3_embedding-model-name.ts",
    "evidence_fit_evaluate_search_node_4_embedding_model_name": "@model-configs/evidence-fit-evaluate_search-node-4_embedding-model-name.ts",
    "evidence_fit_evaluate_llmnode_8_generative_model_name": "@model-configs/evidence-fit-evaluate_llmnode-8_generative-model-name.ts"
  },
  "scripts": {
    "evidence_fit_evaluate_code_node_5_code": "@scripts/evidence-fit-evaluate_code-node-5_code.ts",
    "evidence_fit_evaluate_code_node_7_code": "@scripts/evidence-fit-evaluate_code-node-7_code.ts"
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
        "advance_schema": "{\n  \"experimentId\": \"string\",\n  \"documentId\": \"string\",\n  \"documentText\": \"string\",\n  \"topK\": \"int\",\n  \"cases\": [\n    {}\n  ]\n}"
      }
    }
  },
  {
    "id": "forLoopNode_2",
    "type": "forLoopNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopNode",
      "values": {
        "id": "forLoopNode_2",
        "wait": 0,
        "endValue": "10",
        "nodeName": "Loop",
        "increment": "1",
        "connectedTo": "forLoopEndNode_6",
        "iterateOver": "list",
        "initialValue": "0",
        "iteratorValue": "{{triggerNode_1.output.cases}}"
      }
    }
  },
  {
    "id": "searchNode_3",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchNode",
      "values": {
        "id": "searchNode_3",
        "limit": 8,
        "filters": "{\n  \"operator\": \"And\",\n  \"operands\": [\n    {\n      \"path\": [\n        \"experimentId\"\n      ],\n      \"operator\": \"Equal\",\n      \"valueText\": \"{{triggerNode_1.output.experimentId}}\"\n    },\n    {\n      \"path\": [\n        \"strategy\"\n      ],\n      \"operator\": \"Equal\",\n      \"valueText\": \"fixed-width\"\n    }\n  ]\n}",
        "nodeName": "Search - Fixed-Width",
        "vectorDB": "EvidenceFit",
        "certainty": "0.5",
        "searchQuery": "{{forLoopNode_2.output.currentValue.question}}",
        "embeddingModelName": "@model-configs/evidence-fit-evaluate_search-node-3_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "searchNode_4",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchNode",
      "values": {
        "id": "searchNode_4",
        "limit": 8,
        "filters": "{\n  \"operator\": \"And\",\n  \"operands\": [\n    {\n      \"path\": [\n        \"experimentId\"\n      ],\n      \"operator\": \"Equal\",\n      \"valueText\": \"{{triggerNode_1.output.experimentId}}\"\n    },\n    {\n      \"path\": [\n        \"strategy\"\n      ],\n      \"operator\": \"Equal\",\n      \"valueText\": \"clause-aware\"\n    }\n  ]\n}",
        "nodeName": "Search - Clause-Aware",
        "vectorDB": "EvidenceFit",
        "certainty": "0.5",
        "searchQuery": "{{forLoopNode_2.output.currentValue.question}}",
        "embeddingModelName": "@model-configs/evidence-fit-evaluate_search-node-4_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_5",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_5",
        "code": "@scripts/evidence-fit-evaluate_code-node-5_code.ts",
        "nodeName": "Combine Search Results"
      }
    }
  },
  {
    "id": "forLoopEndNode_6",
    "type": "forLoopEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopEndNode",
      "values": {
        "id": "forLoopEndNode_6",
        "nodeName": "Loop End",
        "connectedTo": "forLoopNode_2",
        "outputAccumulator": "{\n  \"results\": [\n    {\n      \"caseId\": \"{{codeNode_5.output.caseId}}\",\n      \"results\": \"{{codeNode_5.output.results}}\"\n    }\n  ]\n}"
      }
    }
  },
  {
    "id": "codeNode_7",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_7",
        "code": "@scripts/evidence-fit-evaluate_code-node-7_code.ts",
        "nodeName": "Metrics"
      }
    }
  },
  {
    "id": "LLMNode_8",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_8",
        "tools": [],
        "prompts": [
          {
            "id": "7c70f23e-2993-43d4-9253-b83ada785c11",
            "role": "system",
            "content": "@prompts/evidence-fit-evaluate_llmnode-8_system_0.md"
          },
          {
            "id": "88a840f6-9a2e-49ca-9f62-73d6531fc06a",
            "role": "user",
            "content": "@prompts/evidence-fit-evaluate_llmnode-8_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Explain Verdict",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/evidence-fit-evaluate_llmnode-8_generative-model-name.ts"
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
        "nodeName": "API Response",
        "outputMapping": "{\n  \"verdict\": \"{{codeNode_7.output.verdict}}\",\n  \"baseline\": \"{{codeNode_7.output.baseline}}\",\n  \"candidate\": \"{{codeNode_7.output.candidate}}\",\n  \"recommended\": \"{{codeNode_7.output.recommended}}\",\n  \"ok\": \"{{codeNode_7.output.ok}}\",\n  \"issues\": \"{{codeNode_7.output.issues}}\",\n  \"explanation\": \"{{LLMNode_8.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-forLoopNode_2",
    "source": "triggerNode_1",
    "target": "forLoopNode_2",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "forLoopNode_2-searchNode_3",
    "source": "forLoopNode_2",
    "target": "searchNode_3",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "searchNode_3-searchNode_4",
    "source": "searchNode_3",
    "target": "searchNode_4",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "searchNode_3-codeNode_5",
    "source": "searchNode_3",
    "target": "codeNode_5",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "searchNode_4-codeNode_5",
    "source": "searchNode_4",
    "target": "codeNode_5",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_5-forLoopEndNode_6",
    "source": "codeNode_5",
    "target": "forLoopEndNode_6",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "forLoopEndNode_6-codeNode_7",
    "source": "forLoopEndNode_6",
    "target": "codeNode_7",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_7-LLMNode_8",
    "source": "codeNode_7",
    "target": "LLMNode_8",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_7-responseNode_triggerNode_1",
    "source": "codeNode_7",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_8-responseNode_triggerNode_1",
    "source": "LLMNode_8",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
