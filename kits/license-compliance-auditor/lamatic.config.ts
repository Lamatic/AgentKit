export default {
  name: "License Compliance Auditor",
  description: "Scans a project's dependency licenses, flags copyleft/GPL-family risk against a configurable allow-list, and generates a markdown compliance report.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Arekatla Nishanth Chowdary",
    email: "cs@nlnassociates.com"
  },
  tags: ["compliance", "open-source", "licensing", "developer-tools", "security"],
  steps: [
    {
      id: "license-compliance-auditor",
      type: "mandatory" as const
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/license-compliance-auditor"
  }
};
