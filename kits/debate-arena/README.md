# Debate Arena

Pose any tradeoff or decision and watch two AI agents argue opposing sides across multiple rounds, then get an impartial judge's synthesis — a pros/cons matrix and a final recommendation.

## Why

Asking a single AI for advice on a hard tradeoff gets you one perspective, delivered with unearned confidence. Real decisions are clearer when you see the strongest case for each side argued out, rebutted, and then weighed by someone neutral. Debate Arena turns that into a repeatable workflow: two persona agents debate, then a judge agent synthesizes.

## How it works

Three flows:

```
"microservices vs monolith" ──▶ debate-setup ──▶ two clear positions
                                                        │
                                   ┌────────────────────┴────────────────────┐
                                   ▼                                        ▼
                          debate-round (Position A)              debate-round (Position B)
                          opening argument, then rebuttals each round, alternating
                                   └────────────────────┬────────────────────┘
                                                        ▼
                                                 debate-judge ──▶ pros/cons + verdict
```

### 1. `debate-setup`

**Input:** `topic` — a raw decision or question, in plain English (already framed as "X vs Y" or open-ended, e.g. "should I take this job").

**What it does:** Neutrally reframes the topic and produces exactly two clearly opposed positions a reasonable person could argue, without picking a side. States any assumptions it made explicitly.

**Output:** `cleanTopic`, `positionA` (`label`, `stance`), `positionB` (`label`, `stance`), `context`.

### 2. `debate-round`

**Input:** `topic`, `position` (the side this call argues for), `opponentPosition`, `transcript` (all prior statements from both sides), `round`, `isRebuttal`.

**What it does:** Generates that position's next statement — an opening argument on round 1, or a rebuttal of the opponent's most recent point plus a reinforced case on later rounds. This flow is called multiple times (once per side per round) by the app layer, not chained automatically, since each call needs a different persona/context.

**Output:** `statement`, `keyPoint`.

### 3. `debate-judge`

**Input:** `topic`, `positionA`, `positionB`, `transcript` (the full debate).

**What it does:** Extracts the pros and cons actually raised for each side (no inventing new ones), identifies the single strongest argument per side, and gives a final recommendation with an honest confidence level and caveats — including saying "it depends" when that's the truthful answer.

**Output:** `prosA`, `consA`, `prosB`, `consB`, `strongestArgA`, `strongestArgB`, `recommendation`, `confidence`, `caveats`.

## Uniqueness

Checked against all 79 existing AgentKit registry entries (30 kits, 6 bundles, 43 templates) — nothing else runs a structured multi-agent debate-then-judge pattern. The closest neighbors (`founder-lens`, `system-design-analyzer`) analyze a single input from one perspective; none stage opposing agents against each other and synthesize a verdict.

## Running the app locally

```bash
cd apps
cp .env.example .env.local   # fill in your Lamatic credentials + deployed flow IDs
npm install
npm run dev
```

Or deploy directly with the button below once the three flows are built and deployed in Lamatic Studio.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fdebate-arena%2Fapps&env=DEBATE_SETUP_FLOW_ID,DEBATE_ROUND_FLOW_ID,DEBATE_JUDGE_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20API%20credentials%20and%20deployed%20flow%20IDs%20are%20required.&envLink=https://github.com/Lamatic/AgentKit/tree/main/kits/debate-arena%23readme)
