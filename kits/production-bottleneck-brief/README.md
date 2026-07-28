# Production Bottleneck Brief

**[Live Demo](https://agent-kit-sigma.vercel.app/)**

Turns messy production order data into a prioritized, plain-English brief on what's at risk of missing its deadline — then lets you have an ongoing conversation about any specific order, with the assistant remembering what's already been discussed. Built for manufacturing and fulfillment teams (factories, print shops, custom production runs — anywhere orders move through sequential stages) who don't want to manually dig through spreadsheets to spot what's about to slip.

## The problem

Most production tracking systems store the raw data — due dates, current stage, quantities completed — but don't tell you *what to look at first* or *what to actually do about it*. Someone has to manually scan every open order, do the math on days remaining vs. stages left, and figure out what's urgent. That doesn't scale past a handful of orders, and it's easy to miss the one that's already overdue.

## How it's built — Lamatic Studio flows

This kit is two Lamatic flows, built entirely from Studio's node canvas, plus a thin Next.js UI on top.

### Flow 1: `production-bottleneck-brief`

API Request → Code Node → Generate Text (brief) → Generate Text (email draft) → API Response

- **API Request** — accepts a full `orders` array (id, dueDate, stages, currentStage, stageEnteredDate, quantity, completedQuantity)
- **Code Node** — deterministically computes risk stats per order: days in current stage, days until due, % complete, stages remaining, and an `atRisk` flag. Also validates input (invalid dates, non-numeric quantities, or an unknown `currentStage` are caught and flagged rather than silently producing `NaN`)
- **Generate Text (brief)** — synthesizes those stats into a short, prioritized narrative: which orders are at risk and why, the likely bottleneck stage, and a concrete recovery action (e.g. reassign resources, escalate a stage-specific delay, deprioritize behind an order with more slack) — not just "look at this first"
- **Generate Text (email draft)** — takes the brief and reformats it into a ready-to-send internal alert email (subject + body), grounded only in what the brief already said
- **API Response** — returns `{ brief, stats, emailDraft }`

### Flow 2: `follow-up-qa`

API Request → Code Node → Memory Retrieve → Generate Text → Memory Add → API Response

- **API Request** — accepts the full `orders` array, an `orderId`, and a free-text `question`
- **Code Node** — isolates and computes stats for just the one order in question, same validation as Flow 1
- **Memory Retrieve** — searches previously stored facts about *this specific order* (filtered by `uniqueId = orderId`), so the assistant has context from earlier questions
- **Generate Text** — answers the question directly, using the current stats plus any retrieved memory, in plain English (no raw field names surfaced). If asked what to do, it gives a concrete recovery action rather than repeating the risk summary
- **Memory Add** — extracts durable facts from the exchange (the question, the answer, and any new specifics) and stores them under the order's ID for future questions to build on
- **API Response** — returns the answer

### Why this design

**Deterministic code does the math, the LLM does the synthesis.** Risk detection is never left to model judgment — it's computed the same way every time in a Code Node. The LLM's job is purely to turn already-correct numbers into something readable and actionable, and it's explicitly instructed never to invent information the input doesn't contain.

**Memory is scoped per order, not per user or session.** A follow-up question about PO-016 has access to everything previously discussed about PO-016 — regardless of who's asking — which matches how a team actually works (anyone on ops asking about the same order should see the same accumulated context).

## Input schema

```json
{
  "orders": [
    {
      "id": "PO-014",
      "dueDate": "2026-07-25",
      "stages": ["Cutting", "Assembly", "Finishing", "Packing"],
      "currentStage": "Assembly",
      "stageEnteredDate": "2026-07-10",
      "quantity": "500",
      "completedQuantity": "210"
    }
  ]
}
```

The Q&A flow additionally takes `orderId` (string) and `question` (string).

The UI accepts a bare array of orders (as shown above); the flow API itself expects it wrapped as `{ "orders": [...] }`.

## Running locally

```bash
cd kits/production-bottleneck-brief/apps
cp .env.example .env.local   # fill in your real values
npm install
npm run dev
```

Open `http://localhost:3000`.

### Environment variables

| Variable | Where to find it |
|---|---|
| `LAMATIC_API_KEY` | Lamatic Studio → Settings → API Keys |
| `LAMATIC_PROJECT_ID` | Lamatic Studio → Settings → Project |
| `LAMATIC_API_URL` | Lamatic Studio → API Docs → your project's GraphQL endpoint |
| `BRIEF_FLOW_ID` | Flow ID for `production-bottleneck-brief`, from its details panel |
| `QA_FLOW_ID` | Flow ID for `follow-up-qa`, from its details panel |

## What this kit does NOT do

Scoped out on purpose:

- **No live ERP/database integration** — you paste or upload order data, it doesn't pull from a live system
- **No automated sending** — the email draft is copy-to-clipboard only, never sent automatically. A natural extension would be creating the draft directly in Gmail via Lamatic's Gmail node (`GMAIL_CREATE_EMAIL_DRAFT`), which we explored but requires a Pro-tier ETL connector — kept the draft copy-paste-ready instead so the feature works for anyone testing this kit regardless of plan
- **Memory has no expiry or lifecycle management** — it's scoped per order and persists indefinitely, appropriate for a demo but a production version would need memory cleanup/expiry policy
- **No multi-tenant auth** — single-user demo, not a production multi-team tool

## Try it

Paste this into the Order Data box and click Analyze:

```json
[
  { "id": "PO-014", "dueDate": "2026-07-25", "stages": ["Cutting","Assembly","Finishing","Packing"], "currentStage": "Assembly", "stageEnteredDate": "2026-07-10", "quantity": "500", "completedQuantity": "210" },
  { "id": "PO-015", "dueDate": "2026-08-15", "stages": ["Cutting","Assembly","Finishing","Packing"], "currentStage": "Cutting", "stageEnteredDate": "2026-07-16", "quantity": "300", "completedQuantity": "290" },
  { "id": "PO-016", "dueDate": "2026-07-18", "stages": ["Cutting","Assembly","Finishing","Packing"], "currentStage": "Finishing", "stageEnteredDate": "2026-07-05", "quantity": "800", "completedQuantity": "400" }
]
```

Then in the Q&A card, ask about `PO-016`: *"Why is this order flagged?"* — followed by *"What should I do about it?"* to see the assistant build on its own prior answer.

## Author

Ibrahim Khan
