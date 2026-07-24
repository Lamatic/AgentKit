// Flow: trustguard-ai

// -- Meta --
export const meta = {
  "name": "trustguard-ai",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Tuhin Sarkar",
    "email": "tuhinsarkar581@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_381": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_849": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_847": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_352": [
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
    "trustguard_ai_instructor_llmnode_381_system_0": "@prompts/trustguard-ai_instructor-llmnode-381_system_0.md",
    "trustguard_ai_instructor_llmnode_381_user_1": "@prompts/trustguard-ai_instructor-llmnode-381_user_1.md",
    "trustguard_ai_instructor_llmnode_849_system_0": "@prompts/trustguard-ai_instructor-llmnode-849_system_0.md",
    "trustguard_ai_instructor_llmnode_849_user_1": "@prompts/trustguard-ai_instructor-llmnode-849_user_1.md",
    "trustguard_ai_instructor_llmnode_847_system_0": "@prompts/trustguard-ai_instructor-llmnode-847_system_0.md",
    "trustguard_ai_instructor_llmnode_847_user_1": "@prompts/trustguard-ai_instructor-llmnode-847_user_1.md",
    "trustguard_ai_instructor_llmnode_352_system_0": "@prompts/trustguard-ai_instructor-llmnode-352_system_0.md",
    "trustguard_ai_instructor_llmnode_352_user_1": "@prompts/trustguard-ai_instructor-llmnode-352_user_1.md"
  },
  "modelConfigs": {
    "trustguard_ai_instructor_llmnode_381_generative_model_name": "@model-configs/trustguard-ai_instructor-llmnode-381_generative-model-name.ts",
    "trustguard_ai_instructor_llmnode_849_generative_model_name": "@model-configs/trustguard-ai_instructor-llmnode-849_generative-model-name.ts",
    "trustguard_ai_instructor_llmnode_847_generative_model_name": "@model-configs/trustguard-ai_instructor-llmnode-847_generative-model-name.ts",
    "trustguard_ai_instructor_llmnode_352_generative_model_name": "@model-configs/trustguard-ai_instructor-llmnode-352_generative-model-name.ts"
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
        "advance_schema": "{\n  \"investigation_id\": \"string\",\n  \"input_type\": \"string\",\n  \"content\": \"string\",\n  \"attachment_url\": \"string\",\n  \"language\": \"string\",\n  \"memory_enabled\": \"bool\",\n  \"tenant_id\": \"string\",\n  \"user_id\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_381",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"investigation\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"title\": {\n          \"type\": \"string\"\n        },\n        \"category\": {\n          \"type\": \"string\"\n        },\n        \"status\": {\n          \"type\": \"string\"\n        },\n        \"workflow\": {\n          \"type\": \"string\"\n        },\n        \"language\": {\n          \"type\": \"string\"\n        }\n      },\n      \"additionalProperties\": true,\n      \"required\": [\n        \"title\",\n        \"category\",\n        \"status\",\n        \"workflow\",\n        \"language\"\n      ]\n    },\n    \"normalized\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"clean_text\": {\n          \"type\": \"string\"\n        },\n        \"summary\": {\n          \"type\": \"string\"\n        },\n        \"detected_input_type\": {\n          \"type\": \"string\"\n        }\n      },\n      \"additionalProperties\": true,\n      \"required\": [\n        \"clean_text\",\n        \"summary\",\n        \"detected_input_type\"\n      ]\n    }\n  },\n  \"required\": [\n    \"investigation\",\n    \"normalized\"\n  ]\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/trustguard-ai_instructor-llmnode-381_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/trustguard-ai_instructor-llmnode-381_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Investigation Planner",
        "attachments": "",
        "generativeModelName": "@model-configs/trustguard-ai_instructor-llmnode-381_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_849",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"evidence\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"urls\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"domains\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"emails\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"phone_numbers\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"money_amounts\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"brands\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"urgency_phrases\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"attachments\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"languages\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"entities\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        }\n      },\n      \"additionalProperties\": true,\n      \"required\": [\n        \"urls\",\n        \"domains\",\n        \"emails\",\n        \"phone_numbers\",\n        \"money_amounts\",\n        \"brands\",\n        \"urgency_phrases\",\n        \"attachments\",\n        \"languages\",\n        \"entities\"\n      ]\n    }\n  },\n  \"required\": [\n    \"evidence\"\n  ]\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/trustguard-ai_instructor-llmnode-849_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/trustguard-ai_instructor-llmnode-849_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Evidence Extractor",
        "attachments": "",
        "generativeModelName": "@model-configs/trustguard-ai_instructor-llmnode-849_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_847",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"analysis\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"risk_score\": {\n          \"type\": \"number\"\n        },\n        \"confidence\": {\n          \"type\": \"number\"\n        },\n        \"severity\": {\n          \"type\": \"string\"\n        },\n        \"indicators\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"high\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            },\n            \"medium\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            },\n            \"low\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            }\n          },\n          \"additionalProperties\": true,\n          \"required\": [\n            \"high\",\n            \"medium\",\n            \"low\"\n          ]\n        },\n        \"matched_patterns\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"missing_information\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"reasoning_summary\": {\n          \"type\": \"string\"\n        }\n      },\n      \"additionalProperties\": true,\n      \"required\": [\n        \"risk_score\",\n        \"confidence\",\n        \"severity\",\n        \"indicators\",\n        \"matched_patterns\",\n        \"missing_information\",\n        \"reasoning_summary\"\n      ]\n    }\n  },\n  \"required\": [\n    \"analysis\"\n  ]\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/trustguard-ai_instructor-llmnode-847_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/trustguard-ai_instructor-llmnode-847_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Threat Analyzer",
        "attachments": "",
        "generativeModelName": "@model-configs/trustguard-ai_instructor-llmnode-847_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_352",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"decision\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"classification\": {\n          \"type\": \"string\"\n        },\n        \"final_verdict\": {\n          \"type\": \"string\"\n        },\n        \"recommended_action\": {\n          \"type\": \"string\"\n        },\n        \"decision_reason\": {\n          \"type\": \"string\"\n        },\n        \"priority\": {\n          \"type\": \"string\"\n        },\n        \"human_review\": {\n          \"type\": \"boolean\"\n        }\n      },\n      \"additionalProperties\": true,\n      \"required\": [\n        \"classification\",\n        \"final_verdict\",\n        \"recommended_action\",\n        \"decision_reason\",\n        \"priority\",\n        \"human_review\"\n      ]\n    }\n  },\n  \"required\": [\n    \"decision\"\n  ]\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/trustguard-ai_instructor-llmnode-352_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/trustguard-ai_instructor-llmnode-352_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Decision Engine",
        "attachments": "",
        "generativeModelName": "@model-configs/trustguard-ai_instructor-llmnode-352_generative-model-name.ts"
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
        "outputMapping": "{\n  \"investigation\": {\n    \"id\": \"{{triggerNode_1.output.investigation_id}}\",\n    \"title\": \"{{InstructorLLMNode_381.output.investigation.title}}\",\n    \"category\": \"{{InstructorLLMNode_381.output.investigation.category}}\",\n    \"status\": \"{{InstructorLLMNode_381.output.investigation.status}}\",\n    \"workflow\": \"{{InstructorLLMNode_381.output.investigation.workflow}}\",\n    \"language\": \"{{InstructorLLMNode_381.output.investigation.language}}\"\n  },\n  \"normalized\": \"{{InstructorLLMNode_381.output.normalized}}\",\n  \"evidence\": \"{{InstructorLLMNode_849.output.evidence}}\",\n  \"analysis\": \"{{InstructorLLMNode_847.output.analysis}}\",\n  \"decision\": \"{{InstructorLLMNode_352.output.decision}}\",\n  \"metadata\": {\n    \"workflow\": \"trustguard-ai\",\n    \"version\": \"1.0.0\"\n  }\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_381",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_381",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_381-InstructorLLMNode_849",
    "source": "InstructorLLMNode_381",
    "target": "InstructorLLMNode_849",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_849-InstructorLLMNode_847",
    "source": "InstructorLLMNode_849",
    "target": "InstructorLLMNode_847",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_847-InstructorLLMNode_352",
    "source": "InstructorLLMNode_847",
    "target": "InstructorLLMNode_352",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_352-responseNode_triggerNode_1-884",
    "source": "InstructorLLMNode_352",
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
