# Agent Kit Generation by Lamatic.ai

<p align="center">
  <a href="https://agent-kit-generation.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

**Agent Kit Generation** is an AI-powered content generation system built with [Lamatic.ai](https://lamatic.ai). It uses intelligent workflows to generate text, images, and JSON content through a modern Next.js interface with markdown rendering support.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=templates/agentic/generation&env=AGENTIC_GENERATE_CONTENT,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Generation%20keys%20are%20required.&envLink=https://lamatic.ai/templates/agentkits/agentic/agent-kit-generation)

---

## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

Pre: Build in Lamatic
1. Sign in or sign up at https://lamatic.ai  
2. Create a project (if you don’t have one yet)  
3. Click “+ New Flow” and select "Templates" 
4. Select the 'Generation' agent kit
5. Configure providers/tools/inputs as prompted  
6. Deploy the kit in Lamatic and obtain your .env keys
7. Copy the keys from your studio

Post: Wire into this repo
1. Create a .env file and set the keys
2. Install and run locally:
   - npm install
   - npm run dev
3. Deploy (Vercel recommended):
   - Import your repo, set the project's Root Directory (if applicable)
   - Add env vars in Vercel (same as your .env)
   - Deploy and test your live URL

Notes
- Coming soon: single-click export and "Connect Git" in Lamatic to push config directly to your repo.

---

## 🔑 Setup
## Required Keys and Config

You’ll need these things to run this project locally:  

1. **.env Keys** → get it from your [Lamatic account](https://lamatic.ai) post kit deployment.


| Item              | Purpose                                      | Where to Get It                                 |
| ----------------- | -------------------------------------------- | ----------------------------------------------- |
| .env Key  | Authentication for Lamatic AI APIs and Orchestration           | [lamatic.ai](https://lamatic.ai)                |

### 1. Environment Variables

Create `.env.local` with:

```bash
# Lamatic
AGENTIC_GENERATE_CONTENT = "AGENTIC_GENERATE_CONTENT Flow ID"
LAMATIC_API_URL = "LAMATIC_API_URL"
LAMATIC_PROJECT_ID = "LAMATIC_PROJECT_ID"
LAMATIC_API_KEY = "LAMATIC_API_KEY"
```

### 2. Install & Run

```bash
npm install
npm run dev
# Open http://localhost:3000
```
---

## 📂 Repo Structure

```
/actions
 └── orchestrate.ts        # Lamatic workflow orchestration
/app
 └── page.tsx              # Main generation form UI
/components
 ├── header.tsx            # Header component with navigation
 └── ui                    # shadcn/ui components
/lib
 └── lamatic-client.ts     # Lamatic SDK client
/public
 └── lamatic-logo.png      # Lamatic branding
/flows
  └── ...                  # Lamatic Flows
/package.json              # Dependencies & scripts
```

---

## 🤝 Contributing

We welcome contributions! Open an issue or PR in this repo.

---

## 📜 License

MIT License – see [LICENSE](./LICENSE).
