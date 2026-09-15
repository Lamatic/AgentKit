export default {
  name: "Visual Return Assessor",
  description:
    "Assesses item images for return authenticity and tampering. Also ingests PDFs, text files for policy file vectorization and storing",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Dhruv Bakshi",
    email: "dhruvbakshi0803@gmail.com",
  },
  tags: ["multimodal", "visual return"],
  steps: [
    {
      id: "ecommerce-visual-return",
      type: "mandatory",
      envKey: "VISUAL_RETURN_ASSESSOR",
    },
    {
      id: "data-ingestion",
      type: "mandatory",
      envKey: "POLICY_DATA_INGESTION",
    },
  ],
  links: {
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fvisual-return-assessor%2Fapps",
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/visual-return-assessor",
    demo: "",
    docs: "",
  },
};
