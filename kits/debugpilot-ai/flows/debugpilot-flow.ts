/**
 * Primary debugging workflow configuration for DebugPilot AI.
 */
export function getDebugPilotFlow(): Record<string, any> {
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
      output: "debugLLMNode"
    },

    nodes: [
      {
        nodeId: "triggerNode",
        nodeType: "graphqlNode",
        nodeName: "Debug Trigger",
        values: {
          responseType: "realtime",
          schema: {
            type: "object",
            properties: {
              error: {
                type: "string"
              }
            },
            required: ["error"]
          }
        },
        needs: []
      },

      {
        nodeId: "debugLLMNode",
        nodeType: "llmNode",
        nodeName: "Debug Analysis",
        values: {
          model: "gpt-4",
          temperature: 0.3,
          topP: 0.9,
          maxTokens: 1200,
          prompt:
            "Analyze the provided debugging issue and produce: Summary, Root Cause Analysis, Debugging Steps, Recommended Fixes, Reliability Risks, and Prevention Strategy."
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