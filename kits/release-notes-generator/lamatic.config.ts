export default {
  name: "Release Notes Generator",
  description:
    "Turns a raw list of merged pull requests or commit messages into clean, categorized, human-readable release notes (Features, Fixes, Breaking Changes, Chore) with a short highlights summary.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Mohd Talib Akhtar", email: "mohd.talib@growthengineering.co.uk" },
  tags: ["developer-tools", "changelog", "release-notes", "automation", "generative"],
  steps: [
    {
      id: "release-notes-generator",
      type: "mandatory",
      envKey: "RELEASE_NOTES_GENERATOR",
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/release-notes-generator",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Frelease-notes-generator%2Fapps&env=RELEASE_NOTES_GENERATOR,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20flow%20ID%20and%20project%20credentials%20are%20required.&envLink=https://lamatic.ai/docs",
    docs: "https://lamatic.ai/docs",
  },
};
