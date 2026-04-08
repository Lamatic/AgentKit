export default {
  name: "Caption Image",
  description: "This API accepts an image and metadata, then uses the image content to generate a caption. It enables systematic, consistent, and efficient captioning of large numbers of photographs, screenshots, or other images.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["generative"],
  steps: [
    { id: "caption-image", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/caption-image",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/caption-image"
},
};
