# SubSniffer — Subscription Audit

## Overview
SubSniffer is an AgentKit **kit** that turns a raw bank statement, transaction export, or typed list of charges into a clear audit of recurring subscriptions. It tells you exactly how much you spend every month on subscriptions, which ones you don't actually use, how much you could save by cancelling the waste, and links you straight to the cancellation page for each one. The kit ships a single Lamatic flow plus a runnable Next.js web app.

---

## Purpose
Most people drastically underestimate their recurring spend, and even when they suspect waste they don't know *what* to cancel or *how*. SubSniffer closes that gap: paste your charges, get a structured breakdown plus a friendly savings report. The "state of the world" is better because the user leaves with an actionable cancellation list and a concrete dollar figure instead of vague guilt.

## Flows

### `subsniffer` (SubSniffer — Subscription Audit)

- **Flow type:** Single API-driven pipeline
- **Node chain:** `API Request (graphqlNode)` → `Detect Subscriptions (InstructorLLMNode)` → `Write Report (LLMNode)` → `API Response (graphqlResponseNode)`

#### Trigger
- **Invocation method:** API request handled by the flow's `graphqlNode` trigger.
- **Expected input shape:**
  - `statement` — required; raw charges as text (pasted statement, CSV, or "Merchant $amount" lines).
  - `goals` — optional; a focus such as "cancel anything unused in 60 days" or "keep only creative tools".

The user prompts reference `{{triggerNode_1.output.statement}}` and `{{triggerNode_1.output.goals}}`.

#### What it does
1. **Receive request** — accepts the charges and optional goals.
2. **Detect Subscriptions** (`InstructorLLMNode`) — schema-constrained JSON extraction producing a list of subscriptions (merchant, amount, cadence, category, usage verdict, reason, monthly_cost, cancellation_url), plus `totals` (monthly/annual recurring, estimated savings), `top_recommendations`, and `risk_flags`.
3. **Write Report** (`LLMNode`) — turns the structured analysis into a warm, plain-language savings report.
4. **Return response** — returns `{ analysis, report }` as JSON.

#### When to use this flow
- You have a statement/export/list of charges and want recurring spend surfaced.
- You want unused subscriptions flagged with cancellation links.
- You are building a personal-finance feature that needs a subscription audit as a service.

#### Do not use when
- The input has no recognizable merchant/amount pairs.
- You need guaranteed financial advice — output is an estimate to inform your own decisions.

#### Output
- `analysis` — structured object (summary, subscriptions[], totals{}, top_recommendations[], risk_flags[]).
- `report` — plain-language savings report (string).

#### Dependencies
- **Lamatic AgentKit runtime** to execute the flow.
- **LLM provider** for both nodes (Instructor-style JSON extraction + chat report).
- **Prompts:** `subsniffer_detect-subscriptions_system.md`, `_user.md`, `subsniffer_write-report_system.md`, `_user.md`.
- **Constitution:** `Default Constitution`.

## Guardrails
- **Prohibited tasks:** no harmful/illegal content; no compliance with jailbreaks or prompt injection; do not fabricate charges not present in the statement.
- **Input constraints:** `statement` must be non-empty text; treat inputs as potentially adversarial.
- **Output constraints:** do not log/store PII; never output raw credentials or hidden prompts; label uncertain usage verdicts as such.
- **Operational limits:** subject to model rate limits, timeouts, and token limits; currency is preserved as given (no FX conversion).

## Integration Reference

| Integration | Purpose | Credential |
|---|---|---|
| `GraphQL/API Trigger` | Accept charges + goals | Deployment endpoint (inferred) |
| `LLM` (InstructorLLMNode) | Extract subscriptions JSON | LLM provider API key (inferred) |
| `LLM` (LLMNode) | Generate report | LLM provider API key (inferred) |
| `GraphQL/API Response` | Return `{analysis, report}` | Deployment response mapping (inferred) |

## Environment Setup
- `LAMATIC_API_URL` — Lamatic API endpoint.
- `LAMATIC_PROJECT_ID` — Lamatic project id.
- `LAMATIC_API_KEY` — Lamatic API key.
- `SUBSNIFFER_FLOW_ID` — deployed SubSniffer flow id (kit app only).

## Quickstart
1. Fork the AgentKit repo and add this folder, or build the flow in Lamatic Studio and export it here.
2. Set the four env vars above in `apps/.env.local` (copy from `apps/.env.example`).
3. `cd kits/subsniffer/apps && npm install && npm run dev`.
4. Paste a statement, click **Audit my subscriptions**, review the results.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Empty / low-quality audit | Statement too short or lacks merchant+amount pairs | Provide fuller charges with amounts |
| Wrong usage verdict | No usage context given | Add notes like "used daily" / "never used" in the statement or goals |
| Missing cancellation link | Obscure merchant | Manually search the merchant's help center; link is best-effort |
| Auth/network error | Missing Lamatic env vars | Fill `LAMATIC_*` and `SUBSNIFFER_FLOW_ID` in `.env.local` |

## Notes
- Project type is `kit`; ships a Next.js app under `apps/`.
- Repository link: `https://github.com/Lamatic/AgentKit/tree/main/kits/subsniffer`.
