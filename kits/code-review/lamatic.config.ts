export default {
  name: "Code Review Agent",
  description: "Analyzes GitHub PRs for bugs, security vulnerabilities, and style issues using multi-step agentic reasoning.",
  version: '1.0.0',
  type: 'kit' as const,
  author: {"name":"Soumik","email":"soumik15630m@example.com"},
  tags: ["agentic","code review","security"],
  steps: [
    {
        "id": "code-review-agent",
        "type": "mandatory",
        "envKey": "AGENTIC_GENERATE_CONTENT"
    }
],
  links: {
    "demo": "https://agent-kit-stk.vercel.app/",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/code-review"
},
};
