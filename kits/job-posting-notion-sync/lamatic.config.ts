export default {
  name: "Job Posting Extractor & Notion Sync",
  description: "Scrapes a job posting URL, extracts structured data (role, company, salary, tech stack, experience level) via LLM, classifies priority, and saves it as a new page in a Notion database.",
  version: "1.0.0",
  type: "template" as const,
  author: { name: "Ansh Singh", email: "sansh3030@gmail.com" },
  tags: ["scraping", "notion", "automation", "job-search"],
  steps: [
    { id: "job-posting-extractor", type: "mandatory" as const, envKey: "JOB_EXTRACTOR_FLOW_ID" }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/job-posting-notion-sync"
  }
};