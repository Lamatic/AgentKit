export default {
  name: "Armchair Tactician",
  description: "This workflow acts as an overly passionate and dramatic football pundit. It takes a match result and key events, and generates an elaborate, highly tactical post-match analysis.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Football Fanatic","email":"tactics@lamatic.ai"},
  tags: ["generative", "sports", "entertainment"],
  steps: [
    { id: "armchair-tactician", type: 'mandatory' as const }
  ],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/armchair-tactician"
  }
};
