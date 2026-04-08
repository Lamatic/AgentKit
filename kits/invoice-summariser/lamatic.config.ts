export default {
  name: "Invoice Summariser",
  description: "This AI-powered invoice summarization workflow processes invoices, extracts key details like total amounts, due dates, and vendor information, and generates structured JSON output.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["support"],
  steps: [
    { id: "invoice-summariser", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/invoice-summariser",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/invoice-summariser"
},
};
