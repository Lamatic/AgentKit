export default {
  name: "ai-career-copilot",
  description: "AI-powered career assistant that analyzes resumes and provides personalized career guidance including skill analysis, job recommendations, learning roadmaps, project suggestions, and interview preparation.",
  version: '1.0.0',
  type: 'kit' as const,
  author: {"name":"Durvankur Joshi"},
  tags: ["career","ai","resume-analyzer","job-recommendation","career-guidance"],
  steps: [
    {
        "id": "ai-career-copilot",
        "type": "mandatory",
        "envKey": "LAMATIC_FLOW_ID"
    }
],
  links: {},
};
