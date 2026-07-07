export default {
  name: "Notes to Action Items",
  description: "This workflow takes messy meeting notes and extracts clean, organized action items using an LLM.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Contributor","email":"contributor@example.com"},
  tags: ["generative","productivity"],
  steps: [
    { id: "notes-to-action-items", type: 'mandatory' as const }
  ],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/notes-to-action-items"
  },
};
