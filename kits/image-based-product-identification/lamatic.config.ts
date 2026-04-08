export default {
  name: "Image-Based Product Identification",
  description: "This flow builds an AI-powered product identification system that processes image links, identifies products, and generates a structured JSON output with product name, description, and shopping link, enabling seamless analysis and data extraction from images.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup","compliance"],
  steps: [
    { id: "image-based-product-identification", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/image-based-product-identification",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/image-based-product-identification"
},
};
