// Triggering validation rerun
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
      name: "LLM Generation",
      args: {
        prompt: "Analyze the provided stock market outlook and generate a standard options strategy risk profile.",
        provider: "groq", 
        model: "llama3-8b-8192", 
        temperature: 0.7
      }
    }
  ],
  response: {
    strategy: "{{nodes.llm-generation.output}}"
  }
};