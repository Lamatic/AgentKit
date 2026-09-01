export default {
  name: "Home Maintenance Triage Agent",
  description:
    "AI-powered home maintenance triage that analyzes a description (and optional photo) of any household issue — assessing severity, urgency, whether a professional is needed, safe next steps, and what not to attempt, so homeowners know exactly what to do next.",
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
      id: "home-maintenance-triage",
      type: "mandatory" as const,
      envKey: "NEXT_PUBLIC_LAMATIC_FLOW_ID",
      title: "Home Maintenance Triage Flow",
      description:
        "The core Lamatic flow that receives a home issue description (and optional image URL) and returns a structured triage report including urgency, DIY feasibility, professional type, safety hazards, and safe next steps.",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/home-maintenance-triage",
    deploy:
      "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit%2Ftree%2Fmain%2Fkits%2Fhome-maintenance-triage%2Fapps&root-directory=kits%2Fhome-maintenance-triage%2Fapps",
  },
};
