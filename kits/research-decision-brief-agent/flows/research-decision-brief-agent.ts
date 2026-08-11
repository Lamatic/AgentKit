/*
 * Flow: research-decision-brief-agent
 * Purpose: Turn research evidence into an actionable decision brief.
 */

export const meta = {
  name: "Research Decision Brief Agent",
  description:
    "Converts research-paper evidence into actionable decision briefs with options, tradeoffs, risks, and confidence.",
  tags: ["research", "decision", "analysis"],
  testInput: null,
  githubUrl: "",
  documentationUrl: "",
  deployUrl: "",
  author: {
    name: "Umar",
    email: "umar.workit@gmail.com"
  }
};

export const inputs = {};

export const references = {
  constitutions: {
    default: "@constitutions/default.md"
  },
  prompts: {
    research_decision_brief_agent_assess_evidence_system:
      "@prompts/research-decision-brief-agent_assess-evidence_system.md",
    research_decision_brief_agent_assess_evidence_user:
      "@prompts/research-decision-brief-agent_assess-evidence_user.md"
  },
  modelConfigs: {
    research_decision_brief_agent_assess_evidence:
      "@model-configs/research-decision-brief-agent_assess-evidence.ts"
  }
};

export const nodes = [
  {
    id: "triggerNode_1",
    type: "triggerNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "graphqlNode",
      trigger: true,
      values: {
        nodeName: "API Request",
        responeType: "realtime",
        advance_schema:
          "{\n  \"objective\": \"string\",\n  \"constraints\": \"string\",\n  \"timeline\": \"string\",\n  \"audience\": \"string\",\n  \"evidence\": \"string\"\n}"
      }
    }
  },
  {
    id: "LLMNode_101",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "LLMNode",
      values: {
        nodeName: "Assess Evidence",
        tools: [],
        prompts: [
          {
            id: "b11be76a-6ad6-4f40-9c1a-11c822615f87",
            role: "system",
            content: "@prompts/research-decision-brief-agent_assess-evidence_system.md"
          },
          {
            id: "d5636147-bf3b-4328-94f1-5f013b61a0b4",
            role: "user",
            content: "@prompts/research-decision-brief-agent_assess-evidence_user.md"
          }
        ],
        memories: "[]",
        messages: "[]",
        generativeModelName:
          "@model-configs/research-decision-brief-agent_assess-evidence.ts"
      }
    }
  },
  {
    id: "graphqlResponseNode_201",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        nodeName: "API Response",
        outputMapping:
          "{\n  \"decision_brief\": \"{{LLMNode_101.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    id: "triggerNode_1-LLMNode_101",
    source: "triggerNode_1",
    target: "LLMNode_101",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "LLMNode_101-graphqlResponseNode_201",
    source: "LLMNode_101",
    target: "graphqlResponseNode_201",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "response-graphqlResponseNode_201",
    source: "triggerNode_1",
    target: "graphqlResponseNode_201",
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
    type: "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
