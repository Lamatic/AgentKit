export const meta = {
  "name": "Notes to Action Items",
  "description": "Extracts action items from meeting notes.",
  "tags": ["generative", "productivity"],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Contributor",
    "email": "contributor@example.com"
  }
};

export const inputs = {};

export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "generate_text_user": "@prompts/notes-to-action-items_generate-text_user.md",
    "generate_text_system": "@prompts/notes-to-action-items_generate-text_system.md"
  },
  "modelConfigs": {
    "generate_text": "@model-configs/notes-to-action-items_generate-text.ts"
  }
};

export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "LLMNode_2",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "user_prompt",
            "role": "user",
            "content": "@prompts/notes-to-action-items_generate-text_user.md"
          },
          {
            "id": "system_prompt",
            "role": "system",
            "content": "@prompts/notes-to-action-items_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/notes-to-action-items_generate-text.ts",
        "messages": "@model-configs/notes-to-action-items_generate-text.ts",
        "generativeModelName": "@model-configs/notes-to-action-items_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_3",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"action_items\": \"{{LLMNode_2.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_2",
    "source": "triggerNode_1",
    "target": "LLMNode_2",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_2-graphqlResponseNode_3",
    "source": "LLMNode_2",
    "target": "graphqlResponseNode_3",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_3",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_3",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
