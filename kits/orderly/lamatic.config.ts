export default {
  name: "Orderly",
  description:
    "Photograph a menu in any language and get one concrete order for your table. " +
    "A vision model reads the menu; a deterministic, unit-tested solver decides what to " +
    "order, respecting every diner's allergies and diet and a hard budget ceiling.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Laxmi Vaibhav Khengare",
    email: "laxmikhengare1611@gmail.com",
  },
  tags: [
    "multimodal",
    "vision",
    "travel",
    "accessibility",
    "food",
    "allergens",
    "translation",
  ],
  steps: [
    {
      id: "menu-scan",
      type: "mandatory" as const,
      envKey: "MENU_SCAN_FLOW_ID",
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/orderly",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit" +
      "&root-directory=kits%2Forderly%2Fapps" +
      "&env=LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY,MENU_SCAN_FLOW_ID,BLOB_READ_WRITE_TOKEN",
    docs: "https://lamatic.ai/docs",
  },
};
