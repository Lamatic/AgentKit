/**
 * Primary debugging workflow configuration for DebugPilot AI.
 */
export function getDebugPilotFlow() {
  return {
    meta: {
      id: "debugpilot-flow",
      name: "DebugPilot Root Cause Analysis Flow"
    },
    inputs: [],
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
        values: {},
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
