export default {
  name: "freelance-proposal-generator",
  description: "Generates a tailored freelance project proposal from a client name, project description, and budget range.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Harjit Singh Bhadauriya",
    email: "harjitbhadauriya0610@gmail.com"
  },
  tags: ["freelance", "business", "proposal", "generative"],
  steps: [
    {
      id: "freelance-proposal-generator",
      type: "mandatory" as const,
      envKey: "FREELANCE_PROPOSAL_FLOW_ID"
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/freelance-proposal-generator"
  }
};