export default {
  name: "Content Repurposer",
  description: "Takes a blog post/article URL or raw text and repurposes it into multiple content formats: LinkedIn post, Twitter/X thread, newsletter blurb, and key takeaways for efficient cross-platform content distribution.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Tanay Mitra","email":"tanaymitra54@gmail.com"},
  tags: ["content","social-media","marketing"],
  steps: [
    { id: "content-repurposer", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/content-repurposer",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/content-repurposer"
},
};
