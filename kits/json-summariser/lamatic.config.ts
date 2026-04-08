export default {
  name: "JSON Summariser",
  description: "This workflow builds a JSON summarization system. It takes a URL of a JSON file as input, processes the data using a Generate Text node, and produces a concise summary of the key information, enabling efficient data analysis and easier extraction of insights from complex JSON structures.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["support","growth"],
  steps: [
    { id: "json-summariser", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/json-summariser",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/json-summariser"
},
};
