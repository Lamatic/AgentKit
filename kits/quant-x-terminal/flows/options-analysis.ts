// Triggering validation rerun
export const flowConfig = {
  id: "6d880d52-5571-4d64-9988-eb43391ee738",
  name: "options-strategy-generator",
  meta: {
    version: "1.0.0"
  },
  inputs: {
    message: {
      type: "string",
      required: true
    }
  },
  references: {},
  nodes: [
    {
      id: "llm-generation",
      type: "llm",
      name: "LLM Generation",
      params: {
        prompt: "Analyze the provided stock market outlook and generate a standard options strategy risk profile.",
        provider: "groq", 
        model: "llama-3.1-8b-instant",
        temperature: 0.7
      }
    }
  ],
  edges: [],
  response: {
    strategy: "{{nodes.llm-generation.output}}"
  }
};