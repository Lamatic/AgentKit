# Agent Kit Generation by Lamatic.ai

<p align="center">
  <a href="https://agent-kit-generation.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

**Agent Kit Generation** is an AI-powered content generation system built with [Lamatic.ai](https://lamatic.ai). It uses intelligent workflows to generate text, images, and JSON content through a modern Next.js interface with markdown rendering support.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=templates/agentic/generation&env=LAMATIC_CONFIG_GENERATION&envDescription=Your%20Lamatic%20Config%20Generation%20key%20is%20required.&envLink=https://lamatic.ai/templates/agentkits/generation)

---

## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

Pre: Build in Lamatic
1. Sign in or sign up at https://lamatic.ai  
2. Create a project (if you don't have one yet)  
3. Click "+ New Flow"  
4. Choose "Build from Kits" and select the 'Generation' agent kit.  
5. Configure providers/tools/inputs as prompted  
6. Deploy the kit in Lamatic and obtain LAMATIC_CONFIG_GENERATION key
7. Copy the LAMATIC_CONFIG_GENERATION from your studio

Post: Wire into this repo
1. Create a .env file and set:
   - LAMATIC_CONFIG_GENERATION=your_lamatic_config_generation_key
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

You'll need one thing to run this project locally:  

1. **LAMATIC_CONFIG_GENERATION** → get it from your [Lamatic account](https://lamatic.ai) post kit deployment.

| Item              | Purpose                                      | Where to Get It                                 |
| ----------------- | -------------------------------------------- | ----------------------------------------------- |
| Lamatic Config Generation Key  | Authentication for Lamatic AI APIs and Orchestration           | [lamatic.ai](https://lamatic.ai)                |

### 1. Environment Variables

Create `.env.local` with:

```bash
# Lamatic
LAMATIC_CONFIG_GENERATION=your_lamatic_config_generation
```

### 2. Install & Run

```bash
npm install
npm run dev
# Open http://localhost:3000
```

### 3. Deploy Instructions (Vercel)

Click the "Deploy with Vercel" button.

Fill in LAMATIC_CONFIG_GENERATION (required).

Deploy and access your live URL.

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
/package.json              # Dependencies & scripts
```

---

## 🤝 Contributing

We welcome contributions! Open an issue or PR in this repo.

---

## 📜 License

MIT License – see [LICENSE](./LICENSE).
