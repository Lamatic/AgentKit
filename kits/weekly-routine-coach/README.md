# Weekly Routine Coach

A Lamatic AgentKit **kit** that turns a free-text brain-dump of goals and commitments into a balanced weekly routine on a 30-minute grid — and replans when something slips. Bilingual: detects PT-BR or EN from the first message and stays in that language.

> **Why this kit?** Of the ~70 existing AgentKit contributions, none addresses personal time-blocking. Career copilots, summarizers, content generators and RAG bots exist in abundance — but no one had built a coach that turns intentions into a real weekly grid and reshuffles when life intervenes. This is the only "personal productivity" kit in AgentKit.

## What it does

1. **Intake (conversational)** — type your week freely. The agent extracts categories, fixed commitments, recurring goals, one-off events and preferences. Asks one clarifying question at a time until it has enough.
2. **Generate week** — places everything on a 7-day, 30-min grid. Respects sleep (≥7h/day), meals/breaks (≥1.5h/day), fixed commitments (never overwritten), and per-goal time-window preferences. Distributes recurring goals across non-consecutive days when possible. If a goal's target hours can't fit, it surfaces the gap honestly in `unmet_goals` rather than silently shrinking blocks.
3. **Replan** — click a goal block to mark it as skipped; the agent reshuffles within the week and shows a diff (which blocks moved, which were dropped). The model is told to minimize churn.

All three flows share one constitution (`constitutions/default.md`) that makes the realism rules non-negotiable across the kit.

## How it's built

- **3 Lamatic flows** (`intake`, `generate-week`, `replan`), each a Generate JSON node behind an API Request trigger.
- **Model**: Gemini 2.5 Flash (free tier of Google AI Studio).
- **App**: Next.js 16 + React 19 + Tailwind v4 + shadcn/ui. Single-page state machine (chat → loading → grid → slip dialog).
- **Client**: bare `fetch` against Lamatic's GraphQL endpoint with a thin `unwrap()` helper that undoes two platform quirks (see *Notes on platform quirks* below).

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| A free [Google AI Studio API key](https://aistudio.google.com/app/apikey) | for Gemini |
| A free [Lamatic account](https://lamatic.ai) | to host the flows |

## Setup

### 1. Deploy the three flows on Lamatic

This kit's three flows must be deployed to your own Lamatic project before the app can call them. The flow files in `flows/` are Lamatic Studio exports — to deploy:

1. Sign in to [Lamatic Studio](https://studio.lamatic.ai) and create a project.
2. Add a Gemini credential (Settings → Integrations → Google Gemini → paste your AI Studio key).
3. Create three flows named exactly `intake`, `generate-week`, `replan`. Match each flow to the corresponding `flows/<name>.ts` (Trigger input schema, Generate JSON system & user prompts, output Zod schema, and API Response `outputMapping`). The system & user prompts live in `prompts/`.
4. Deploy each flow and copy its Flow ID.

### 2. Configure and run the app

```bash
cd apps
cp .env.example .env.local
# Fill in LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY,
# INTAKE_FLOW_ID, GENERATE_WEEK_FLOW_ID, REPLAN_FLOW_ID
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting.

> `--legacy-peer-deps` is needed because `vaul` (used by shadcn's Drawer) declares React 16–18 as a peer and we run on React 19. The behavior at runtime is identical.

### 3. Deploy on Vercel (optional)

Click the deploy button in `lamatic.config.ts` (or click "Deploy" on the kit page in the AgentKit catalog). Vercel will prompt for the six environment variables.

## Project structure

```text
kits/weekly-routine-coach/
├── lamatic.config.ts          # kit metadata + flow → envKey mapping
├── agent.md                   # agent identity + capability doc
├── README.md                  # this file
├── flows/
│   ├── intake.ts              # exported from Studio
│   ├── generate-week.ts
│   └── replan.ts
├── prompts/                   # externalized prompts referenced by flows
│   ├── intake_*.md
│   ├── generate-week_*.md
│   └── replan_*.md
├── constitutions/
│   └── default.md             # inviolable rules shared by all flows
└── apps/
    ├── app/                   # Next.js App Router
    ├── components/ui/         # shadcn/ui primitives
    ├── actions/orchestrate.ts # typed server actions for the 3 flows
    ├── lib/lamatic-client.ts  # GraphQL client + unwrap() helper
    └── .env.example
```

## Notes on platform quirks

The app's `lib/lamatic-client.ts` includes an `unwrap()` helper that undoes two artifacts of Lamatic's `outputMapping` system:

1. **Leading `$` on every value.** The template syntax `${{NodeId.output.field}}` substitutes the inner expression but leaves `$` as a literal character. `unwrap()` strips it.
2. **Objects and arrays serialized as JSON strings.** Lamatic's GraphQL Response schema declares fields as `str`/`int`/`float`/`obj`/`arr`, but `outputMapping` only reliably interpolates string values — so we serialize objects with `${{...}}` inside string quotes on the way out, then `JSON.parse()` on the way in. `unwrap()` does this for any string starting with `{` or `[`.

There's no `bool` type in the response schema, so booleans round-trip as `"true"` / `"false"` strings. `unwrap()` converts these too.

These behaviors are documented in `agent.md` under *Common Failure Modes* so future contributors aren't surprised.

## Roadmap (not in MVP)

- Friday review flow — compare planned vs. actually-completed blocks and surface aderência patterns.
- Google Calendar two-way sync — pull fixed commitments, push generated blocks.
- Email or Slack daily nudges.
- A "stretch" variant for habit stacking (read 30min, plus reading-streak counter).

## Credits

Built by **Igor Michalski** for the Lamatic.ai AgentKit Challenge (May 2026). Inspired by [Crono](https://github.com/igormichalski) — a desktop weekly-routine planner — but reimagined as an agent that does the placement work itself.
