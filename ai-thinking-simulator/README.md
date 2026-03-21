# AI Thinking Simulator

> See how 5 different cognitive minds think about your decision — then get a synthesized recommendation.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/agentic/thinking-simulator&env=AGENTIC_THINKING_SIMULATOR_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY)

---

## What it does

You type any question or decision. The agent responds with 5 distinct perspectives:

| Persona | Worldview |
|---|---|
| 🧠 Logical Thinker | Data-driven, systematic, cuts through emotion |
| 💼 Investor | ROI, risk/reward, optionality, asymmetric bets |
| 😬 Risk-Averse Parent | Worst-case scenarios, stability, safety nets |
| 🚀 Startup Founder | Bias to action, embrace uncertainty, move fast |
| 🔮 Future You | Looking back with hindsight — what would you regret? |

Then a final synthesis with a confidence score and concrete recommended action.

---

## Setup

### 1. Build the Lamatic flow

1. Sign in to [studio.lamatic.ai](https://studio.lamatic.ai)
2. Create a new project → new flow → blank canvas
3. Add **API Request** trigger with one input: `question` (string)
4. Add **Generate JSON** node — use the system prompt from `flows/thinking-simulator/config.json`
5. Set user prompt to: `Question: {{question}}`
6. Add **API Response** node
7. Deploy → copy Flow ID, API URL, Project ID, API Key

### 2. Run locally

```bash
cd kits/agentic/thinking-simulator
npm install
cp .env.example .env
# Fill in your Lamatic values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Deploy to Vercel

1. Push branch: `git push origin feat/thinking-simulator`
2. Import to Vercel → set root directory to `kits/agentic/thinking-simulator`
3. Add env vars from `.env.example`
4. Deploy

---

## Environment variables

| Variable | Description |
|---|---|
| `AGENTIC_THINKING_SIMULATOR_FLOW_ID` | Lamatic flow ID |
| `LAMATIC_API_URL` | Lamatic GraphQL endpoint |
| `LAMATIC_PROJECT_ID` | Lamatic project ID |
| `LAMATIC_API_KEY` | Lamatic API key |

---

## Example questions

- "Should I quit my job to start a startup?"
- "Should I use MongoDB or PostgreSQL for a real-time chat app?"
- "Should I take a low-paying AI job or a higher-paying non-AI job?"
- "Should I move to a new city for a better opportunity?"
- "Should I build in public or stay stealth until launch?"

---

## Folder structure

```
kits/agentic/thinking-simulator/
├── .env.example
├── .gitignore
├── README.md
├── config.json
├── package.json
├── orchestrate.js
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── actions/
│   └── orchestrate.ts
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   └── lamatic-client.ts
└── flows/
    └── thinking-simulator/
        ├── config.json
        ├── inputs.json
        └── meta.json
```
