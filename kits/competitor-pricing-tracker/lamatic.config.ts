export default {
  name: "Competitor Pricing Tracker",
  description:
    "Scrapes competitor pricing pages and extracts plans, prices, and features into a structured, side-by-side comparison.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Krish Mungalpara", email: "krishmungalpara007@gmail.com" },
  tags: [
    "competitive-intelligence",
    "web-scraping",
    "pricing",
    "market-research",
    "structured-extraction",
  ],
  steps: [
    {
      id: "competitor-pricing-tracker",
      type: "mandatory" as const,
      envKey: "COMPETITOR_PRICING_TRACKER_FLOW_ID",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/competitor-pricing-tracker",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/competitor-pricing-tracker/apps",
  },
};
