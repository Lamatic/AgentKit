// Flow: tf-plan-review

// -- Meta --
export const meta = {
  "name": "tf-plan-review",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Sarthak Bhardwaj",
    "email": "sarthak.bhardwaj21b@iiitg.ac.in"
  }
};

// -- Inputs --
export const inputs = {
  "searchNode_1": [
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
  "InstructorLLMNode_1": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_1": [
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
    "tf_plan_review_instructor_llmnode_1_system_0": "@prompts/tf-plan-review_instructor-llmnode-1_system_0.md",
    "tf_plan_review_instructor_llmnode_1_user_1": "@prompts/tf-plan-review_instructor-llmnode-1_user_1.md",
    "tf_plan_review_llmnode_1_system_0": "@prompts/tf-plan-review_llmnode-1_system_0.md",
    "tf_plan_review_llmnode_1_user_1": "@prompts/tf-plan-review_llmnode-1_user_1.md"
  },
  "modelConfigs": {
    "tf_plan_review_search_node_1_embedding_model_name": "@model-configs/tf-plan-review_search-node-1_embedding-model-name.ts",
    "tf_plan_review_instructor_llmnode_1_generative_model_name": "@model-configs/tf-plan-review_instructor-llmnode-1_generative-model-name.ts",
    "tf_plan_review_llmnode_1_generative_model_name": "@model-configs/tf-plan-review_llmnode-1_generative-model-name.ts"
  },
  "scripts": {
    "tf_plan_review_code_node_1_code": "@scripts/tf-plan-review_code-node-1_code.ts"
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
        "responseType": "realtime",
        "advance_schema": "{\n  \"changes\": \"[string]\",\n  \"totalChanges\": \"int\",\n  \"summary\": \"string\"\n}"
      }
    }
  },
  {
    "id": "searchNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchNode",
      "values": {
        "id": "searchNode_1",
        "limit": "10",
        "autocut": "0",
        "filters": "",
        "nodeName": "Match policies",
        "vectorDB": "tfpolicies",
        "certainty": "0.5",
        "searchQuery": "{{triggerNode_1.output.summary}}",
        "boostProperties": false,
        "embeddingModelName": "@model-configs/tf-plan-review_search-node-1_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_1",
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"assessments\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"address\": {\n            \"type\": \"string\",\n            \"description\": \"resource address exactly as given\"\n          },\n          \"risk\": {\n            \"type\": \"string\",\n            \"enum\": [\n              \"low\",\n              \"medium\",\n              \"high\",\n              \"critical\"\n            ]\n          },\n          \"category\": {\n            \"type\": \"string\",\n            \"enum\": [\n              \"data-loss\",\n              \"availability\",\n              \"security-exposure\",\n              \"privilege\",\n              \"cost\",\n              \"drift\",\n              \"routine\"\n            ]\n          },\n          \"policyIds\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            },\n            \"description\": \"ids of matched policies, e.g. POL-03; empty if none\"\n          },\n          \"reason\": {\n            \"type\": \"string\",\n            \"description\": \"one or two sentences, cite the attribute values that matter\"\n          },\n          \"mitigation\": {\n            \"type\": \"string\",\n            \"description\": \"the concrete step that would make this change safe, or 'none needed'\"\n          },\n          \"confidence\": {\n            \"type\": \"number\"\n          }\n        },\n        \"required\": [\n          \"address\",\n          \"risk\",\n          \"category\",\n          \"policyIds\",\n          \"reason\",\n          \"mitigation\",\n          \"confidence\"\n        ]\n      }\n    }\n  },\n  \"required\": [\n    \"assessments\"\n  ]\n}",
        "prompts": [
          {
            "id": "p-system",
            "role": "system",
            "content": "@prompts/tf-plan-review_instructor-llmnode-1_system_0.md"
          },
          {
            "id": "p-user",
            "role": "user",
            "content": "@prompts/tf-plan-review_instructor-llmnode-1_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Assess risk",
        "attachments": "",
        "generativeModelName": "@model-configs/tf-plan-review_instructor-llmnode-1_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_1",
        "prompts": [
          {
            "id": "p-system",
            "role": "system",
            "content": "@prompts/tf-plan-review_llmnode-1_system_0.md"
          },
          {
            "id": "p-user",
            "role": "user",
            "content": "@prompts/tf-plan-review_llmnode-1_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Write review comment",
        "attachments": "",
        "generativeModelName": "@model-configs/tf-plan-review_llmnode-1_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_1",
        "code": "@scripts/tf-plan-review_code-node-1_code.ts",
        "nodeName": "Assemble verdict"
      }
    }
  },
  {
    "id": "responseNode_triggerNode",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode",
        "nodeName": "API Response",
        "outputMapping": "{\n  \"verdict\": \"{{codeNode_1.output.verdict}}\",\n  \"summary\": \"{{codeNode_1.output.summary}}\",\n  \"totalChanges\": \"{{codeNode_1.output.totalChanges}}\",\n  \"counts\": \"{{codeNode_1.output.counts}}\",\n  \"changes\": \"{{codeNode_1.output.changes}}\",\n  \"reviewComment\": \"{{codeNode_1.output.reviewComment}}\",\n  \"policiesConsulted\": \"{{codeNode_1.output.policiesConsulted}}\",\n  \"droppedAssessments\": \"{{codeNode_1.output.droppedAssessments}}\",\n  \"invalidFacts\": \"{{codeNode_1.output.invalidFacts}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-searchNode_1",
    "source": "triggerNode_1",
    "target": "searchNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "searchNode_1-InstructorLLMNode_1",
    "source": "searchNode_1",
    "target": "InstructorLLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_1-LLMNode_1",
    "source": "InstructorLLMNode_1",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_1-codeNode_1",
    "source": "LLMNode_1",
    "target": "codeNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_1-responseNode_triggerNode",
    "source": "codeNode_1",
    "target": "responseNode_triggerNode",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-responseNode_triggerNode",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
