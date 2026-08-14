export const demoFlowExport = `// Flow: commerce-support-agent

export const meta = {
  "name": "Commerce Support Agent",
  "description": "Synthetic flow used by the TraceShift proof set"
};

export const inputs = {};
export const references = {};

export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": { "nodeId": "graphqlNode", "values": { "nodeName": "API Request" } }
  },
  {
    "id": "LLMNode_router",
    "type": "dynamicNode",
    "position": { "x": 220, "y": 0 },
    "data": { "nodeId": "LLMNode", "values": { "nodeName": "Intent Router" } }
  },
  {
    "id": "toolNode_catalog",
    "type": "dynamicNode",
    "position": { "x": 440, "y": -90 },
    "data": { "nodeId": "ToolNode", "values": { "nodeName": "Catalog Lookup" } }
  },
  {
    "id": "codeNode_policy",
    "type": "dynamicNode",
    "position": { "x": 440, "y": 90 },
    "data": { "nodeId": "codeNode", "values": { "nodeName": "Policy Check" } }
  },
  {
    "id": "LLMNode_draft",
    "type": "dynamicNode",
    "position": { "x": 660, "y": 0 },
    "data": { "nodeId": "LLMNode", "values": { "nodeName": "Draft Answer" } }
  },
  {
    "id": "responseNode_1",
    "type": "responseNode",
    "position": { "x": 880, "y": 0 },
    "data": { "nodeId": "graphqlResponseNode", "values": { "nodeName": "API Response" } }
  }
];

export const edges = [
  { "id": "request-router", "source": "triggerNode_1", "target": "LLMNode_router", "type": "defaultEdge" },
  { "id": "router-catalog", "source": "LLMNode_router", "target": "toolNode_catalog", "type": "defaultEdge" },
  { "id": "router-policy", "source": "LLMNode_router", "target": "codeNode_policy", "type": "defaultEdge" },
  { "id": "catalog-draft", "source": "toolNode_catalog", "target": "LLMNode_draft", "type": "defaultEdge" },
  { "id": "policy-draft", "source": "codeNode_policy", "target": "LLMNode_draft", "type": "defaultEdge" },
  { "id": "draft-response", "source": "LLMNode_draft", "target": "responseNode_1", "type": "defaultEdge" },
  { "id": "request-response", "source": "triggerNode_1", "target": "responseNode_1", "type": "responseEdge" }
];

export default { meta, inputs, references, nodes, edges };
`;
