export default {
  name: "SnapKart",
  description: "Turns a kirana store WhatsApp number into an AI-powered order desk. SnapKart understands Hinglish messages, classifies intent, extracts structured line items, matches them against a vector-indexed product catalog, logs confirmed orders to Airtable, and alerts the shop owner on Slack in real time. Includes a Next.js dashboard for the owner to view orders, confirm them, upload the catalog, and simulate customer messages without a phone.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Harshit Gupta",
    email: "harshit.109350@gmail.com",
  },
  tags: ["whatsapp", "commerce", "agentic", "india", "automation", "rag", "classification"],
  steps: [
    { id: "order-intake", type: "mandatory" as const, envKey: "ORDER_INTAKE_FLOW_ID" },
    { id: "catalog-indexer", type: "mandatory" as const, envKey: "CATALOG_INDEXER_FLOW_ID" },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/snapkart",
    deploy: "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit&root-directory=kits%2Fsnapkart%2Fapps",
  },
};