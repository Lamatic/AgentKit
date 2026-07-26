// Flow: learning-path-replanner

// -- Meta --
export const meta = {
  "name": "learning-path-replanner",
  "description": "Diagnose learning gaps and generate an adaptive catch-up plan with micro-lessons and checkpoint quizzes.",
  "tags": ["education", "study-planning", "learning", "quiz", "productivity", "coaching"],
  "testInput": {
    "studentAlias": "Student A",
    "learningGoal": "Score above 85% in Class 10 Mathematics board exam",
    "subject": "Mathematics",
    "syllabusTopics": "Linear equations, quadratic equations, arithmetic progression, triangles, coordinate geometry, trigonometry, statistics, probability",
    "completedTopics": "Linear equations, arithmetic progression, statistics",
    "weakTopics": "Quadratic equations, trigonometry, triangles",
    "missedStudySessions": "Missed 4 study sessions in the last 2 weeks due to school assignments",
    "recentQuizPerformance": "Scored 42%. Most mistakes were in applying formulas, sign errors in quadratic equations, and confusing trigonometric ratios.",
    "availableDays": "10 days",
    "dailyStudyTime": "90 minutes per day",
    "preferredLearningStyle": "Step-by-step examples followed by practice questions"
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/learning-path-replanner",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/learning-path-replanner",
  "author": {
    "name": "Yash Gupta",
    "email": "yggupta9414@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_333": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_593": [
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
    "learning_path_replanner_llmnode_333_system_0": "@prompts/learning-path-replanner_llmnode-333_system_0.md",
    "learning_path_replanner_llmnode_333_user_1": "@prompts/learning-path-replanner_llmnode-333_user_1.md",
    "learning_path_replanner_llmnode_593_system_0": "@prompts/learning-path-replanner_llmnode-593_system_0.md",
    "learning_path_replanner_llmnode_593_user_1": "@prompts/learning-path-replanner_llmnode-593_user_1.md"
  },
  "modelConfigs": {
    "learning_path_replanner_llmnode_333_generative_model_name": "@model-configs/learning-path-replanner_llmnode-333_generative-model-name.ts",
    "learning_path_replanner_llmnode_593_generative_model_name": "@model-configs/learning-path-replanner_llmnode-593_generative-model-name.ts"
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
        "advance_schema": "{\n  \"studentAlias\": \"string\",\n  \"learningGoal\": \"string\",\n  \"subject\": \"string\",\n  \"syllabusTopics\": \"string\",\n  \"completedTopics\": \"string\",\n  \"weakTopics\": \"string\",\n  \"missedStudySessions\": \"string\",\n  \"recentQuizPerformance\": \"string\",\n  \"availableDays\": \"string\",\n  \"dailyStudyTime\": \"string\",\n  \"preferredLearningStyle\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_333",
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
            "content": "@prompts/learning-path-replanner_llmnode-333_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/learning-path-replanner_llmnode-333_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Diagnose Learning Gaps",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/learning-path-replanner_llmnode-333_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_593",
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
            "content": "@prompts/learning-path-replanner_llmnode-593_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/learning-path-replanner_llmnode-593_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Recovery Plan",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/learning-path-replanner_llmnode-593_generative-model-name.ts"
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
        "outputMapping": "{\n  \"learningDiagnosis\": \"{{LLMNode_333.output.generatedResponse}}\",\n  \"adaptiveRecoveryPlan\": \"{{LLMNode_593.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_333",
    "source": "triggerNode_1",
    "target": "LLMNode_333",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_333-LLMNode_593",
    "source": "LLMNode_333",
    "target": "LLMNode_593",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_593-responseNode_triggerNode_1",
    "source": "LLMNode_593",
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
