export const flow = {
  id: "infrastructure-risk-analyzer",
  name: "Infrastructure Risk Analyzer",
  description: "Analyzes project proposals for municipal risk factors.",
  trigger: {
    type: "webhook",
    schema: {
      project_description: "string",
      location: "string"
    }
  },
  nodes: [
    {
      id: "web_search_node",
      type: "tool",
      name: "Web Search",
      config: {
        query: "infrastructure issues and local disruptions in {location}"
      }
    },
    {
      id: "llm_analysis_node",
      type: "llm",
      name: "Risk Analyzer Core",
      config: {
        model: "llama-3.3-70b",
        prompt_reference: "kits/infrastructure-risk-analyzer/prompts/..."
      }
    }
  ],
  output: {
    status: "string",
    result: "object"
  }
};
  
