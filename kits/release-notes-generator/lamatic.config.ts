export default {
  name: "Release Notes Generator",
  description: "This workflow turns raw git commit messages and pull request titles into clean, categorized, human-readable release notes (Features, Fixes, Breaking Changes, and more) using an LLM.",
  version: '1.0.0',
  type: 'template' as const,
  author: { "name": "Shaik Shivaji", "email": "shaikshivaji123@gmail.com" },
  tags: ["generative", "developer-tools"],
  steps: [
    { id: "release-notes-generator", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/release-notes-generator",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/release-notes-generator"
  },
};
