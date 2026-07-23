# Expense & Budget Copilot

Paste in a receipt, a few bank-statement lines, or any list of transactions
and get an instant categorized breakdown plus a friendly, honest note about
where your money went — no spreadsheet required.

## What it does

1. **Extracts & categorizes** every transaction from raw pasted text
   (date, merchant, amount, category — Food, Transport, Rent, Shopping,
   Utilities, Entertainment, Healthcare, Other).
2. **Generates a plain-English budget insight** — total spent, top spending
   categories, and one practical, encouraging suggestion for saving money.
3. **Renders both** as a clean, receipt-styled summary in a Next.js app.

## How it's built

A single Lamatic flow (`flows/analyze-expenses.ts`) with three steps:

```
API Request (trigger)
      │  { transactionText, currency }
      ▼
Generate Text (LLM)      — extracts + categorizes transactions → JSON
      │
      ▼
LLM (insights)           — writes a short, friendly budget summary
      │
      ▼
API Response             — returns { transactions, insight }
```

Both LLM nodes use Gemini 3 Flash.

## Setup

### 1. Deploy the flow in Lamatic Studio

- Import or recreate the flow from `flows/analyze-expenses.ts` in your own
  Lamatic Studio project (or use the exported package in this folder as a
  reference).
- Add your own Gemini API credential.
- Deploy the flow and grab your **Project ID**, **API Key**, **Endpoint**,
  and the flow's **Flow ID** from the Connect/API panel.

### 2. Configure the app

```bash
cd apps/expense-budget-copilot
cp .env.example .env
```

Fill in:

```
LAMATIC_API_KEY=your-api-key
LAMATIC_PROJECT_ID=your-project-id
LAMATIC_ENDPOINT=your-project-endpoint
LAMATIC_FLOW_ID=your-flow-id
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Deploy (optional)

Deploy `apps/expense-budget-copilot` to Vercel like any Next.js app — add
the four environment variables above in your Vercel project settings.

## Example

**Input:**
```
Jan 5 - Starbucks - $6.50
Jan 6 - Uber - $18.20
Jan 7 - Amazon - $45.00
Jan 8 - Rent Payment - $1200.00
Jan 9 - Electricity Bill - $85.30
```

**Output:** categorized line items totaling $1,355.00, plus a short note
like: *"You spent a total of $1,355.00 during this period, with your
largest expenses going toward rent and utilities…"*

## Notes

- This is a text-in / text-out flow — no OCR or receipt-image parsing yet.
  A natural next step would be adding a document/image node upstream to
  handle photographed receipts directly.
- The `transactions` field returned by the flow is a JSON string (the raw
  model output); the app parses it before rendering.
