export default {
  name: "Google Drive Template",
  description: "Syncs files from a Google Drive folder, chunks and embeds their content, and indexes the vectors into a vector database to power a continuously updated RAG knowledge base.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Akshat Virmani",
    email: "akshatv@lamatic.ai"
  },
  tags: ["google-drive", "rag", "vector-database", "embeddings", "indexing"],
  steps: [
    { id: "fr1", type: "mandatory" as const }
  ],
  links: {
    deploy: "https://studio.lamatic.ai/template/google-drive-template",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/google-drive-template"
  }
};
