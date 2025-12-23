# PR Description: Blog Writing Automation AgentKit

## What This Asset Does
The **Blog Writing Automation AgentKit** is an end-to-end AI-powered orchestration tool designed to automate the lifecycle of content creation and publishing. It solves the production of consistent blog content by following a high-quality pipeline:

1.  **Triggering**: External webhooks (from CRM, Zapier, etc.) or scheduled tasks signal the start.
2.  **Extraction**: Topic, keywords, and stylistic instructions are fetched from the trigger payload.
3.  **Intelligent Drafting**: AI generates initial content with a focus on SEO and technical coherence.
4.  **Optimization**: A secondary pass refines the content for target search terms and readability.
5.  **Multi-Platform Publishing**: The final post is published automatically to a CMS (e.g., WordPress, Ghost) or static platform via API.

The kit provides a **premium glassmorphic dashboard** for manual triggering and status monitoring.

## Providers & Prerequisites
- **Lamatic.ai**: Core orchestration and workflow execution engine.
- **Lamatic GraphQL Endpoint**: Project-specific endpoint for high-performance interaction.
- **Project IDs & API Keys**: Required for secure authentication.

## How to Run Locally (only for Kits)
1. Navigate to `/kits/automation/blog-automation`.
2. Install with `bun install` or `npm install`.
3. Create a `.env` file using `.env.example` as a template.
4. Run development server: `npm run dev`.

## Live Preview (only for Kits)
Link to Vercel deployment: *[User to insert Vercel URL after deployment]*

## Lamatic Flow
Flow configurations and schemas are maintained in the `/flows` directory of the kit.

---

### PR Checklist [Kit]
- [x] Kit runs locally with `npm run dev`
- [x] `.env` contains all required keys (no secrets in commits)
- [x] `.env.example` has no secrets, only placeholders
- [x] `README.md` documents setup, environment variables, and usage
- [x] Folder structure: `kits/automation/blog-automation/`
- [x] `config.json` and `orchestrate.js` are present and valid
- [x] All flows exported in `flows/` folder
- [x] Vercel deployment works with environment variables set
- [x] Live preview URL works end-to-end
