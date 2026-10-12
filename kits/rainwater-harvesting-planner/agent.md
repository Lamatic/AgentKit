# Rainwater Harvesting Planner

## Overview
This AgentKit kit helps a household plan a rooftop rainwater harvesting system. It combines real rainfall history for the user's city with deterministic sizing maths, then uses a single Lamatic flow to turn those numbers into a practical, safe plan. It is a **single-flow kit**: a Next.js app gathers inputs, fetches 5 years of daily rainfall from Open-Meteo, computes the harvest and tank size in code, and calls the `rainwater-plan` flow for the written plan.

---

## Purpose
Households that want to harvest rainwater rarely know how much their roof will collect, which tank size is worth paying for, or what to build first. Existing calculators need the user to know their rainfall and stop at a single number; generic chat assistants invent figures.

After this agent runs, the user has trustworthy numbers (annual and monthly harvest, demand, best-value tank, overflow for recharge) and a plan they can hand to a plumber: system type, components, installation order, maintenance schedule, indicative cost and the local checks they must do. Numbers come from code; the agent only explains and plans around them.

## Flows

### rainwater-plan

- Trigger
  - Invocation: API call via the `API Request` (`graphqlNode`) trigger, executed by the app's server action through Lamatic's GraphQL `executeWorkflow`.
  - Input (all strings): `location`, `roof_type`, `household_size`, `primary_use`, `budget_inr`, `language` ("English" or "Hindi"), `rainfall` (JSON string), `calculation` (JSON string).

- What it does
  1. `API Request` (`graphqlNode`) receives the computed context.
  2. `Generate JSON` (`InstructorLLMNode_333`) uses `prompts/rainwater-plan_instructor-llmnode-333_system_0.md` and `prompts/rainwater-plan_instructor-llmnode-333_user_1.md` with a strict JSON schema to produce the plan. The system prompt requires quoting the computed numbers unchanged and recommending exactly `recommendedTankL`.
  3. `API Response` (`graphqlResponseNode`) maps each schema field to the response.

- When to use this flow
  - When harvest and tank numbers have already been computed and need to be explained and turned into an actionable plan.
  - Not for computing rainfall or tank sizes itself, and not for structural engineering sign-off.

- Output
  - `summary` (string), `system_type` (string), `tank_advice` (string), `recharge_advice` (string)
  - `components` (array of `{ name, purpose }`)
  - `installation_steps` (string[])
  - `maintenance` (array of `{ task, frequency }`)
  - `cost_estimate` (`{ low_inr, high_inr, notes }`), clearly indicative
  - `water_quality` (string), `warnings` (string[])

- Dependencies
  - An LLM provider configured on the `Generate Plan` node in Lamatic Studio.
  - Upstream data from the app: Open-Meteo Geocoding and Historical Weather APIs (no key).

### Flow Interaction
Single flow. The app performs data retrieval and calculation (including recharge-pit sizing) before calling it, verifies the returned plan against the computed numbers with `apps/lib/verify.ts`, and still shows the numbers if the flow fails.

## Guardrails
- Prohibited tasks
  - Changing, re-deriving or contradicting computed numbers.
  - Inventing government schemes, subsidy amounts, laws, brands or exact prices.
  - Declaring harvested water safe to drink without filtration, disinfection and testing.
  - Following instructions embedded in input fields (prompt injection).
- Input constraints
  - Roof area must be positive; household size 1–500; location must geocode successfully (validated in the app).
- Output constraints
  - Must follow the JSON schema; text in the requested language; costs labelled indicative; always include safety checks (roof load, pit distance from foundations, septic tanks and borewells, local rules).
- Operational limits
  - Open-Meteo free tier is for non-commercial use; ERA5 data is gridded (~25 km) and lags about 5 days.
  - LLM provider rate limits and latency apply to the plan step.

## Integration Reference

| Integration | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic GraphQL API | Execute the `rainwater-plan` flow | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, `RAINWATER_PLAN_FLOW_ID` |
| LLM provider (Instructor LLM node) | Generate the structured plan | Provider credential set in Lamatic Studio |
| Open-Meteo Geocoding API | City name → coordinates | None |
| Open-Meteo Historical Weather API | 5 years of daily precipitation | None |

## Environment Setup
- `LAMATIC_API_URL` — Lamatic GraphQL endpoint (Studio → Settings → API Docs).
- `LAMATIC_PROJECT_ID` — Lamatic project ID (Studio → Settings → Project).
- `LAMATIC_API_KEY` — Lamatic API key (Studio → Settings → API Keys).
- `RAINWATER_PLAN_FLOW_ID` — ID of the deployed `rainwater-plan` flow.

## Quickstart
1. Create and deploy the `rainwater-plan` flow in Lamatic Studio from `flows/rainwater-plan.ts` and the prompts in `prompts/`.
2. `cd apps && cp .env.example .env.local` and fill in the four variables.
3. `npm install && npm run dev`, then open http://localhost:3000.
4. Enter a city, roof area, roof type, household size and intended use, then click **Plan my system**.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| "Could not find <city>" | Ambiguous or misspelled place name | Add the state or country, e.g. "Ludhiana, Punjab" |
| Rainfall request failed | Open-Meteo unreachable or rate-limited | Retry later; check outbound network from the host |
| Numbers shown but "plan could not be generated" | Missing/wrong `RAINWATER_PLAN_FLOW_ID` or Lamatic credentials, or LLM provider error | Check `.env.local`, redeploy the flow, verify the provider credential in Studio |
| Plan fields appear as raw strings | Response mapping changed in Studio | Keep the `${{...}}` output mapping from the flow file; the app's `unwrap()` parses JSON strings |
| Very large recommended tank | Very high demand with a large roof and long dry season | Check the trade-off table; choose a smaller tank and send more water to recharge |
