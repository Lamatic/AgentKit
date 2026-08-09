// Flow: changelog-release-notes-agent

// -- Meta --
export const meta = {
  "name": "changelog-release-notes-agent",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "aubaid",
    "email": "aubaid.code@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_395": [
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
    "changelog_release_notes_agent_llmnode_395_system_0": "@prompts/changelog-release-notes-agent_llmnode-395_system_0.md",
    "changelog_release_notes_agent_llmnode_395_user_1": "@prompts/changelog-release-notes-agent_llmnode-395_user_1.md"
  },
  "modelConfigs": {
    "changelog_release_notes_agent_llmnode_395_generative_model_name": "@model-configs/changelog-release-notes-agent_llmnode-395_generative-model-name.ts"
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
        "advance_schema": "{\n  \"owner\": \"string\",\n  \"repo\": \"string\"\n}"
      }
    }
  },
  {
    "id": "apiNode_326",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_326",
        "url": "https://api.github.com/repos/{{triggerNode_1.output.owner}}/{{triggerNode_1.output.repo}}/pulls?state=closed&sort=updated&direction=desc&per_page=25",
        "body": "",
        "method": "GET",
        "headers": "{\"Accept\":\"application/vnd.github+json\"}",
        "retries": "0",
        "nodeName": "API",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "LLMNode_395",
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
            "content": "@prompts/changelog-release-notes-agent_llmnode-395_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/changelog-release-notes-agent_llmnode-395_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/changelog-release-notes-agent_llmnode-395_generative-model-name.ts"
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
        "outputMapping": "{\n  \"releaseNotes\": \"{{LLMNode_395.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-apiNode_326",
    "source": "triggerNode_1",
    "target": "apiNode_326",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_326-LLMNode_395",
    "source": "apiNode_326",
    "target": "LLMNode_395",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_395-responseNode_triggerNode_1",
    "source": "LLMNode_395",
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
