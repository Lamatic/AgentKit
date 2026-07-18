export default {
  name: "GMapReviewAI",
  description: "GMapReviewAI is an AI-powered reputation copilot that analyzes Google Maps reviews, benchmarks competitors, and generates actionable business insights.",
  version: "1.0.0",
  type: 'kit' as const,
  author: {
    "name": "chandravijay Rai",
    "email": "chandravijayk42187@gmail.com"
  },
  tags: ["research", "agentic", "growth", "local-business", "reputation-management"],
  steps: [
    {
      "id": "gmap-review-ai",
      "type": "mandatory",
      "envKey": "FLOW_ENV_KEY"
    }
  ],
  links: {
    "deploy": "https://g-map-review.vercel.app/",
    "github": "https://github.com/Cvr421/AgentKit/tree/gmap-review-ai/kits/gmap-review-ai"
  }
};
