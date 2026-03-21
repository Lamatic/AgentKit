export const config = {
  flows: {
    "agentic-thinking-simulator": {
      name: "AI Thinking Simulator",
      workflowId: process.env.AGENTIC_THINKING_SIMULATOR_FLOW_ID,
      description: "Generates multiple cognitive perspectives on any decision and synthesizes a final recommendation",
      inputSchema: {
        question: "string",
      },
      outputSchema: {
        perspectives: "Array<{ role, emoji, opinion, reasoning, concerns }>",
        final_synthesis: "string",
        confidence: "number",
        recommended_action: "string",
      },
    },
  },
}
