# Outage Detector

A Lamatic **kit**: a flow plus a runnable Next.js app that correlates a new
support ticket against ticket history to catch a shared outage before it
looks like a pattern to a human — verifying genuine root-cause correlation
rather than surface wording similarity.

## What it does

1. **Retrieves** semantically similar historical tickets via vector search.
2. **Verifies** whether those candidates share a genuine root cause with the
   new ticket — same technical component, same failure mode, a plausible
   single upstream cause, and consistent timing — rather than just similar
   wording. Tickets with a self-inflicted cause on the customer's own side
   (e.g. an expired API key) are explicitly rejected even if the wording is
   superficially similar to a real cluster.
3. **Routes** on a confidence threshold: only genuinely correlated tickets
   get flagged.
4. **Drafts** an internal note and a customer-facing message, grounded in
   the actual correlated tickets — not generic boilerplate.

## Flow structure

```text
API Trigger
  → Vector Search (top 8, certainty >= 0.7)
  → Vectorize → VectorDB write (indexes the new ticket for future searches)
  → Correlation Verification Agent (JSON Agent)
  → Condition (confidence >= 0.75)
      ├── "Condition 1" → Drafting Agent (internal_note + customer_message)
      └── "Else" → passthrough (fields stay empty)
  → API Response
```text

Full node-level detail, error scenarios, and design notes are documented
in the docblock at the top of `flows/outage-detector.ts`.

## Running the app locally

```bash
cd apps
cp .env.example .env.local   # fill in real values — see below
npm install
npm run dev
```text

Then open `http://localhost:3000`. The demo steps through a queue of
synthetic tickets (`apps/public/data/synthetic_tickets.json`) one at a time,
submitting each to the deployed flow and showing the response live. A
genuine cluster (T-1005, T-1007, T-1011) and two decoys (T-1009, T-1017)
are seeded into the queue — watch the right panel for when the flow
catches the pattern on T-1013.

## Required credentials

| Env var | Where to find it |
|---|---|
| `LAMATIC_API_KEY` | Studio: Settings → API Keys |
| `LAMATIC_PROJECT_ID` | Studio: Settings → Project → Project ID |
| `LAMATIC_API_URL` | Studio: Settings → API Docs → API → Endpoint |
| `OUTAGE_DETECTOR` | The deployed flow's ID — open the flow, check the URL or the details panel (⋮ menu) |

You'll also need, inside the flow itself (configured in Studio, not via env
vars — see `flows/outage-detector.ts`'s `inputs` export for the exact
fields):
- A Vector Store (developed against one named `support-tickets`)
- An embedding model credential (developed against Cohere `embed-english-v3.0`)
- An LLM credential for both JSON Agent nodes (developed against a
  Groq-hosted model, e.g. Llama 3.3 70B)

## Known caveats

- There are two independent thresholds in this flow: Vector Search's own
  `certainty >= 0.7` (which tickets even become candidates) and the
  Condition node's `confidence >= 0.75` (whether a verified match gets
  flagged). Don't conflate them when tuning.
- `internal_note`/`customer_message` are legitimately empty strings on the
  "Else" branch — that's expected, not a bug.
- The demo app sends only the current ticket per request — no client-side
  batching. All correlation happens server-side inside the flow itself, so
  the vector store must build up across the sequence of submissions.
