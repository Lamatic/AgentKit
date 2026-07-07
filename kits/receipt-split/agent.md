# Receipt Split

## Overview

Receipt Split turns a photo of a receipt into a fair, itemized settlement between people. It is a two-flow kit (with a small Next.js app in `apps/`): one flow reads the receipt, the other does the math.

## Flows

### 1. `receipt-extract`

**Input:** `imageUrl` (a photo or scan of a receipt) and optional `rawText` (OCR text, used as a hint alongside the image).

**What it does:** Uses a vision-capable LLM (`groq/meta-llama/llama-4-scout-17b-16e-instruct`) to read the receipt image and return structured JSON: line items (name, quantity, unit price, total price), subtotal, tax, tip, grand total, currency, and merchant name.

**Output:** Structured receipt JSON, meant to be passed straight into `bill-splitter`.

### 2. `bill-splitter`

**Input:** `receiptData` (the JSON from `receipt-extract`, as a string) and `splitInstructions` (plain English, e.g. *"Alex had the burger, Sam had the pizza, split tax and tip evenly"*).

**What it does:** Uses an LLM (`groq/llama-3.3-70b-versatile`) to assign each line item to the right person, distribute tax and tip proportionally to each person's share of the subtotal, and reconcile rounding so individual totals sum to the grand total.

**Output:** A `perPerson` breakdown (name, items share, tax share, tip share, total) plus the overall subtotal, tax, tip, and grand total.

## Guardrails

Both flows follow `constitutions/default.md`: no fabricated values (missing/illegible fields come back as `null`), numeric fields are always numbers rather than strings, and neither flow logs or retains the receipt image or extracted data beyond the request/response cycle.

## Integration

Call `receipt-extract` with the receipt image, then feed its JSON output directly into `bill-splitter` along with the splitting instructions. See `README.md` for example requests, or run `apps/` locally for a ready-made two-step UI over the same two calls.
