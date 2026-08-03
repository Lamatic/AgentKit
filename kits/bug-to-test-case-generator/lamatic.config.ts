export default {
  name: "Bug to Test Case Generator",
  description: "This workflow automatically translates unstructured bug reports or Jira issues into structured test cases, regression steps, and automated test templates.",
  version: "1.0.0",
  type: "template" as const,
  author: { name: "Vimal", email: "vimalsahani2005@gmail.com" },
  tags: ["testing", "qa", "developer-tools", "productivity"],
  steps: [
    { id: "bug-to-test-case-generator", type: "mandatory" as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/bug-to-test-case-generator",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/bug-to-test-case-generator"
  }
};
