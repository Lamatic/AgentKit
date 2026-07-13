export default {
  name: "Company Interview Research Agent",
  description: "Takes a company name and job title, performs live web research on the company, classifies the likely interview format, and generates a structured interview preparation brief with likely question themes and smart questions to ask the interviewer.",
  version: "1.0.0",
  type: "template" as const,
  author: { name: "Dhanu Hemantkumar Anurshetru", email: "dhanuanur25@gmail.com" },
  tags: ["interview-prep", "job-search", "career", "web-search", "classifier"],
  steps: [
    {
      id: "company-interview-research-agent",
      type: "mandatory",
      envKey: "LAMATIC_FLOW_ID"
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/company-interview-research-agent"
  }
};
