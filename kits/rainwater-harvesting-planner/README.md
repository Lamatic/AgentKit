# Rainwater Harvesting Planner

A Lamatic AgentKit **kit** that tells a household how much rain their roof can actually catch, what size tank is worth buying, and how to build and maintain the system — using five years of real rainfall data for their city.

## The problem

Rooftop rainwater harvesting is encouraged (and in many Indian cities required) but most households get stuck on the same questions:

- How much water will my roof really collect where I live?
- What size tank should I buy? Too small wastes the monsoon; too big wastes money.
- What do I need, in what order, and what does it cost?

Online calculators usually ask you to type in "annual rainfall" yourself, use one average number for the whole year, and stop at a single litres figure. Generic chatbots answer confidently but make up the numbers.

## The approach

The kit splits the work between **code for the numbers** and **an agent for the plan**:

1. **Real rainfall** — the city is geocoded and 5 years of *daily* rainfall are pulled from Open-Meteo's historical weather API (ERA5, free, no key).
2. **Deterministic maths in code** (`apps/lib/calc.ts`, unit-tested):
   - Daily harvest = roof area × (rain − 1 mm first-flush) × roof runoff coefficient.
   - Monthly averages, peak-day runoff, and daily demand from household size and intended use.
   - Every standard tank size (500 L → 50,000 L) is simulated month by month. The planner keeps upsizing only while each extra 1,000 L still adds at least 2 percentage points of demand met — the "best value" tank. Whatever the tank cannot hold is reported as overflow for groundwater recharge.
   - The recharge pit is also sized in code: big enough to absorb a typical year's wettest day of runoff, allowing for the ~40% voids in the stone fill, split into several 2 m pits if one would be too wide.
3. **Lamatic flow `rainwater-plan`** — a structured-output LLM node receives those computed numbers and writes the plan: system type, tank and recharge advice, components, installation steps, maintenance schedule, indicative cost, water-quality guidance and local checks. The constitution forbids changing the numbers or inventing subsidies, laws or brands.
4. **Verify, don't trust** — `apps/lib/verify.ts` checks the returned plan against the computed numbers (is the recommended tank size the one quoted? is recharge guidance present when a pit is needed? is the cost range sane?). The UI shows a green "checked" badge or a clear warning.
5. **Use it** — copy the plan, send it on WhatsApp to a plumber, or print / save it as a PDF.

