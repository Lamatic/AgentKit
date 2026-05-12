# Agent Kit Excuse Generator by Lamatic.ai

<p align="center">
  <a href="https://excuse-generator-kit.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

**Agent Kit Excuse Generator** is an AI-powered excuse generation system built with [Lamatic.ai](https://lamatic.ai). It uses intelligent workflows to generate personalized excuses based on the situation and person, through a modern Next.js interface. It remembers your personal context and the excuse history so that you don't repeat the same excuses for a person.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/excuse-generator/apps&env=LAMATIC_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY)

---

## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

Pre: Build in Lamatic

1. Sign in or sign up at https://lamatic.ai
2. Create a project (if you don’t have one yet)
3. Click “+ New Flow” and select "Templates"
4. Select the 'Excuse Generator' agent kit
5. Configure providers/tools/inputs as prompted
6. Deploy the kit in Lamatic and obtain your .env keys
7. Copy the keys from your studio

Post: Wire into this repo

1. Create a .env file and set the keys
2. Install and run locally:
   - cd apps
   - npm install
   - npm run dev
3. Deploy (Vercel recommended):
   - Import your repo, set the project's Root Directory to `kits/excuse-generator/apps`
   - Add env vars in Vercel (same as your .env)
   - Deploy and test your live URL

---

## 🔑 Setup

## Required Keys and Config

You’ll need these things to run this project locally:

1. **.env Keys** → get it from your [Lamatic account](https://lamatic.ai) post kit deployment.

| Item     | Purpose                                              | Where to Get It               |
| -------- | ---------------------------------------------------- | ----------------------------- |
| .env Key | Authentication for Lamatic AI APIs and Orchestration | [lamatic.ai](https://lamatic.ai) |

### 1. Environment Variables

Copy the `.env.example` file to `.env.local`:

```bash
cp apps/.env.example apps/.env.local
```

Then configure the required keys in `apps/.env.local`:

```bash
# Lamatic
LAMATIC_FLOW_ID = "Excuse Generator Flow ID"
LAMATIC_API_URL = "LAMATIC_API_URL"
LAMATIC_PROJECT_ID = "LAMATIC_PROJECT_ID"
LAMATIC_API_KEY = "LAMATIC_API_KEY"
```

### 2. Install & Run

```bash
cd apps
npm install
npm run dev
# Open http://localhost:3000
```

---

## 📂 Repo Structure

```
/apps
 ├── /actions
 │    └── orchestrate.ts        # Lamatic workflow orchestration
 ├── /app
 │    ├── /api/chat/route.ts    # Chat API endpoint
 │    └── page.tsx              # Main form UI
 ├── /lib
 │    └── lamatic-client.ts     # Lamatic SDK client
 ├── /public                    # Static assets
 └── package.json               # Dependencies & scripts
/constitutions
  └── ...                       # Lamatic Constitutions
/flows
  └── ...                       # Lamatic Flows
/model-configs
  └── ...                       # Model Configurations
/prompts
  └── ...                       # Lamatic Prompts
/scripts
  └── ...                       # Setup scripts
lamatic.config.ts               # Lamatic Kit Configuration
```

---

## 🤝 Contributing

We welcome contributions! Open an issue or PR in this repo.

---

## 📜 License

MIT License – see [LICENSE](../../../LICENSE).

---

## 👤 Author

Built by [Tilak](https://github.com/Tilakraj0308)
