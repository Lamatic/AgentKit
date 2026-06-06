export default {
  name: "ai-interview-preparation-agent",
  description: "An AI-powered interview preparation agent that analyzes a candidate's resume against a job description to identify strengths, skill gaps, and generate personalized interview questions with ideal answer guidance.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Harshul Dashora",
    email: "harshuldashora01@gmail.com"
  },
  tags: ["interview", "resume", "hiring", "career", "generative"],
  steps: [
    {
      id: "resume-parser",
      type: "mandatory" as const
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/ai-interview-preparation-agent"
  }
};
