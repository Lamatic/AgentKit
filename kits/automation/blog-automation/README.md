# Blog Writing Automation Agent Kit

<p align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGhrdHE0Ymh1OXJ3YjR6aHZ1Z2locG9oOXRzam94MDRsbnZyM3o3ZSZlcD12MV9faW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/gleoRKw65bDoBOAv6S/giphy.gif" alt="Demo" />
</p>

**Blog Writing Automation** is an AI-powered system built with [Lamatic.ai](https://lamatic.ai) to automate the entire lifecycle of a blog post—from triggering via webhooks to SEO optimization and CMS publishing.

## 🚀 How it Works

1.  **Trigger**: An external webhook (e.g., from a CRM, Zapier, or a scheduler) sends a payload with a topic and keywords.
2.  **Drafting**: The `blog-drafting` flow generates a high-quality initial draft.
3.  **SEO Optimization**: The `blog-seo` flow refines the content for specific keywords and readability.
4.  **Publishing**: The `blog-publish` flow connects to your CMS API (WordPress, Ghost, etc.) to create the post.

---

## 🔑 Setup

### 1. Lamatic Flows
Before running this project, you must build and deploy the following flows in Lamatic:
- **Drafting Flow**: Input (topic, keywords) -> Output (draft).
- **SEO Flow**: Input (draft, keywords) -> Output (optimized_content).
- **Publish Flow**: Input (content, title) -> Output (publish_status, url).

### 2. Environment Variables
Create a `.env` file in this directory and set the following keys:

```bash
# Lamatic Flow IDs
AUTOMATION_BLOG_DRAFTING = "..."
AUTOMATION_BLOG_SEO = "..."
AUTOMATION_BLOG_PUBLISH = "..."

# Lamatic Connection
LAMATIC_API_URL = "..."
LAMATIC_PROJECT_ID = "..."
LAMATIC_API_KEY = "..."
```

### 3. Install & Run
```bash
npm install
npm run dev
```

---

## 📂 Repo Structure
```
/actions
 └── orchestrate.ts        # Handles the multi-step orchestration logic
/app
 └── page.tsx              # Dashboard for monitoring and triggers
/orchestrate.js            # Flow configuration and dependency mapping
/config.json               # Kit metadata
```

---

## 🤝 Contributing
Refer to the main [CONTRIBUTING.md](../../../CONTRIBUTING.md) for global standards.
