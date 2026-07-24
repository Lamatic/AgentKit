export default {
  name: "Live API Debugger",
  description: "Advanced API Error Troubleshooter. Analyzes an error message, failing code snippet, and scrapes the live official API documentation using Firecrawl to provide a precise code fix.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Lamatic Intern Candidate","email":"candidate@example.com"},
  tags: ["developer-tools", "debugging", "agentic-coding"],
  steps: [
    { id: "live-api-debugger", type: 'mandatory' as const }
  ],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/live-api-debugger"
  },
};
