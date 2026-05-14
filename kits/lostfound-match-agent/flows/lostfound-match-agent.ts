/*
# LostFound Match Agent

This flow compares a lost item report with a found item report and returns a structured match recommendation.

It is designed for campuses, airports, metro stations, malls, hotels, and other public places where lost and found reports are handled manually.
*/

export const meta = {
  name: "LostFound Match Agent",
  description:
    "Compares lost and found item reports and returns a match score, reasoning, verification questions, and next action.",
  tags: ["lost-and-found", "matching", "automation", "json"],
  testInput: {
    lost_item_description:
      "Black leather wallet lost near library. It had my student ID card and some cash.",
    found_item_description:
      "Dark wallet found near reading room with a college ID card inside.",
    lost_location: "Library",
    found_location: "Reading room",
    lost_date: "2026-05-10",
    found_date: "2026-05-10",
  },
  githubUrl:
    "https://github.com/Rewant05/AgentKit/tree/lostfound-match-agent/kits/lostfound-match-agent",
  documentationUrl:
    "https://github.com/Rewant05/AgentKit/tree/lostfound-match-agent/kits/lostfound-match-agent/README.md",
  deployUrl: "",
  author: {
    name: "Rewant Anand",
    email: "rewu.anand@gmail.com",
  },
};

export const inputs = {};

export const references = {
  prompts: {
    lostfound_match_agent_system:
      "@prompts/lostfound-match-agent_system.md",
  },
};

export const nodes = [
  {
    id: "triggerNode_1",
    type: "triggerNode",
    position: {
      x: 0,
      y: 0,
    },
    data: {
      nodeId: "graphqlNode",
      trigger: true,
      values: {
        nodeName: "API Request",
        responeType: "realtime",
        advance_schema: "",
      },
    },
  },
  {
    id: "LLMNode_1",
    type: "dynamicNode",
    position: {
      x: 0,
      y: 0,
    },
    data: {
      nodeId: "LLMNode",
      values: {
        nodeName: "Generate Match Decision",
        tools: [],
        prompts: [
          {
            id: "lostfound-match-agent-system-prompt",
            role: "system",
            content: "@prompts/lostfound-match-agent_system.md",
          },
        ],
      },
    },
  },
  {
    id: "graphqlResponseNode_1",
    type: "dynamicNode",
    position: {
      x: 0,
      y: 0,
    },
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        nodeName: "API Response",
        outputMapping:
          '{\n  "output": "{{LLMNode_1.output.generatedResponse}}"\n}',
      },
    },
  },
];

export const edges = [
  {
    id: "triggerNode_1-LLMNode_1",
    source: "triggerNode_1",
    target: "LLMNode_1",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "LLMNode_1-graphqlResponseNode_1",
    source: "LLMNode_1",
    target: "graphqlResponseNode_1",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "response-graphqlResponseNode_1",
    source: "triggerNode_1",
    target: "graphqlResponseNode_1",
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
    type: "responseEdge",
  },
];

export default {
  meta,
  inputs,
  references,
  nodes,
  edges,
};
