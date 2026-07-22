export default {
  name: "Local Infrastructure Risk Analyzer",
  description: "An AI agent designed to evaluate municipal project blueprints and text documentation for environmental, sentiment, and structural execution risks.",
  version: "1.0.0",
  type: "template" as const,
  author: { name: "Shweta Kumari", email: "workwith.shweta18@gmail.com" }, 
  tags: ["infrastructure", "risk-analysis"],
  steps: [
    { id: "executeWorkflow", type: "mandatory" as const }
  ],
  links: {
    //  leaving these blank for now until getting PR link
    deploy: "",
    github: "kits/infrastructure-risk-analyzer"
  }
};