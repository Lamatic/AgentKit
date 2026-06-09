// Flow: research-to-project-planner

// -- Meta --
export const meta = {
  "name": "research-to-project-planner",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Arush John",
    "email": "arushjohn22@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_606": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_842": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_728": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_959": [
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
    "research_to_project_planner_instructor_llmnode_606_system_0": "@prompts/research-to-project-planner_instructor-llmnode-606_system_0.md",
    "research_to_project_planner_instructor_llmnode_606_user_1": "@prompts/research-to-project-planner_instructor-llmnode-606_user_1.md",
    "research_to_project_planner_instructor_llmnode_842_system_0": "@prompts/research-to-project-planner_instructor-llmnode-842_system_0.md",
    "research_to_project_planner_instructor_llmnode_842_user_1": "@prompts/research-to-project-planner_instructor-llmnode-842_user_1.md",
    "research_to_project_planner_instructor_llmnode_728_system_0": "@prompts/research-to-project-planner_instructor-llmnode-728_system_0.md",
    "research_to_project_planner_instructor_llmnode_728_user_1": "@prompts/research-to-project-planner_instructor-llmnode-728_user_1.md",
    "research_to_project_planner_llmnode_959_system_0": "@prompts/research-to-project-planner_llmnode-959_system_0.md",
    "research_to_project_planner_llmnode_959_user_1": "@prompts/research-to-project-planner_llmnode-959_user_1.md"
  },
  "modelConfigs": {
    "research_to_project_planner_instructor_llmnode_606_generative_model_name": "@model-configs/research-to-project-planner_instructor-llmnode-606_generative-model-name.ts",
    "research_to_project_planner_instructor_llmnode_842_generative_model_name": "@model-configs/research-to-project-planner_instructor-llmnode-842_generative-model-name.ts",
    "research_to_project_planner_instructor_llmnode_728_generative_model_name": "@model-configs/research-to-project-planner_instructor-llmnode-728_generative-model-name.ts",
    "research_to_project_planner_llmnode_959_generative_model_name": "@model-configs/research-to-project-planner_llmnode-959_generative-model-name.ts"
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
      "nodeId": "chatTriggerNode",
      "trigger": true,
      "values": {
        "chat": "",
        "domains": [
          "*"
        ],
        "nodeName": "Chat Widget",
        "chatConfig": {
          "botName": "Lamatic Bot",
          "imageUrl": "https://img.freepik.com/premium-vector/robot-android-super-hero_111928-7.jpg?w=826",
          "position": "right",
          "policyUrl": "https://lamatic.ai/docs/legal/privacy-policy",
          "displayMode": "popup",
          "placeholder": "Compose your message",
          "suggestions": [
            "What is lamatic?",
            "How do I add data to my chatbot?",
            "Explain this product to me"
          ],
          "errorMessage": "Oops! Something went wrong. Please try again.",
          "hideBranding": false,
          "primaryColor": "#ef4444",
          "headerBgColor": "#000000",
          "greetingMessage": "Hi, I am Lamatic Bot. Ask me anything about Lamatic",
          "headerTextColor": "#FFFFFF",
          "showEmojiButton": true,
          "suggestionBgColor": "#f1f5f9",
          "userMessageBgColor": "#FEF2F2",
          "agentMessageBgColor": "#f1f5f9",
          "suggestionTextColor": "#334155",
          "userMessageTextColor": "#d12323",
          "agentMessageTextColor": "#334155"
        }
      }
    }
  },
  {
    "id": "InstructorLLMNode_606",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"problem_statement\": {\n      \"type\": \"string\"\n    },\n    \"key_contributions\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"methodology\": {\n      \"type\": \"string\"\n    },\n    \"models_used\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"datasets_used\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"evaluation_metrics\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"main_findings\": {\n      \"type\": \"string\"\n    },\n    \"implementation_difficulty\": {\n      \"type\": \"string\"\n    },\n    \"estimated_project_duration\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/research-to-project-planner_instructor-llmnode-606_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/research-to-project-planner_instructor-llmnode-606_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Paper Analysis",
        "attachments": "",
        "generativeModelName": "@model-configs/research-to-project-planner_instructor-llmnode-606_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_842",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"project_title\": {\n      \"type\": \"string\"\n    },\n    \"difficulty_level\": {\n      \"type\": \"string\"\n    },\n    \"learning_prerequisites\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"tech_stack\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"implementation_steps\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"estimated_timeline\": {\n      \"type\": \"string\"\n    },\n    \"deployment_plan\": {\n      \"type\": \"string\"\n    },\n    \"resume_value\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/research-to-project-planner_instructor-llmnode-842_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/research-to-project-planner_instructor-llmnode-842_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Project Roadmap",
        "attachments": "",
        "generativeModelName": "@model-configs/research-to-project-planner_instructor-llmnode-842_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_728",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"modules\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"tasks\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"milestones\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"risks\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"deliverables\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/research-to-project-planner_instructor-llmnode-728_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/research-to-project-planner_instructor-llmnode-728_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Project Planner",
        "attachments": "",
        "generativeModelName": "@model-configs/research-to-project-planner_instructor-llmnode-728_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_959",
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
            "content": "@prompts/research-to-project-planner_llmnode-959_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/research-to-project-planner_llmnode-959_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Report Generator",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/research-to-project-planner_llmnode-959_generative-model-name.ts"
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
      "nodeId": "chatResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "content": "{{LLMNode_959.output.generatedResponse}}",
        "nodeName": "Chat Response",
        "references": "",
        "webhookUrl": "",
        "webhookHeaders": ""
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_606",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_606",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_606-InstructorLLMNode_842",
    "source": "InstructorLLMNode_606",
    "target": "InstructorLLMNode_842",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_842-InstructorLLMNode_728",
    "source": "InstructorLLMNode_842",
    "target": "InstructorLLMNode_728",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_728-LLMNode_959",
    "source": "InstructorLLMNode_728",
    "target": "LLMNode_959",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_959-responseNode_triggerNode_1",
    "source": "LLMNode_959",
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
