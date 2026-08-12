// Flow: analyze-change-impact

// -- Meta --
export const meta = {
  "name": "analyze-change-impact",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "MAYANK VERMA",
    "email": "mayankverma210405@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_356_copy_979": [
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
    "analyze_change_impact_instructor_llmnode_356_copy_979_system_0": "@prompts/analyze-change-impact_instructor-llmnode-356-copy-979_system_0.md",
    "analyze_change_impact_instructor_llmnode_356_copy_979_user_1": "@prompts/analyze-change-impact_instructor-llmnode-356-copy-979_user_1.md"
  },
  "modelConfigs": {
    "analyze_change_impact_instructor_llmnode_356_copy_979_generative_model_name": "@model-configs/analyze-change-impact_instructor-llmnode-356-copy-979_generative-model-name.ts"
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
        "advance_schema": "{\n  \"flowPurpose\": \"string\",\n  \"baselineVersion\": \"string\",\n  \"candidateVersion\": \"string\",\n  \"changePackage\": \"string\",\n  \"releaseContext\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_356_copy_979",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"analysisSummary\": {\n      \"type\": \"string\",\n      \"description\": \"A concise summary of the most important semantic implications.\"\n    },\n    \"overallImpactLevel\": {\n      \"type\": \"string\",\n      \"description\": \"The estimated behavioral impact level, not a final release decision.\"\n    },\n    \"requiresHumanReview\": {\n      \"type\": \"boolean\",\n      \"description\": \"Whether the supplied evidence indicates that human review is necessary.\"\n    },\n    \"findings\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"changeId\": {\n            \"type\": \"string\",\n            \"description\": \"Identifier supplied in the change package, or a stable generated identifier.\"\n          },\n          \"category\": {\n            \"type\": \"string\"\n          },\n          \"observedFact\": {\n            \"type\": \"string\",\n            \"description\": \"What the deterministic change package explicitly proves changed.\"\n          },\n          \"possibleImpact\": {\n            \"type\": \"string\",\n            \"description\": \"A carefully qualified possible behavioral consequence.\"\n          },\n          \"severity\": {\n            \"type\": \"string\"\n          },\n          \"confidence\": {\n            \"type\": \"number\"\n          },\n          \"evidence\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"affectedComponents\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"recommendedValidation\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          }\n        },\n        \"additionalProperties\": true\n      },\n      \"description\": \"Evidence-grounded findings about individual changes.\"\n    },\n    \"crossCuttingRisks\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      },\n      \"description\": \"Risks created by the interaction of multiple changes.\"\n    },\n    \"assumptions\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"unknowns\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      },\n      \"description\": \"Important information that cannot be established from the supplied package.\"\n    },\n    \"recommendedNextChecks\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/analyze-change-impact_instructor-llmnode-356-copy-979_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/analyze-change-impact_instructor-llmnode-356-copy-979_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Semantic Change Analyzer",
        "attachments": "",
        "generativeModelName": "@model-configs/analyze-change-impact_instructor-llmnode-356-copy-979_generative-model-name.ts"
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
        "outputMapping": "{\n  \"analysis\": \"{{InstructorLLMNode_356_copy_979.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "InstructorLLMNode_356_copy_979-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_356_copy_979",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-InstructorLLMNode_356_copy_979-598",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_356_copy_979",
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
