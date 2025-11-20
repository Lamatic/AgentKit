# Agent Kit Deep Search by Lamatic.ai

<p align="center">
  <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGhrdHE0Ymh1OXJ3YjR6aHZ1Z2locG9oOXRzam94MDRsbnZyM3o3ZSZlcD12MV9faW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/gleoRKw65bDoBOAv6S/giphy.gif" alt="Demo" />
</p>

<p align="center">
  <a href="https://agent-kit-reasoning.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

**Agent Kit Deep Search** is an AI-powered reasoning system built with [Lamatic.ai](https://lamatic.ai). It uses a multi-agent flow defined in Lamatic Config JSON to orchestrate **search, reasoning, and structured answering**, and exposes it through a modern Next.js frontend.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/agentic/deep-search)

---

## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

Pre: Build in Lamatic
1. Sign in or sign up at https://lamatic.ai  
2. Create a project (if you don’t have one yet)  
3. Click “+ New Flow” and select "Templates" 
4. Select the 'Deep Search' agent kit
5. Configure providers/tools/inputs as prompted  
6. Deploy the kit in Lamatic and obtain your .env keys
7. Copy the keys from your studio

Post: Wire into this repo
1. Create a .env file and set the keys
3. Install and run locally:
   - npm install
   - npm run dev
4. Deploy (Vercel recommended):
   - Import your repo, set the project’s Root Directory (if applicable)
   - Add env vars in Vercel (same as your .env)
   - Deploy and test your live URL

Notes
- Coming soon: single-click export and “Connect Git” in Lamatic to push config directly to your repo.

---

## 🔑 Setup
## Required Keys and Config

You’ll need these things to run this project locally:  

1. **.env Keys** → get it from your [Lamatic account](https://lamatic.ai) post kit deployment.


| Item              | Purpose                                      | Where to Get It                                 |
| ----------------- | -------------------------------------------- | ----------------------------------------------- |
| .env Key  | Authentication for Lamatic AI APIs and Orchestration           | [lamatic.ai](https://lamatic.ai)                |


### 1. Environment Variables
Create `.env` with:
```bash
# Lamatic
AGENTIC_REASONING_GENERATE_STEPS="AGENTIC_REASONING_GENERATE_STEPS Flow ID"
AGENTIC_REASONING_SEARCH_WEB = "AGENTIC_REASONING_SEARCH_WEB Flow ID"
AGENTIC_REASONING_DATA_SOURCE = "AGENTIC_REASONING_DATA_SOURCE Flow ID"
AGENTIC_REASONING_FINAL = "AGENTIC_REASONING_FINAL Flow ID"
LAMATIC_API_URL = "LAMATIC_API_URL"
LAMATIC_PROJECT_ID = "LAMATIC_PROJECT_ID"
LAMATIC_API_KEY = "LAMATIC_API_KEY"
```

### 3. Install & Run
```bash
npm run deploy
# Open http://localhost:3000
```

---

## 📂 Repo Structure
```
/actions
 └── orchestrate.ts        # Handles orchestration logic
/app
 └── page.tsx              # Main chat UI
/lib
 └── lamatic-client.ts     # Lamatic API client
/flows
  └── ...                  # Lamatic Flows
/package.json              # Dependencies & scripts
```

---

## 🤝 Contributing
We welcome contributions!  Open an issue or PR in this repo.

---

## 📜 License
MIT License – see [LICENSE](./LICENSE).