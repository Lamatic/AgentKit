export default {
  name: "GitHub Commit Agent",
  description: "Fetches git commits between two refs (tags, branches, or SHAs) from any public GitHub repository and produces a clean, human-readable summary grouped by type: features, fixes, breaking changes, and maintenance. Useful for release notes, sprint reviews, incident diffs, and team updates.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Kritiman Talukdar", email: "kritiman_ug_24@ee.nits.ac.in" },
  tags: ["github", "devtools", "generative", "automation", "release"],
  steps: [
    {
      id: "github-commit-agent",
      type: "mandatory" as const,
      envKey: "GITHUB_COMMIT_AGENT_FLOW_ID"
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/github-commit-agent",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fgithub-commit-agent%2Fapps&env=GITHUB_COMMIT_AGENT_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20GitHub%20Commit%20Agent%20keys%20are%20required.&envLink=https://lamatic.ai"
  }
};
