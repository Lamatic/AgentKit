# Blog Writing Automation Agent Kit

<p align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGhrdHE0Ymh1OXJ3YjR6aHZ1Z2locG9oOXRzam94MDRsbnZyM3o3ZSZlcD12MV9faW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/gleoRKw65bDoBOAv6S/giphy.gif" alt="Demo" />
</p>

**Blog Writing Automation** is an AI-powered tool built with [Lamatic.ai](https://lamatic.ai) that automates the generation and publishing of blog posts. It can be triggered externally via webhooks or scheduled tasks to maintain a consistent content pipeline.

---

## 🛠️ How It Works (Step-by-Step)

1.  **External Trigger**: An external webhook (e.g., from CRM, Zapier, or a scheduler) signals the agentkit to start a new blog post.
2.  **Payload Extraction**: The agent fetches the topic, target keywords, and stylistic instructions from the trigger payload.
3.  **AI Drafting & SEO**: The agent drafts a blog post using AI, ensuring deep SEO optimization, coherence, and technical accuracy.
4.  **Review Phase**: The draft can be reviewed (optionally by a human or another AI agent) before being finalized for publishing.
5.  **Multi-Platform Publishing**: The post is automatically published to a CMS (WordPress, Ghost, etc.) or a static blog platform via API.
6.  **Status Monitoring**: Logs and execution status of the publishing pipeline are maintained and visible in the dashboard.

---

## 🔑 Setup

### 1. Lamatic Flows
Before running this project, you must build and deploy the following flows in Lamatic:
- **Drafting Flow**: Input (topic, keywords) -> Output (`content` or `draft`).
- **SEO Flow**: Input (draft, keywords) -> Output (`optimized_content` or `content`).
- **Publish Flow**: Input (content, title) -> Output (`publish_status`, `url`).

### 2. Environment Variables
Create a `.env` file in this directory and set the following keys:

```bash
# Lamatic Flow IDs
AUTOMATION_BLOG_DRAFTING = "FLOW_ID_HERE"
AUTOMATION_BLOG_SEO = "FLOW_ID_HERE"
AUTOMATION_BLOG_PUBLISH = "FLOW_ID_HERE"

# Lamatic Connection
LAMATIC_API_URL = "https://api.lamatic.ai" # Or your project-specific GraphQL endpoint
LAMATIC_PROJECT_ID = "YOUR_PROJECT_ID"
LAMATIC_API_KEY = "YOUR_API_KEY"
```

### 3. Install & Run
```bash
npm install
npm run dev
```

---

## 📂 Repo Structure
- `/actions/orchestrate.ts`: Handles the multi-step orchestration logic and field mapping.
- `/app/page.tsx`: Premium dashboard for manual triggers and status monitoring.
- `/orchestrate.js`: Configuration for flow dependencies and schemas.
- `/config.json`: Metadata for the AgentKit repository.

---

## 🤝 Contributing
Refer to the main [CONTRIBUTING.md](../../../CONTRIBUTING.md) for global standards and coding patterns.
