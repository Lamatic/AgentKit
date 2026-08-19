export default {
    name: "Interview Prep Generator",
    description: "Agentic pipeline that turns a job description and a public Google Drive resume link into a resume-grounded interview prep kit, guarded against prompt injection and optionally enriched with live company research via search and browser-use.",
    version: "1.0.0",
    type: "template" as const,
    author: { name: "Manvendra Raj Singh", email: "manvendrasingh8802@gmail.com" },
    tags: ["career", "productivity", "agentic", "guardrails", "interview"],
    steps: [
      { id: "interview-prep-generator", type: "mandatory" as const }
        ],
    links: {
          github: "https://github.com/Lamatic/AgentKit/tree/main/kits/interview-prep-generator"
    }
};
