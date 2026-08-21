export default {
  name: "Opportunity Legitimacy Screener",
  description:
    "Screens job postings, recruiter emails, and freelance briefs for legitimacy by extracting structured signals, running live web research, and returning a risk tier with a plain-English explanation.",
  version: "1.0.0",
  type: "bundle" as const,
  author: {
    name: "Muhammad Hamza Nawaz",
    email: "muhammadhamzanawaz89@gmail.com"
  },
  tags: ["job-search", "scam-detection", "web-search", "risk-scoring", "career"],
  steps: [
    { id: "gather-signals", type: "mandatory" as const },
    { id: "score-and-explain", type: "mandatory" as const }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/opportunity-legitimacy-screener",
    docs: ""
  }
};
