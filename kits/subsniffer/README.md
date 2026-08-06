# SubSniffer — Subscription Audit

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fsubsniffer%2Fapps&env=SUBSNIFFER_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20keys%20are%20required.)

**SubSniffer** is an AI-powered subscription audit built on [Lamatic.ai](https://lamatic.ai). Paste a bank statement, transaction export, or a plain list of charges and get back:

- 🧾 A breakdown of **every recurring subscription** (what it is, how much, how often)
- 🚩 Which ones you **don't use** (with a reason)
- 💸 Your **total monthly recurring spend** and **estimated monthly savings**
- 🔗 **One-click cancellation links** for each wasted subscription
- 📝 A friendly, plain-language **savings report**

It is submitted as an **AgentKit Kit** (a Lamatic flow + a runnable Next.js app) for the Lamatic AgentKit Challenge. The problem is original to this repository: no existing kit audits recurring subscription spend from a raw statement.

---

## Why this exists

Subscription creep is one of the most common, least-noticed drains on personal and team budgets. The hard part isn't *knowing* you have subscriptions — it's (1) seeing them all in one place, (2) being honest about which you use, and (3) actually cancelling them. SubSniffer does all three in one paste.

## How it works

```
Pasted statement ──▶ [API Request] ──▶ [Detect Subscriptions · InstructorLLM]
                                            │  (structured JSON audit)
                                            ▼
                                     [Write Report · LLM] ──▶ [API Response]
                                            │
                                            ▼
                          { analysis: {...}, report: "..." }
```

1. **Detect Subscriptions** — an Instructor-style LLM node extracts a strict JSON model: each subscription with merchant, amount, cadence, category, a `used | rarely | unused` verdict, a normalized monthly cost, and a cancellation URL, plus totals and recommendations.
2. **Write Report** — a chat LLM node turns that structured analysis into a warm, skimmable savings report.
3. The Next.js app renders the structured analysis as cards/numbers and shows the report.

## Lamatic Setup (build + deploy the flow)

> The `flows/subsniffer.ts` in this repo is the exported flow. To make the live app actually call a running flow, deploy it in Lamatic Studio:

1. Sign in / sign up at [lamatic.ai](https://lamatic.ai) and create a project.
2. In Lamatic Studio, create a new flow and rebuild the `subsniffer` graph (or import the structure), then **Deploy** it.
3. Copy your credentials: **Settings → API Keys** (`LAMATIC_API_KEY`, `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`) and the deployed flow's **Flow ID** (`SUBSNIFFER_FLOW_ID`).
4. Put them in `apps/.env.local` (see below).

## Run locally

```bash
cd kits/subsniffer/apps
cp .env.example .env.local      # then fill in the four values
npm install
npm run dev                     # http://localhost:3000
```

Paste a statement like:

```
NETFLIX $15.49
SPOTIFY $10.99
ADOBE CREATIVE $59.99 (used once 4 months ago)
GYMPASS $40 (never used)
AMAZON PRIME $14.99
DROPBOX $11.99 (used weekly)
NOTION $8 (used daily)
ONE-OFF COFFEE $4.50
```

…and SubSniffer will flag Gympass and Adobe as waste, estimate your savings, and link you to cancel.

## Environment variables

| Variable | Purpose |
|---|---|
| `LAMATIC_API_URL` | Lamatic API endpoint |
| `LAMATIC_PROJECT_ID` | Lamatic project id |
| `LAMATIC_API_KEY` | Lamatic API key |
| `SUBSNIFFER_FLOW_ID` | Deployed SubSniffer flow id |

## Deploy (Vercel)

Click the **Deploy with Vercel** button above, or import the repo and set the **Root Directory** to `kits/subsniffer/apps`, then add the four env vars. The live app is the `demo` link in `lamatic.config.ts`.

## Repo structure

```
kits/subsniffer/
├── lamatic.config.ts          # kit metadata (type: kit)
├── agent.md                   # agent identity + capability doc
├── README.md
├── constitutions/default.md   # guardrails
├── .env.example               # kit-level env template
├── flows/subsniffer.ts        # the Lamatic flow (exported)
├── prompts/                   # externalized LLM prompts
├── model-configs/             # externalized model selections
└── apps/                      # Next.js app
    ├── app/                   # UI (page.tsx, layout.tsx, globals.css)
    ├── components/            # header + minimal UI
    ├── lib/                   # lamatic-client.ts, utils.ts
    ├── actions/orchestrate.ts # server action calling the flow
    ├── .env.example
    └── package.json
```

## Notes

- Output is an **estimate to inform your own decisions**, not financial advice. Cancellation URLs are best-effort.
- Currency is preserved as shown; no FX conversion is performed.
- MIT License — see [LICENSE](../../../LICENSE).
