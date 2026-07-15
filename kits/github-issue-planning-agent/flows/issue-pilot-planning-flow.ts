// Flow: issue-pilot-planning-flow

// -- Meta --
export const meta = {
  "name": "IssuePilot Planning Flow",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Aman Kumar Singh",
    "email": "amansingh7997@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_252": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_738": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_454": [
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
    "issue_pilot_planning_flow_instructor_llmnode_252_system_0": "@prompts/issue-pilot-planning-flow_instructor-llmnode-252_system_0.md",
    "issue_pilot_planning_flow_instructor_llmnode_252_user_1": "@prompts/issue-pilot-planning-flow_instructor-llmnode-252_user_1.md",
    "issue_pilot_planning_flow_instructor_llmnode_738_system_0": "@prompts/issue-pilot-planning-flow_instructor-llmnode-738_system_0.md",
    "issue_pilot_planning_flow_instructor_llmnode_738_user_1": "@prompts/issue-pilot-planning-flow_instructor-llmnode-738_user_1.md",
    "issue_pilot_planning_flow_instructor_llmnode_454_system_0": "@prompts/issue-pilot-planning-flow_instructor-llmnode-454_system_0.md",
    "issue_pilot_planning_flow_instructor_llmnode_454_user_1": "@prompts/issue-pilot-planning-flow_instructor-llmnode-454_user_1.md"
  },
  "modelConfigs": {
    "issue_pilot_planning_flow_instructor_llmnode_252_generative_model_name": "@model-configs/issue-pilot-planning-flow_instructor-llmnode-252_generative-model-name.ts",
    "issue_pilot_planning_flow_instructor_llmnode_738_generative_model_name": "@model-configs/issue-pilot-planning-flow_instructor-llmnode-738_generative-model-name.ts",
    "issue_pilot_planning_flow_instructor_llmnode_454_generative_model_name": "@model-configs/issue-pilot-planning-flow_instructor-llmnode-454_generative-model-name.ts"
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
      "nodeId": "webhookTriggerNode",
      "trigger": true,
      "values": {
        "nodeName": "Webhook"
      }
    }
  },
  {
    "id": "InstructorLLMNode_252",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"schemaVersion\": {\n      \"type\": \"string\",\n      \"description\": \"Schema version for the planning output.\"\n    },\n    \"analysis\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"summary\": {\n          \"type\": \"string\",\n          \"description\": \"High-level summary of the GitHub issue.\"\n        },\n        \"businessGoal\": {\n          \"type\": \"string\",\n          \"description\": \"Primary business objective.\"\n        },\n        \"requirements\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Functional requirements extracted from the issue.\"\n        },\n        \"missingInformation\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Information required before implementation.\"\n        },\n        \"clarifyingQuestions\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Questions that should be answered before development.\"\n        }\n      },\n      \"description\": \"Issue understanding and requirement extraction.\",\n      \"additionalProperties\": true\n    },\n    \"planning\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"technicalApproach\": {\n          \"type\": \"string\",\n          \"description\": \"Recommended implementation approach.\"\n        },\n        \"alternativeApproach\": {\n          \"type\": \"string\",\n          \"description\": \"Alternative implementation approach.\"\n        },\n        \"assumptions\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Engineering assumptions.\"\n        },\n        \"tasks\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"backend\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            },\n            \"frontend\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            },\n            \"database\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            },\n            \"testing\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            },\n            \"deployment\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            }\n          },\n          \"description\": \"Implementation tasks grouped by engineering domain.\",\n          \"additionalProperties\": true\n        },\n        \"timeline\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"backend\": {\n              \"type\": \"string\"\n            },\n            \"frontend\": {\n              \"type\": \"string\"\n            },\n            \"database\": {\n              \"type\": \"string\",\n              \"description\": \"Estimated effort for database implementation.\"\n            },\n            \"testing\": {\n              \"type\": \"string\"\n            },\n            \"deployment\": {\n              \"type\": \"string\"\n            },\n            \"total\": {\n              \"type\": \"string\"\n            }\n          },\n          \"description\": \"Estimated effort for implementation.\",\n          \"additionalProperties\": true\n        }\n      },\n      \"description\": \"Engineering implementation plan.\",\n      \"additionalProperties\": true\n    },\n    \"review\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"risks\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Potential implementation risks.\"\n        },\n        \"sprintBlockers\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Issues preventing implementation.\"\n        },\n        \"acceptanceCriteria\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Conditions required for successful completion.\"\n        },\n        \"definitionOfDone\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Checklist indicating feature completion.\"\n        },\n        \"sprintReadiness\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"score\": {\n              \"type\": \"string\"\n            },\n            \"status\": {\n              \"type\": \"string\"\n            },\n            \"recommendation\": {\n              \"type\": \"string\"\n            }\n          },\n          \"description\": \"Readiness assessment for sprint planning.\",\n          \"additionalProperties\": true\n        },\n        \"confidence\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"score\": {\n              \"type\": \"string\"\n            },\n            \"reason\": {\n              \"type\": \"string\"\n            }\n          },\n          \"description\": \"Confidence in the generated plan.\",\n          \"additionalProperties\": true\n        }\n      },\n      \"description\": \"Engineering review and quality assessment.\",\n      \"additionalProperties\": true\n    },\n    \"report\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"markdown\": {\n          \"type\": \"string\",\n          \"description\": \"Markdown version of the engineering report.\"\n        },\n        \"checklist\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Final implementation checklist.\"\n        }\n      },\n      \"description\": \"Final report representation.\",\n      \"additionalProperties\": true\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/issue-pilot-planning-flow_instructor-llmnode-252_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/issue-pilot-planning-flow_instructor-llmnode-252_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Planning Agent",
        "attachments": "",
        "generativeModelName": "@model-configs/issue-pilot-planning-flow_instructor-llmnode-252_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_738",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"schemaVersion\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"Schema version for the planning output.\"\n    },\n    \"analysis\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"summary\": {\n          \"type\": \"string\",\n          \"description\": \"High-level summary of the GitHub issue.\"\n        },\n        \"businessGoal\": {\n          \"type\": \"string\",\n          \"description\": \"Primary business objective.\"\n        },\n        \"requirements\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Functional requirements extracted from the issue.\"\n        },\n        \"missingInformation\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Information required before implementation.\"\n        },\n        \"clarifyingQuestions\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Questions that should be answered before development.\"\n        }\n      },\n      \"description\": \"Issue understanding and requirement extraction.\",\n      \"additionalProperties\": true\n    },\n    \"planning\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"technicalApproach\": {\n          \"type\": \"string\",\n          \"description\": \"Recommended implementation approach.\"\n        },\n        \"alternativeApproach\": {\n          \"type\": \"string\",\n          \"description\": \"Alternative implementation approach.\"\n        },\n        \"assumptions\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Engineering assumptions.\"\n        },\n        \"tasks\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"backend\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            },\n            \"frontend\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            },\n            \"database\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            },\n            \"testing\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            },\n            \"deployment\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            }\n          },\n          \"description\": \"Implementation tasks grouped by engineering domain.\",\n          \"additionalProperties\": true\n        },\n        \"engineeringInsights\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"priority\": {\n              \"type\": \"string\"\n            },\n            \"complexity\": {\n              \"type\": \"string\"\n            },\n            \"storyPoints\": {\n              \"type\": \"string\"\n            },\n            \"architectureImpact\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            },\n            \"securityReview\": {\n              \"type\": \"object\",\n              \"properties\": {\n                \"findings\": {\n                  \"type\": \"array\",\n                  \"items\": {\n                    \"type\": \"string\"\n                  }\n                }\n              },\n              \"additionalProperties\": true\n            }\n          },\n          \"additionalProperties\": true\n        },\n        \"timeline\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"backend\": {\n              \"type\": \"string\"\n            },\n            \"frontend\": {\n              \"type\": \"string\"\n            },\n            \"database\": {\n              \"type\": \"string\",\n              \"description\": \"Estimated effort for database implementation.\"\n            },\n            \"testing\": {\n              \"type\": \"string\"\n            },\n            \"deployment\": {\n              \"type\": \"string\"\n            },\n            \"total\": {\n              \"type\": \"string\"\n            }\n          },\n          \"description\": \"Estimated effort for implementation.\",\n          \"additionalProperties\": true\n        }\n      },\n      \"description\": \"Engineering implementation plan.\",\n      \"additionalProperties\": true\n    },\n    \"review\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"risks\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Potential implementation risks.\"\n        },\n        \"sprintBlockers\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Issues preventing implementation.\"\n        },\n        \"acceptanceCriteria\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Conditions required for successful completion.\"\n        },\n        \"definitionOfDone\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Checklist indicating feature completion.\"\n        },\n        \"sprintReadiness\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"score\": {\n              \"type\": \"string\"\n            },\n            \"status\": {\n              \"type\": \"string\"\n            },\n            \"recommendation\": {\n              \"type\": \"string\"\n            }\n          },\n          \"description\": \"Readiness assessment for sprint planning.\",\n          \"additionalProperties\": true\n        },\n        \"confidence\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"score\": {\n              \"type\": \"string\"\n            },\n            \"reason\": {\n              \"type\": \"string\"\n            }\n          },\n          \"description\": \"Confidence in the generated plan.\",\n          \"additionalProperties\": true\n        }\n      },\n      \"description\": \"Engineering review and quality assessment.\",\n      \"additionalProperties\": true\n    },\n    \"report\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"markdown\": {\n          \"type\": \"string\",\n          \"description\": \"Markdown version of the engineering report.\"\n        },\n        \"checklist\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"description\": \"Final implementation checklist.\"\n        }\n      },\n      \"description\": \"Final report representation.\",\n      \"additionalProperties\": true\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/issue-pilot-planning-flow_instructor-llmnode-738_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/issue-pilot-planning-flow_instructor-llmnode-738_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Engineering Review",
        "attachments": "",
        "generativeModelName": "@model-configs/issue-pilot-planning-flow_instructor-llmnode-738_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_454",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"markdown\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"checklist\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/issue-pilot-planning-flow_instructor-llmnode-454_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/issue-pilot-planning-flow_instructor-llmnode-454_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Markdown Formatter",
        "attachments": "",
        "generativeModelName": "@model-configs/issue-pilot-planning-flow_instructor-llmnode-454_generative-model-name.ts"
      }
    }
  },
  {
    "id": "endNode_650",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "endNode",
      "values": {
        "nodeName": "End"
      }
    }
  },
  {
    "id": "plus-node-addNode_766540",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_252-964",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_252",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_454-endNode_650-833",
    "source": "InstructorLLMNode_454",
    "target": "endNode_650",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "endNode_650-plus-node-addNode_766540-936",
    "source": "endNode_650",
    "target": "plus-node-addNode_766540",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_252-InstructorLLMNode_738",
    "source": "InstructorLLMNode_252",
    "target": "InstructorLLMNode_738",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_738-InstructorLLMNode_454",
    "source": "InstructorLLMNode_738",
    "target": "InstructorLLMNode_454",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
