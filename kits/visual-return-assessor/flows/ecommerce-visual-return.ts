// Flow: ecommerce-visual-return

// -- Meta --
export const meta = {
  "name": "Ecommerce Visual Return",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Dhruv Bakshi",
    "email": "dhruvbakshi0803@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_560": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "RAGNode_455": [
    {
      "name": "vectorDB",
      "label": "Database",
      "type": "select"
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    },
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_295": [
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
    "ecommerce_visual_return_instructor_llmnode_560_system_0": "@prompts/ecommerce-visual-return_instructor-llmnode-560_system_0.md",
    "ecommerce_visual_return_instructor_llmnode_560_user_1": "@prompts/ecommerce-visual-return_instructor-llmnode-560_user_1.md",
    "ecommerce_visual_return_ragnode_455_system_0": "@prompts/ecommerce-visual-return_ragnode-455_system_0.md",
    "ecommerce_visual_return_ragnode_455_system_1": "@prompts/ecommerce-visual-return_ragnode-455_system_1.md",
    "ecommerce_visual_return_ragnode_455_user_2": "@prompts/ecommerce-visual-return_ragnode-455_user_2.md",
    "ecommerce_visual_return_instructor_llmnode_295_system_0": "@prompts/ecommerce-visual-return_instructor-llmnode-295_system_0.md",
    "ecommerce_visual_return_instructor_llmnode_295_user_1": "@prompts/ecommerce-visual-return_instructor-llmnode-295_user_1.md"
  },
  "modelConfigs": {
    "ecommerce_visual_return_instructor_llmnode_560_generative_model_name": "@model-configs/ecommerce-visual-return_instructor-llmnode-560_generative-model-name.ts",
    "ecommerce_visual_return_ragnode_455_generative_model_name": "@model-configs/ecommerce-visual-return_ragnode-455_generative-model-name.ts",
    "ecommerce_visual_return_ragnode_455_embedding_model_name": "@model-configs/ecommerce-visual-return_ragnode-455_embedding-model-name.ts",
    "ecommerce_visual_return_instructor_llmnode_295_generative_model_name": "@model-configs/ecommerce-visual-return_instructor-llmnode-295_generative-model-name.ts"
  },
  "scripts": {
    "ecommerce_visual_return_code_node_116_code": "@scripts/ecommerce-visual-return_code-node-116_code.ts",
    "ecommerce_visual_return_code_node_131_code": "@scripts/ecommerce-visual-return_code-node-131_code.ts",
    "ecommerce_visual_return_code_node_891_code": "@scripts/ecommerce-visual-return_code-node-891_code.ts",
    "ecommerce_visual_return_code_node_395_code": "@scripts/ecommerce-visual-return_code-node-395_code.ts"
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
        "advance_schema": "{\n  \"orderId\": \"string\",\n  \"userEmail\": \"string\",\n  \"itemCategory\": \"string\",\n  \"claimReason\": \"string\",\n  \"imageBinary\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_560",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"authenticityMatch\": {\n      \"type\": \"boolean\",\n      \"required\": true,\n      \"description\": \"True if the item in the photo matches the ordered product category; False if it is the wrong item.\"\n    },\n    \"damageType\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"The specific visual damage identified in the image (e.g., 'Screen Crack', 'Fabric Tear', 'No Damage Visible').\"\n    },\n    \"severityScore\": {\n      \"type\": \"number\",\n      \"required\": true,\n      \"description\": \"Numerical rating from 0.0 (pristine/no damage) to 1.0 (completely destroyed).\"\n    },\n    \"tamperingDetected\": {\n      \"type\": \"boolean\",\n      \"required\": true,\n      \"description\": \"True if the image shows signs of fraud such as digital manipulation, stock photo usage, or a photo taken of a screen; False if authentic.\"\n    },\n    \"visualNotes\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"A brief text summary detailing what the vision model observed in the photo to explain its analysis.\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "f0c4dcfa-86d2-46a4-ad23-0a8a232db441",
            "role": "system",
            "content": "@prompts/ecommerce-visual-return_instructor-llmnode-560_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/ecommerce-visual-return_instructor-llmnode-560_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Vision Inspection Node",
        "modelLogic": [
          {
            "type": "fallback",
            "config": "configA",
            "onTimeout": false,
            "fallbackConfig": "configB"
          }
        ],
        "attachments": "",
        "generativeModelName": "@model-configs/ecommerce-visual-return_instructor-llmnode-560_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_116",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/ecommerce-visual-return_code-node-116_code.ts",
        "nodeName": "Decision Code"
      }
    }
  },
  {
    "id": "conditionNode_212",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "id": "conditionNode_212",
        "nodeName": "Dual Condition Router",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_212-addNode_242",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_116.output.route}}\",\n      \"operator\": \"==\",\n      \"value\": \"PASS\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_212-addNode_706",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "codeNode_131",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/ecommerce-visual-return_code-node-131_code.ts",
        "nodeName": "Rejection Code"
      }
    }
  },
  {
    "id": "RAGNode_455",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "RAGNode",
      "values": {
        "limit": "3",
        "filters": "{\n  \"operator\": \"And\",\n  \"operands\": [\n    {\n      \"path\": [\n        \"category\"\n      ],\n      \"operator\": \"Equal\",\n      \"valueText\": \"{{triggerNode_1.output.itemCategory}}\"\n    }\n  ]\n}",
        "prompts": [
          {
            "id": "167aa865-2a1d-4cc5-a026-055670e1cbe5",
            "role": "system",
            "content": "@prompts/ecommerce-visual-return_ragnode-455_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/ecommerce-visual-return_ragnode-455_system_1.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/ecommerce-visual-return_ragnode-455_user_2.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Vector Policy RAG Node",
        "vectorDB": [
          "ReturnPolicyStore"
        ],
        "certainty": "0.7",
        "modelLogic": [
          {
            "type": "fallback",
            "config": "configA",
            "timeout": 10000,
            "onTimeout": true,
            "fallbackConfig": "configB"
          }
        ],
        "queryField": "{{triggerNode_1.output.itemCategory}} return and refund policy for {{InstructorLLMNode_560.output.damageType}} damage claim. Issue details: {{triggerNode_1.output.claimReason}}.",
        "embeddingModelName": "@model-configs/ecommerce-visual-return_ragnode-455_embedding-model-name.ts",
        "generativeModelName": "@model-configs/ecommerce-visual-return_ragnode-455_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_295",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"decision\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"enum\": [\n        \"APPROVE\",\n        \"REJECT\",\n        \"MANUAL_REVIEW\"\n      ],\n      \"description\": \"The final automated determination for the return claim (e.g., 'APPROVE', 'REJECT', 'MANUAL_REVIEW').\"\n    },\n    \"confidenceScore\": {\n      \"type\": \"number\",\n      \"required\": true,\n      \"description\": \"The AI's certainty rating in its decision, represented as a value between 0.0 (low confidence) and 1.0 (high confidence).\"\n    },\n    \"fraudRiskScore\": {\n      \"type\": \"number\",\n      \"required\": true,\n      \"description\": \"The calculated likelihood of return fraud or policy abuse, on a scale from 0.0 (negligible risk) to 1.0 (critical risk).\"\n    },\n    \"policyReference\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"The specific policy section or clause retrieved from the vector store that justifies the final decision (e.g., 'Section 4.2: Electronics Visual Inspection Policy').\"\n    },\n    \"reasoning\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"A concise explanation detailing why the decision was reached based on visual evidence and store policy guidelines.\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/ecommerce-visual-return_instructor-llmnode-295_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/ecommerce-visual-return_instructor-llmnode-295_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Policy Evaluator Node",
        "attachments": "",
        "generativeModelName": "@model-configs/ecommerce-visual-return_instructor-llmnode-295_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_891",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/ecommerce-visual-return_code-node-891_code.ts",
        "nodeName": "Unified Response"
      }
    }
  },
  {
    "id": "codeNode_395",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/ecommerce-visual-return_code-node-395_code.ts",
        "nodeName": "Consolidation Code"
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
        "outputMapping": "{\n  \"success\": \"{{codeNode_395.output.success}}\",\n  \"decision\": \"{{codeNode_395.output.decision}}\",\n  \"confidenceScore\": \"{{codeNode_395.output.confidenceScore}}\",\n  \"fraudRiskScore\": \"{{codeNode_395.output.fraudRiskScore}}\",\n  \"authenticityMatch\": \"{{codeNode_395.output.authenticityMatch}}\",\n  \"damageType\": \"{{codeNode_395.output.damageType}}\",\n  \"policyReference\": \"{{codeNode_395.output.policyReference}}\",\n  \"reasoning\": \"{{codeNode_395.output.reasoning}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_560",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_560",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_560-codeNode_116",
    "source": "InstructorLLMNode_560",
    "target": "codeNode_116",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_116-conditionNode_212",
    "source": "codeNode_116",
    "target": "conditionNode_212",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_212-addNode_242",
    "source": "conditionNode_212",
    "target": "RAGNode_455",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_212-addNode_706",
    "source": "conditionNode_212",
    "target": "codeNode_131",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "RAGNode_455-InstructorLLMNode_295",
    "source": "RAGNode_455",
    "target": "InstructorLLMNode_295",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_295-codeNode_891",
    "source": "InstructorLLMNode_295",
    "target": "codeNode_891",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_891-codeNode_395-580",
    "source": "codeNode_891",
    "target": "codeNode_395",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_131-codeNode_395-184",
    "source": "codeNode_131",
    "target": "codeNode_395",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_395-responseNode_triggerNode_1-281",
    "source": "codeNode_395",
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
