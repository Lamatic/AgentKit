# Founder Lens — AI Startup Research Agent

> Get a brutally honest investor-grade brief on your startup idea — built from real web data in ~90 seconds. Then chat with your analysis using RAG-powered persistent memory.

![Built with Lamatic](https://img.shields.io/badge/Built%20with-Lamatic-5B21B6?style=flat-square)
![Powered by Exa.ai](https://img.shields.io/badge/Powered%20by-Exa.ai-0EA5E9?style=flat-square)
![GPT-4o](https://img.shields.io/badge/GPT--4o-OpenRouter-10B981?style=flat-square)
![agentkit-challenge](https://img.shields.io/badge/challenge-agentkit-F59E0B?style=flat-square)

---

## What It Does

Founder Lens is a 7-phase autonomous startup research agent. Submit a startup idea and two Lamatic flows run in sequence:

**Flow 1 — Analyze:** Deconstructs your idea into 8 targeted search queries, then fires 9 parallel Exa.ai web searches across:
- **Market size** — TAM/SAM/SOM data
- **VC funding signals** — Crunchbase trends and recent rounds
- **Direct competitors** — mapping the competitive landscape
- **Failed startup postmortems** — what already tried and died
- **Customer complaints** — verbatim from Reddit, G2, HN, Capterra
- **LinkedIn complaint signals** — professional pain signal mining
- **Success stories** — IndieHackers, YC, TechCrunch breakouts
- **Business model benchmarks** — pricing and monetization data
- **Unfair advantage signals** — what makes winners different

Then a dedicated **Contrarian VC Persona** runs a separate pass to find the fatal flaw. The result is a structured Founder Brief JSON stored in **Weaviate vector DB** and **Lamatic semantic memory**, scoped to your `userId` and `sessionId`.

**Flow 2 — Chat:** The founder sends messages and the system retrieves the stored brief via RAG + semantic memory and answers questions using GPT-4o with full context of the brief and conversation history.

---

## The Problem It Solves

Non-technical founders spend weeks manually researching whether their idea is viable. They search Reddit, Google, Crunchbase, read postmortems — and still miss critical blind spots.

Founder Lens automates this entire process in ~90 seconds and gives you the brief a VC analyst would write internally before taking a meeting — but never share with you.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Flow orchestration, RAG, memory | **Lamatic.ai** |
| Neural web search (9 parallel) | **Exa.ai** |
| Analysis synthesis & chat | **OpenRouter / GPT-4o** |
| Idea deconstruction | **OpenRouter / Claude 3.5 Sonnet** |
| Vector embeddings | **Gemini gemini-embedding-001** |
| Vector database | **Weaviate** (via Lamatic) |
| Frontend | **Next.js 14** (TypeScript, Tailwind CSS) |

---

## Prerequisites

- Node.js 18+
- A [Lamatic.ai](https://lamatic.ai) account with both flows deployed
- An Exa.ai API key (configured in Lamatic as a credential)
- An OpenRouter API key (configured in Lamatic as a credential)
- A Gemini API key (configured in Lamatic as a credential)

---

## Setup Instructions

1. **Clone and navigate to the kit folder**
   ```bash
   git clone https://github.com/Lamatic/AgentKit.git
   cd AgentKit/kits/agentic/founder-lens
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then fill in `.env.local` with your real values (see table below).

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

---

## Environment Variables

| Variable | Description | Where to Find |
|---|---|---|
| `FOUNDER_LENS_ANALYZE_FLOW_ID` | Flow ID for the analysis flow | Lamatic Studio → your flow → three-dot menu → Flow ID |
| `FOUNDER_LENS_CHAT_FLOW_ID` | Flow ID for the chat flow | Lamatic Studio → your flow → three-dot menu → Flow ID |
| `LAMATIC_API_URL` | Your project API endpoint | Lamatic Studio → Settings → API Docs |
| `LAMATIC_PROJECT_ID` | Your project ID | Lamatic Studio → Settings → Project |
| `LAMATIC_API_KEY` | Your API key | Lamatic Studio → Settings → API Keys |

---

## Flows

### Analyze Flow
**Input:** `{ idea: string, userId: string, sessionId: string }`  
**Output:** `{ brief: string (JSON), decomposition: string (JSON) }`

Runs the full 7-phase research pipeline, synthesizes a Founder Brief JSON, and stores it in Weaviate + semantic memory.

### Chat Flow
**Input:** `{ message: string, userId: string, sessionId: string }`  
**Output:** `{ answer: string }`

Retrieves the indexed brief and conversation history from memory, then answers the founder's question with full context.

> **Important:** The analyze flow must run first for a given `userId` + `sessionId` pair before the chat flow has any context to retrieve.

---

## Deploy to Vercel

1. Push your branch to GitHub:
   ```bash
   git checkout -b feat/founder-lens
   git add kits/agentic/founder-lens/
   git commit -m "feat: Add Founder Lens - AI Startup Research Agent"
   git push origin feat/founder-lens
   ```

2. Go to [vercel.com](https://vercel.com) and import your repo

3. Set the **root directory** to `kits/agentic/founder-lens`

4. Add all environment variables from the table above

5. Click **Deploy**

---

## Contributing

This kit was built for the [agentkit-challenge](https://github.com/Lamatic/AgentKit). To open a PR:

```
github.com/Lamatic/AgentKit/compare/main...YOUR-USERNAME:feat/founder-lens?expand=1
```

Add the `agentkit-challenge` label to your PR.
