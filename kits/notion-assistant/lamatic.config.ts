export default {
  name: "Notion Assistant",
  description: "An AI-powered Notion assistant that understands workspace queries, searches pages, organizes notes, and automates page and database item creation.",
  version: "1.0.0",
  type: "template" as const,
  author: { name: "Vimal", email: "vimalsahani2005@gmail.com" },
  tags: ["productivity", "developer-tools", "generative", "automation"],
  steps: [
    { id: "notion-assistant", type: "mandatory" as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/notion-assistant",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/notion-assistant"
  }
};
