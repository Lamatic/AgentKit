# analyze-expenses

## Overview

A single-flow agent that turns raw, unstructured transaction text (pasted
receipts, bank-statement lines, or a manual list) into a categorized
expense breakdown and a short, friendly budget insight.

## Purpose

Most budgeting tools require manual entry into rigid forms or spreadsheet
templates. This agent removes that friction: paste in whatever you have,
in whatever format, and get back structured data plus a plain-English
takeaway — no categories to set up in advance, no CSV import mapping.

## Flow description

`flows/analyze-expenses.ts`:

1. **API Request (trigger)** — accepts `transactionText` (string) and
   `currency` (string).
2. **Generate Text (`LLMNode_233`)** — a financial data-extraction prompt
   that reads the raw text and returns structured JSON: an array of
   `{ date, merchant, amount, category }` objects plus a `totalSpent`
   figure. Category is constrained to a fixed set (Food, Transport, Rent,
   Shopping, Utilities, Entertainment, Healthcare, Other) so downstream
   rendering stays predictable.
3. **LLM — insights (`LLMNode_876`)** — reads the categorized output from
   step 2 and writes a 3–5 sentence, encouraging budget summary: total
   spent, top spending categories, and one practical savings suggestion.
   Explicitly instructed to return plain text, not JSON.
4. **API Response** — returns `{ transactions, insight }` to the calling
   app.

## Guardrails

- Uses the default constitution (`constitutions/default.md`): no PII
  logging/storage beyond what the flow needs, treats input as untrusted,
  refuses jailbreak/injection attempts.
- The categorization prompt is constrained to return **only** valid JSON
  in a fixed schema — no explanations or markdown — to keep the output
  reliably parseable by the app.
- The insights prompt is explicitly told not to return JSON, keeping the
  two node outputs cleanly separated (structured data vs. prose).

## Integration reference

See `apps/expense-budget-copilot/actions/orchestrate.ts` for how the app
calls this flow via the Lamatic SDK (`lamatic.executeFlow`) and parses the
response. See the top-level `README.md` for full setup instructions.

## Known limitations / next steps

- Text-in only — no OCR for photographed receipts yet. A natural
  extension would be adding an image/document node ahead of the
  extraction step.
- Category list is fixed at prompt-level; making it configurable per user
  would be a reasonable v2 improvement.
