export default {
  name: "Fashion Outfit Analyzer",
  description: "This AI-powered fashion analyzer processes user-provided outfit images, analyzes color combinations, style matching, and overall look, providing structured feedback and improvement suggestions.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Rutvija Mali","email":"rutvijamali@gmail.com"},
  tags: ["generative", "image", "fashion"],
  steps: [
    { id: "fashion-outfit-analyzer", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/fashion-outfit-analyzer",
    "github": "https://github.com/rutvija-mali/AgentKit/tree/main/kits/fashion-outfit-analyzer"
  },
};
