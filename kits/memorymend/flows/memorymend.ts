// Flow: memorymend

export const meta = {
  name: "memorymend",
  description: "Evidence-backed integrity auditing and controlled repair planning for long-lived AI agent memory.",
  tags: ["agentic", "memory", "security", "provenance", "reliability"],
  testInput: {
    memories: [],
    new_evidence: [],
    policy: {
      stale_after_days: 180,
      require_human_review_for_quarantine: true,
      minimum_confidence_for_auto_merge: 0.85,
    },
  },
  githubUrl: "https://github.com/Darshangowdac2005/AgentKit/tree/feat/memorymend-agent-memory-integrity/kits/memorymend",
  documentationUrl: "https://github.com/Darshangowdac2005/AgentKit/tree/feat/memorymend-agent-memory-integrity/kits/memorymend",
  deployUrl: "",
  author: { name: "Darshan Gowda C", email: "darshangowdac2005@gmail.com" },
};

export const inputs = {
  triggerNode_1: [
    { name: "memories", label: "Agent Memories", type: "json" },
    { name: "new_evidence", label: "New Evidence", type: "json" },
    { name: "policy", label: "Integrity Policy", type: "json" },
  ],
};

export const references = {
  constitutions: { default: "@constitutions/default.md" },
  prompts: { integrityAnalyzer: "@prompts/integrity-analyzer.md" },
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
        id: "triggerNode_1",
        nodeName: "Memory Integrity Request",
        responeType: "realtime",
        advance_schema: "{\n  \"memories\": \"array\",\n  \"new_evidence\": \"array\",\n  \"policy\": \"object\"\n}",
      },
    },
  },
  {
    id: "normalizeNode_1",
    type: "dynamicNode",
    position: { x: 250, y: 0 },
    data: {
      nodeId: "codeNode",
      values: { id: "normalizeNode_1", nodeName: "Normalize Memory", operation: "normalize-and-classify" },
    },
  },
  {
    id: "provenanceNode_1",
    type: "dynamicNode",
    position: { x: 500, y: 0 },
    data: {
      nodeId: "codeNode",
      values: { id: "provenanceNode_1", nodeName: "Analyze Provenance", operation: "source-authority-analysis" },
    },
  },
  {
    id: "relationshipNode_1",
    type: "dynamicNode",
    position: { x: 750, y: 0 },
    data: {
      nodeId: "codeNode",
      values: { id: "relationshipNode_1", nodeName: "Analyze Relationships", operation: "duplicate-contradiction-evidence-analysis" },
    },
  },
  {
    id: "riskNode_1",
    type: "dynamicNode",
    position: { x: 1000, y: 0 },
    data: {
      nodeId: "codeNode",
      values: { id: "riskNode_1", nodeName: "Judge Trust and Risk", operation: "risk-and-confidence-analysis" },
    },
  },
  {
    id: "repairNode_1",
    type: "dynamicNode",
    position: { x: 1250, y: 0 },
    data: {
      nodeId: "codeNode",
      values: { id: "repairNode_1", nodeName: "Plan Controlled Repair", operation: "repair-planning" },
    },
  },
  {
    id: "safetyNode_1",
    type: "dynamicNode",
    position: { x: 1500, y: 0 },
    data: {
      nodeId: "codeNode",
      values: { id: "safetyNode_1", nodeName: "Apply Safety Gate", operation: "human-review-and-quarantine-gate" },
    },
  },
  {
    id: "endNode_1",
    type: "dynamicNode",
    position: { x: 1750, y: 0 },
    data: { nodeId: "endNode", values: { id: "endNode_1", nodeName: "Return Integrity Report" } },
  },
  {
    id: "responseNode_triggerNode_1",
    type: "responseNode",
    position: { x: 2000, y: 0 },
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        id: "responseNode_triggerNode_1",
        headers: "{\"content-type\":\"application/json\"}",
        retries: "0",
        nodeName: "API Response",
        webhookUrl: "",
        retry_delay: "0",
        outputMapping: "{\n  \"report\": \"{{endNode_1.output}}\"\n}",
      },
    },
  },
];

export const edges = [
  ["triggerNode_1", "normalizeNode_1"],
  ["normalizeNode_1", "provenanceNode_1"],
  ["provenanceNode_1", "relationshipNode_1"],
  ["relationshipNode_1", "riskNode_1"],
  ["riskNode_1", "repairNode_1"],
  ["repairNode_1", "safetyNode_1"],
  ["safetyNode_1", "endNode_1"],
  ["endNode_1", "responseNode_triggerNode_1"],
].map(([source, target]) => ({
  id: `${source}-${target}`,
  source,
  target,
  sourceHandle: "bottom",
  targetHandle: "top",
  type: "defaultEdge",
}));

export default { meta, inputs, references, nodes, edges };
