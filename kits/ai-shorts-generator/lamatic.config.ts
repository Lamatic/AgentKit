export default {
  name: "AI Video Shorts Generator",
  description: "An automated pipeline that generates a sequence of 5 video scenes, complete with a 60-second punchy voiceover script and corresponding safe, photorealistic AI-generated image URLs.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Bhavik Joshi",
    email: "bhavikjoshi8989@gmail.com",
    url: "https://github.com/ABhavikj123"
  },
  tags: ["automation", "generative", "video", "multimodal"],
  steps: [
    {
      id: "script-creator",
      type: "mandatory" as const,
      envKey: "NEXT_PUBLIC_LAMATIC_FLOW_ID",
      title: "Script and Image Generation Flow",
      description: "Generates a 60-second 5-scene JSON script with voiceovers and runs a loop to fetch corresponding AI images via Cloudflare."
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/ai-shorts-generator",
    deploy: "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit%2Ftree%2Fmain%2Fkits%2Fai-shorts-generator%2Fapps&root-directory=kits%2Fai-shorts-generator%2Fapps"
  }
};