# Agent Kit Reasoning by Lamatic.ai

<p align="center">
  <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGhrdHE0Ymh1OXJ3YjR6aHZ1Z2locG9oOXRzam94MDRsbnZyM3o3ZSZlcD12MV9faW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/gleoRKw65bDoBOAv6S/giphy.gif" alt="Demo" />
</p>

<p align="center">
  <a href="https://agent-kit-reasoning.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

**Agent Kit Reasoning** is an AI-powered reasoning system built with [Lamatic.ai](https://lamatic.ai). It uses a multi-agent flow defined in Lamatic YAML to orchestrate **search, reasoning, and structured answering**, and exposes it through a modern Next.js frontend.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/agent-kit-reasoning&env=LAMATIC_API_KEY&envDescription=Your%20Lamatic%20API%20key%20is%20required.&envLink=https://github.com/Lamatic/agent-kit-reasoning#required-api-keys)

---
## 🔑 Setup
## Required Keys and Config

You’ll need two things to run this project locally:  

1. **Lamatic API Key** → get it from your [Lamatic account](https://lamatic.ai).  
2. **lamatic-config.json payload** → copy it from your Lamatic Studio project (this defines the orchestration flow).  
   ⚠️ Note: The `lamatic-config.json` in this repo is just a **dummy example**.  
   Replace it with your own exported config from Lamatic Studio.

| Item              | Purpose                                      | Where to Get It                                 |
| ----------------- | -------------------------------------------- | ----------------------------------------------- |
| Lamatic API Key   | Authentication for Lamatic AI APIs           | [lamatic.ai](https://lamatic.ai)                |
| Lamatic Config    | Defines your agent orchestration flow         | From your Lamatic Studio Agent Kit Project     |


### 1. Environment Variables
Create `.env` with:
```bash
# Lamatic
LAMATIC_API_KEY=your_lamatic_key
```
### 2. Config File
Copy your project payload into [`lamatic-config.json`](./lamatic-config.json) in the repo root.  
(Export this directly from your Lamatic Studio project and paste it into the file.)

### 3. Install & Run
```bash
npm install
npm run dev
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
/lamatic-config.json       # Lamatic flow configuration
/package.json              # Dependencies & scripts
```

---

## 🤝 Contributing
We welcome contributions!  Open an issue or PR in this repo.

---

## 📜 License
MIT License – see [LICENSE](./LICENSE).