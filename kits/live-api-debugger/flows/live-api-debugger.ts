export const meta = {
  "name": "Live API Debugger",
  "description": "Advanced API Error Troubleshooter. Scrapes live docs to fix failing code.",
  "tags": ["developer-tools", "debugging"],
  "testInput": null,
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/live-api-debugger",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Lamatic Intern Candidate",
    "email": "candidate@example.com"
  }
};

export const inputs = {};

export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "live_api_debugger_generate_text_user": "@prompts/live-api-debugger_generate-text_user.md",
    "live_api_debugger_generate_text_system": "@prompts/live-api-debugger_generate-text_system.md"
  },
  "modelConfigs": {
    "live_api_debugger_generate_text": "@model-configs/live-api-debugger_generate-text.ts"
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
        "advance_schema": "{\"error_message\":\"string\",\"failing_code\":\"string\",\"api_docs_url\":\"string\"}"
      }
    }
  },
  {
    "id": "scraperNode_2",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "scraperNode",
      "values": {
        "nodeName": "Scraper",
        "url": "{{triggerNode_1.output.api_docs_url}}",
        "mobile": false,
        "waitFor": 2000,
        "credentials": null,
        "excludeTags": [],
        "includeTags": [],
        "onlyMainContent": true,
        "skipTLsVerification": false
      }
    }
  },
  {
    "id": "LLMNode_3",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "user-prompt",
            "role": "user",
            "content": "@prompts/live-api-debugger_generate-text_user.md"
          },
          {
            "id": "system-prompt",
            "role": "system",
            "content": "@prompts/live-api-debugger_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/live-api-debugger_generate-text.ts",
        "messages": "@model-configs/live-api-debugger_generate-text.ts",
        "generativeModelName": "@model-configs/live-api-debugger_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_4",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"fix\": \"{{LLMNode_3.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-scraperNode_2",
    "source": "triggerNode_1",
    "target": "scraperNode_2",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "scraperNode_2-LLMNode_3",
    "source": "scraperNode_2",
    "target": "LLMNode_3",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_3-graphqlResponseNode_4",
    "source": "LLMNode_3",
    "target": "graphqlResponseNode_4",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_4",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_4",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
