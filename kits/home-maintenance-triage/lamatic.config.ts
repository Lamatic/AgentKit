export default {
  name: "Home Maintenance Triage Agent",
  description:
    "AI-powered home maintenance triage that instantly analyzes a photo and description of any household issue — assessing urgency, DIY feasibility, safety hazards, professional type needed, and estimated cost range so homeowners know exactly what to do next.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Mohd Ali Faridi",
    email: "faridiali20029@gmail.com",
    url: "https://github.com/sage106",
  },
  tags: ["automation", "assistant", "agentic", "generative", "multimodal"],
  steps: [
    {
      id: "your-flow-id",
      type: "mandatory" as const,
      envKey: "NEXT_PUBLIC_LAMATIC_FLOW_ID",
      title: "Home Maintenance Triage Flow",
      description:
        "The core Lamatic flow that receives a home issue description (and optional image URL) and returns a structured triage report including urgency, DIY feasibility, professional type, safety hazards, and safe next steps.",
    },
  ],
  links: {
    github:
      "https://github.com/sage106/AgentKit/tree/main/kits/home-maintenance-triage",
  },
};
