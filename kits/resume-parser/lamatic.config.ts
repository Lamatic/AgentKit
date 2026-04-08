export default {
  name: "Resume Parser",
  description: "This AI-powered resume parsing system takes a resume as input, extracts key details like name, experience, skills, and education, and converts the information into structured JSON format, enabling efficient candidate profiling and integration into hiring workflows.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup","growth"],
  steps: [
    { id: "resume-parser", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/resume-parser",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/resume-parser"
},
};
