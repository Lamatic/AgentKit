export const meta = {
  "name": "YouTube Creator Copilot",
  "description": "Generate viral video ideas, scripts, and thumbnails.",
  "tags": [],
  "testInput": {
    "niche": "Personal Finance",
    "audience": "College Students"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

export const inputs = {};

export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "agentic_youtube_creator_llm_node_system": "@prompts/agentic-youtube-creator_llm-node_system.md"
  }
};

export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "nodeId": "graphqlNode",
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    }
  },
  {
    "id": "LLMNode_1",
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "prompts": [
          {
            "role": "system",
            "content": "@prompts/agentic-youtube-creator_llm-node_system.md"
          },
          {
            "role": "user",
            "content": "My niche is {{triggerNode_1.output.niche}} and my target audience is {{triggerNode_1.output.audience}}. Please generate 3 video ideas with hooks, script outlines, and thumbnail concepts."
          }
        ],
        "nodeName": "Generate Ideas"
      }
    },
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 150
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_1",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  }
];

export default { meta, inputs, references, nodes, edges };
