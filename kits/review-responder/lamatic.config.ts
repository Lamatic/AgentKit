export default {
  name: "Review Responder",
  description: "This AI-powered review analysis and response system automatically classifies customer reviews, analyzes sentiment, and generates personalized email responses tailored to your needs.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup","support"],
  steps: [
    { id: "review-responder", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/review-responder",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/review-responder"
},
};