![Flow: API Request → Generate Plan (Instructor LLM) → API Response](https://img.shields.io/badge/flow-API%20Request%20%E2%86%92%20Generate%20Plan%20%E2%86%92%20API%20Response-0b6e99)

## The result

For a 1,000 sq ft concrete roof in Ludhiana, a family of four and toilet-flushing use, the app shows:

- litres collectable per year and per month (chart of harvest vs demand),
- the recommended tank with the share of demand it meets, plus the full trade-off table,
- yearly overflow and the recharge pit size to dig,
- and a written plan in English or Hindi with steps, upkeep, cost range and safety checks.

If the AI step fails, the numbers are still shown — the plan is an addition, not a dependency.

## Design decisions

| Decision | Why |
|---|---|
| Maths in code, not in the LLM | Tank and pit sizes must be reproducible and testable; LLMs drift on arithmetic. |
| Daily rainfall, not one annual average | Monsoon rain arrives in a few heavy days; first-flush losses and peak storms only show up day by day. |
| Best-value tank rule instead of "biggest useful" | A 20,000 L tank that adds 3% reliability over 7,500 L is bad advice for a family budget. |
| Structured output (Instructor LLM + JSON schema) | The UI renders fields directly; no fragile text parsing. |
| Post-generation check | Prompts can be ignored; a code check proves the plan matches the numbers. |
| Graceful degradation | If the flow fails, the numbers, chart and table still render. |

## Tradeoffs and assumptions

- **Rainfall source:** ERA5 reanalysis is gridded (~25 km), so it can differ from a local rain gauge, especially in hilly or coastal areas. It is consistent and available everywhere, which is why it was chosen.
- **Runoff coefficients** are typical values (metal 0.85, concrete 0.80, tiles 0.75, thatch/green 0.50). Real roofs vary.
- **Monthly simulation** smooths out within-month dry spells, so reliability is slightly optimistic for very small tanks.
- **Recharge pits** assume reasonably permeable soil and a 2 m depth; clay soils or a shallow water table need a local check (the plan says so).
- **Demand norms**: 10 L/person/day for drinking and cooking, 55 for flushing and cleaning, 135 for all domestic use (the Indian CPHEEO urban norm).
- **Costs** are indicative, written by the model, and clearly labelled. Always get local quotes.
- Harvested water is **not** treated as drinkable; the plan always says how to treat and test it.

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ (22+ to run the unit tests) |
| npm | 9+ |
| A [Lamatic](https://lamatic.ai) account | free |
| An LLM provider key added in Lamatic Studio | e.g. Gemini, OpenAI |

## Setup

### 1. Create the flow in Lamatic Studio

1. Sign in to [Lamatic Studio](https://studio.lamatic.ai) and open a project.
2. Add an LLM credential (Settings → Integrations).
3. Create a flow named `rainwater-plan` matching [`flows/rainwater-plan.ts`](./flows/rainwater-plan.ts):
   - **API Request** trigger with the input schema in `advance_schema` (all fields are strings).
   - **Generate JSON** (Instructor LLM) node with the output schema from the flow file, the system prompt [`prompts/rainwater-plan_instructor-llmnode-333_system_0.md`](./prompts/rainwater-plan_instructor-llmnode-333_system_0.md) and the user prompt [`prompts/rainwater-plan_instructor-llmnode-333_user_1.md`](./prompts/rainwater-plan_instructor-llmnode-333_user_1.md).
   - **API Response** node with the `outputMapping` from the flow file.
4. Test it with the `testInput` in the flow's `meta`, deploy, and copy the **Flow ID**.

### 2. Run the app

```bash
cd apps
cp .env.example .env.local
# fill in LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY, RAINWATER_PLAN_FLOW_ID
npm install
npm run dev
```

Open http://localhost:3000.

Run the unit tests — 18 tests for the maths and the plan check (Node 22+):

```bash
npm test
```

### 3. Deploy to Vercel

Use the deploy link in `lamatic.config.ts`. Vercel asks for the four environment variables above.

## Environment variables

| Variable | Where to find it |
|---|---|
| `LAMATIC_API_URL` | Studio → Settings → API Docs (GraphQL endpoint) |
| `LAMATIC_PROJECT_ID` | Studio → Settings → Project |
| `LAMATIC_API_KEY` | Studio → Settings → API Keys |
| `RAINWATER_PLAN_FLOW_ID` | Studio → `rainwater-plan` flow → Details |

## Project structure

```
rainwater-harvesting-planner/
├── lamatic.config.ts
├── agent.md
├── constitutions/default.md
├── flows/rainwater-plan.ts       # exported from Lamatic Studio
├── model-configs/
│   └── rainwater-plan_instructor-llmnode-333_generative-model-name.ts
├── prompts/
│   ├── rainwater-plan_instructor-llmnode-333_system_0.md
│   └── rainwater-plan_instructor-llmnode-333_user_1.md
└── apps/                     # Next.js app
    ├── actions/orchestrate.ts   # rainfall → calc → Lamatic flow
    ├── lib/calc.ts              # deterministic maths (+ calc.test.ts)
    ├── lib/verify.ts            # checks the AI plan against the numbers (+ verify.test.ts)
    ├── lib/rainfall.ts          # Open-Meteo geocoding + history
    ├── lib/lamatic-client.ts    # GraphQL executeWorkflow client
    ├── components/              # form + results UI
    └── app/                     # page + layout
```

## Data and credits

Rainfall data: [Open-Meteo](https://open-meteo.com/) Historical Weather API (ERA5, Copernicus Climate Change Service), free for non-commercial use.

## Disclaimer

This tool gives estimates for planning only. Check local regulations, get a qualified plumber or engineer to confirm roof load and drainage, and test harvested water before drinking it.
