export const flowConfig = {
  id: "6d880d52-5571-4d64-9988-eb43391ee738",
  name: "options-strategy-generator",
  trigger: {
    type: "webhook",
    schema: {
      message: "string"
    }
  },
  nodes: [
    {
      id: "llm-generation",
      type: "llm",
      prompt: "Analyze the provided stock market outlook and generate a standard options strategy risk profile.",
      model: "gpt-4o"
    }
  ],
  response: {
    strategy: "{{nodes.llm-generation.output}}"
  }
};