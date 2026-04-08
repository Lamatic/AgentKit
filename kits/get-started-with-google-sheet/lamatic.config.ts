export default {
  name: "Get Started with Google Sheet",
  description: "This flow introduces the Google Sheets trigger node and a RAG node which helps users ask questions and perform analysis on a Google Sheet. The flow guides users through the process of connecting to Google Sheets and leveraging the RAG node for interactive data exploration.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["apps","startup","database"],
  steps: [
    { id: "get-started-with-google-sheet", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/get-started-with-google-sheet",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/get-started-with-google-sheet"
},
};
