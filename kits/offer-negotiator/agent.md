# Offer Negotiator — Agent

## Overview
Offer Negotiator turns a job offer into a plan. Give it the role, the numbers, and your priorities; it returns an honest read on the offer, the leverage you actually have, target figures, talking points, a ready-to-send counter-offer email, and a short call script.

## Purpose
The job-search stops giving you tools right when the stakes peak — the offer. Candidates are told to negotiate but not shown how, so they under-ask or send a weak counter. This agent closes that gap with concrete, respectful, ready-to-use artifacts.

## Flows

### offer-negotiator
- **Trigger:** an API request carrying the offer payload — `role`, `company`, `location`, `seniority`, `current_base`, `current_bonus`, `current_equity`, `offered_base`, `offered_bonus`, `offered_equity`, `competing_offers`, `priorities`, `constraints`.
- **Processing:**
  1. **Generate Text (LLM)** reads the offer and returns a single JSON object: an assessment, leverage points, a strategy with target base/total, talking points, a counter-offer email, a call script, risks, and assumptions.
  2. **Code** parses that JSON string into a structured object (with a safe fallback if the model ever returns non-JSON).
  3. **API Response** returns it under the `answer` field.
- **Response:** `answer` = `{ assessment, leverage[], strategy{summary, target_base, target_total, approach}, talking_points[], counter_email, call_script, risks[], assumptions[] }`.
- **When to use:** you have (or expect) an offer and want a negotiation plan and drafts.
- **Dependencies:** a text-generation model configured in Lamatic for the LLM node.

## Guardrails
- Reasons from user-supplied numbers and general principles; never presents a specific market figure as verified fact (estimates are labeled as assumptions).
- Never advises dishonesty (e.g. inventing competing offers).
- Not legal or financial advice; no outcome guarantees.
- See `constitutions/default.md`.

## Integration Reference
- **Lamatic API runtime** — hosts and executes the flow. Requires `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` in the calling app.
- **Text generation model** (the `Generate Text` node) — a Lamatic-configured text model credential.

## Environment Setup
| Variable | Source | Purpose |
|---|---|---|
| `OFFER_NEGOTIATOR` | Deployed flow ID (Studio) | The flow the app invokes |
| `LAMATIC_API_URL` | Settings → API Docs → Endpoint | Lamatic API base URL |
| `LAMATIC_PROJECT_ID` | Settings → Project → Project ID | Project scope |
| `LAMATIC_API_KEY` | Settings → API Keys | Authentication |

## Quickstart
1. Build & deploy the `offer-negotiator` flow in Lamatic Studio; copy its Flow ID.
2. `cd kits/offer-negotiator/apps && cp .env.example .env.local` and fill in the four values.
3. `npm install && npm run dev`, open the app, paste an offer, and read the plan.

## Common Failure Modes
| Symptom | Cause | Fix |
|---|---|---|
| "Flow ID not set" on start | `OFFER_NEGOTIATOR` missing in `.env.local` | Add the deployed Flow ID |
| Empty result fields | Model returned non-JSON | Re-run; verify the `Generate Text` node's model is deployed and credentialed |
| "Authentication error" | Wrong `LAMATIC_API_KEY` | Regenerate in Settings → API Keys |
| "Network error" | `LAMATIC_API_URL` wrong | Copy the exact endpoint from Studio |
