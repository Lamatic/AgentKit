# Offer Negotiator

Turn a job offer into a negotiation plan and a ready-to-send counter-offer.

Every job-search tool helps you *get* the offer — then goes quiet. Offer Negotiator owns the moment nobody else does: you have an offer and you're supposed to negotiate, but you don't know exactly *how*. Paste the role, the numbers, and your priorities, and it returns:

- an honest **assessment** of how competitive the offer is,
- the **leverage** you actually have,
- **target** base and total-comp figures,
- **talking points** you can say out loud,
- a ready-to-send **counter-offer email**,
- a short **call script**,
- and the **risks** and **assumptions** behind the advice.

> It reasons from the numbers you provide plus general principles. It never presents a specific market-salary figure as fact — estimates are flagged as assumptions. Not legal or financial advice.

## How it works

One Lamatic flow, four nodes:

```
API Request  →  Generate Text (LLM)  →  Code (parse)  →  API Response
```

- **Generate Text** reads the offer and returns the whole plan as one JSON object.
- **Code** parses that JSON into a structured object (with a safe fallback).
- **API Response** returns it under the `answer` field, which the app renders as sections.

## Project structure

```
offer-negotiator/
├── lamatic.config.ts        # kit metadata
├── agent.md                 # agent identity + capabilities
├── flows/offer-negotiator.ts
├── prompts/                 # system + user prompts for the LLM node
├── model-configs/           # model settings for the LLM node
├── scripts/                 # the parse code node
├── constitutions/default.md # guardrails
└── apps/                    # Next.js app
```

## Run it locally

Prerequisites: Node 18+, a Lamatic account.

1. In [Lamatic Studio](https://studio.lamatic.ai), build & deploy the `offer-negotiator` flow, then copy its **Flow ID** and your API credentials.
2. Configure env:
   ```bash
   cd apps
   cp .env.example .env.local
   # fill in OFFER_NEGOTIATOR, LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY
   ```
3. Install & start:
   ```bash
   npm install
   npm run dev
   ```
4. Open http://localhost:3000, paste an offer, and get your plan.

## Environment variables

| Variable | Purpose |
|---|---|
| `OFFER_NEGOTIATOR` | Deployed flow ID |
| `LAMATIC_API_URL` | Lamatic API endpoint |
| `LAMATIC_PROJECT_ID` | Lamatic project ID |
| `LAMATIC_API_KEY` | Lamatic API key |

## License

Part of [Lamatic AgentKit](https://github.com/Lamatic/AgentKit).
