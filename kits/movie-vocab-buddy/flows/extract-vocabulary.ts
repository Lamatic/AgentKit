// Flow: extract-vocabulary

// -- Meta --
export const meta = {
  "name": "extract-vocabulary",
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
  "InstructorLLMNode_393": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "postgresNode_799": [
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
    "extract_vocabulary_instructor_llmnode_393_system_0": "@prompts/extract-vocabulary_instructor-llmnode-393_system_0.md",
    "extract_vocabulary_instructor_llmnode_393_user_1": "@prompts/extract-vocabulary_instructor-llmnode-393_user_1.md"
  },
  "modelConfigs": {
    "extract_vocabulary_instructor_llmnode_393_generative_model_name": "@model-configs/extract-vocabulary_instructor-llmnode-393_generative-model-name.ts"
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
        "advance_schema": "{\n  \"transcript_text\": \"string\",\n  \"source_title\": \"string\",\n  \"user_id\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_393",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"words_json\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/extract-vocabulary_instructor-llmnode-393_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/extract-vocabulary_instructor-llmnode-393_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/extract-vocabulary_instructor-llmnode-393_generative-model-name.ts"
      }
    }
  },
  {
    "id": "postgresNode_799",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "postgresNode",
      "values": {
        "id": "postgresNode_799",
        "query": "INSERT INTO word_batches (user_id, source_title, words_json) VALUES ($${{triggerNode_1.output.user_id}}$$, $${{triggerNode_1.output.source_title}}$$, $${{InstructorLLMNode_393.output.words_json}}$$::jsonb) RETURNING *;",
        "action": "runQuery",
        "nodeName": "Postgres",
        "credentials": "movie-vocab-buddy-db-pooled-v2"
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
        "outputMapping": "{\n  \"result\": \"{{InstructorLLMNode_393.output.words_json}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_393",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_393",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_393-postgresNode_799",
    "source": "InstructorLLMNode_393",
    "target": "postgresNode_799",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "postgresNode_799-responseNode_triggerNode_1",
    "source": "postgresNode_799",
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