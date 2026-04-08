export default {
  name: "Document Parsing",
  description: "Extract valuable insights from documents and unstructured information at scale.",
  version: '1.0.0',
  type: 'bundle' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["document","generative"],
  steps: [
    {
        "id": "document-parsing-etl",
        "type": "mandatory"
    },
    {
        "id": "chatbot-widget",
        "type": "mandatory",
        "prerequisiteSteps": [
            "data-source"
        ]
    }
],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/document-parsing"
},
};
