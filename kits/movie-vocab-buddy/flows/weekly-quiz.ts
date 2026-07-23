// Flow: weekly-quiz

// -- Meta --
export const meta = {
  "name": "weekly-quiz",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "nanditha s",
    "email": "nandithasalim@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "postgresNode_140": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select"
    }
  ],
  "InstructorLLMNode_647": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "postgresNode_532": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "weekly_quiz_instructor_llmnode_647_system_0": "@prompts/weekly-quiz_instructor-llmnode-647_system_0.md",
    "weekly_quiz_instructor_llmnode_647_user_1": "@prompts/weekly-quiz_instructor-llmnode-647_user_1.md"
  },
  "modelConfigs": {
    "weekly_quiz_instructor_llmnode_647_generative_model_name": "@model-configs/weekly-quiz_instructor-llmnode-647_generative-model-name.ts"
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
      "nodeId": "cronNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "Cron",
        "cronTimezone": "UTC",
        "cronExpression": "0 0 * * 1"
      }
    }
  },
  {
    "id": "postgresNode_140",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "postgresNode",
      "values": {
        "id": "postgresNode_140",
        "query": "SELECT words_json FROM word_batches WHERE user_id = 'demo-user' ORDER BY date_added DESC LIMIT 5;",
        "action": "runQuery",
        "nodeName": "Postgres",
        "credentials": "movie-vocab-buddy-db-pooled"
      }
    }
  },
  {
    "id": "InstructorLLMNode_647",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"quiz_json\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/weekly-quiz_instructor-llmnode-647_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/weekly-quiz_instructor-llmnode-647_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/weekly-quiz_instructor-llmnode-647_generative-model-name.ts"
      }
    }
  },
  {
    "id": "postgresNode_532",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "postgresNode",
      "values": {
        "id": "postgresNode_532",
        "query": "INSERT INTO weekly_quizzes (user_id, quiz_json) VALUES ('demo-user', $${{InstructorLLMNode_647.output.quiz_json}}$$::jsonb) RETURNING *;",
        "action": "runQuery",
        "nodeName": "Postgres",
        "credentials": "movie-vocab-buddy-db-pooled"
      }
    }
  },
  {
    "id": "plus-node-addNode_101234",
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
    "id": "triggerNode_1-postgresNode_140",
    "source": "triggerNode_1",
    "target": "postgresNode_140",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "postgresNode_140-InstructorLLMNode_647",
    "source": "postgresNode_140",
    "target": "InstructorLLMNode_647",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_647-postgresNode_532-126",
    "source": "InstructorLLMNode_647",
    "target": "postgresNode_532",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "postgresNode_532-plus-node-addNode_101234-988",
    "source": "postgresNode_532",
    "target": "plus-node-addNode_101234",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };