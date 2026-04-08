export default {
  name: "Candidate Screener",
  description: "This AI-powered GitHub profile screening system automatically analyzes candidates' repositories, matches their experience and skills to job requirements, and generates personalized email responses - congratulating qualified candidates or providing feedback to those who don't meet the criteria.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup"],
  steps: [
    { id: "candidate-screener", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/candidate-screener",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/candidate-screener"
},
};
