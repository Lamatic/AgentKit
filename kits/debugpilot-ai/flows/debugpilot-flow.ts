/**

* Primary debugging workflow configuration for DebugPilot AI.
  */
  export function getDebugPilotFlow() {
  return {
  meta: {
  id: "debugpilot-flow",
  name: "DebugPilot Root Cause Analysis Flow",
  description: "Minimal debugging workflow scaffold for DebugPilot AI.",
  version: "1.0.0"
  },

  inputs: {
  error: {
  type: "string",
  required: true
  }
  },

  references: {
  output: "debug-analysis"
  },

  nodes: [
  {
  nodeId: "triggerNode",
  nodeType: "graphqlNode",
  nodeName: "Debug Trigger",
  values: {},
  needs: []
  },
  {
  nodeId: "debugLLMNode",
  nodeType: "LLMNode",
  nodeName: "Debug Analysis",
  values: {
  prompt: "Analyze the provided debugging issue."
  },
  needs: ["triggerNode"]
  }
  ],

  edges: [
  {
  source: "triggerNode",
  target: "debugLLMNode"
  }
  ]
  };
  }
