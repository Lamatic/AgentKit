# Production Bottleneck Brief
**[Live Demo](https://agent-r0yzvvrea-ibrahimkhan7208s-projects.vercel.app)**

Turns messy production order data into a prioritized, plain-English brief on what's at risk — then answers follow-up questions about any specific order. Built for manufacturing and fulfillment teams (factories, print shops, custom production runs — anywhere orders move through sequential stages) who don't want to manually dig through spreadsheets to spot what's about to miss a deadline.

## The problem

Most production tracking systems store the raw data — due dates, current stage, quantities completed — but don't tell you *what to look at first*. Someone has to manually scan every open order, do the math on days remaining vs. stages left, and figure out what's actually urgent. That doesn't scale past a handful of orders, and it's easy to miss the one that's already overdue.

## How it works

This kit is two Lamatic flows plus a thin Next.js UI:

**1. Production Brief flow** — takes a full list of orders and returns:
- A short natural-language brief flagging at-risk and overdue orders, the likely bottleneck stage, and what to address first
- A structured stats table (per-order risk data) for at-a-glance scanning

**2. Order Q&A flow** — given one order ID and a free-text question, returns a direct, plain-English answer about that specific order (e.g. *"why is this flagged?"*, *"how many days behind is it?"*).

### Design decision: code does the math, the LLM does the writing

Risk detection (days until due, days in current stage, % complete, overdue status) is computed **deterministically in a code node** — not by the LLM. The LLM's only job is to synthesize those precomputed numbers into a prioritized narrative, and to translate raw field values into plain language rather than echoing variable names. This keeps the output reliable and reproducible: the same input always produces the same risk flags, and the LLM can't hallucinate a risk status that the data doesn't support.

## Input schema

Both flows expect orders in this shape:

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

The Order Q&A flow additionally takes `orderId` (string) and `question` (string).

This is intentionally generic — not tied to any specific industry's terminology — so it maps onto whatever fields your ERP or tracking system already stores per order.

## Flows in this kit

| Flow | Purpose |
|---|---|
| `production-bottleneck-brief` | Analyzes the full order set, computes risk stats, generates the prioritized brief |
| `follow-up-qa` | Answers a targeted question about one specific order |

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

Scoped out on purpose, to keep this focused:
- No live ERP/database integration — you paste or upload order data, it doesn't pull from a live system
- No scheduling or reassignment logic — it reports risk, it doesn't act on it
- No multi-tenant auth — this is a single-user demo, not a production multi-team tool

## Try it

Paste this into the Order Data box and click Analyze:

```json
[
  { "id": "PO-014", "dueDate": "2026-07-25", "stages": ["Cutting","Assembly","Finishing","Packing"], "currentStage": "Assembly", "stageEnteredDate": "2026-07-10", "quantity": "500", "completedQuantity": "210" },
  { "id": "PO-015", "dueDate": "2026-08-15", "stages": ["Cutting","Assembly","Finishing","Packing"], "currentStage": "Cutting", "stageEnteredDate": "2026-07-16", "quantity": "300", "completedQuantity": "290" },
  { "id": "PO-016", "dueDate": "2026-07-18", "stages": ["Cutting","Assembly","Finishing","Packing"], "currentStage": "Finishing", "stageEnteredDate": "2026-07-05", "quantity": "800", "completedQuantity": "400" }
]
```

Then try asking about `PO-016`: *"Why is this order flagged?"*

## Author

Ibrahim Khan