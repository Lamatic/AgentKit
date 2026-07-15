# Trade Finance Document Validator

I built this because I was tired of watching junior credit ops folks manually comb through Letters of Credit, trade licenses, and invoices looking for the same handful of things every time — missing signatures, expired dates, a beneficiary field that's just... blank. It's the kind of first-pass review that eats an analyst's morning and still slips up sometimes.

This kit does that first pass for you. Upload a document (or paste the text), and it extracts the key fields, runs them against a compliance checklist, and gives you a pass/fail verdict with a plain-English summary. It doesn't replace a human reviewer — it just makes sure the obvious stuff gets caught before it reaches one.

## How it works

Upload → extraction → validation → summary → structured report. Four LLM/logic steps, one flow:

1. **Extract Fields** — pulls out issuer, beneficiary, amounts, dates, reference numbers, whatever's relevant to the document type.
2. **Validate Rules** — checks the extracted fields against a rule checklist (expiry dates, required parties, signatures, etc).
3. **Generate Summary** — writes a plain-English verdict so you're not staring at raw JSON.
4. **Finalise Output** — merges all three into one clean response for the frontend.

## What it handles

| Document | What it pulls out | What it checks |
|---|---|---|
| **Letter of Credit** | Issuing bank, applicant, beneficiary, amount, currency, LC ref, expiry | Expiry validity, parties present, amount + currency, signature |
| **Trade License** | Business name, owner, license number, issuing authority, expiry | Expiry validity, license number, authority present |
| **Commercial Invoice** | Seller, buyer, goods, total amount, invoice number, date | Amount present, invoice number, seller/buyer present |

You can upload `.txt`, `.pdf`, or Word (`.docx`) files, or just paste the text in directly. Scanned images aren't supported yet — there's no OCR step, so a photo of a document will just produce garbage text. If you need that, you'd want to add a vision-capable extraction step in Studio.

## What you get back

```json
{
  "document_type": "Letter of Credit",
  "extracted_fields": {
    "issuer": "XYZ International Bank",
    "beneficiary": "Global Exports Ltd",
    "amount": "USD 500,000",
    "expiry_date": "2027-07-10",
    "signature_present": true
  },
  "validation_results": [
    { "check": "Expiry date valid", "status": "pass", "note": null },
    { "check": "Signature present", "status": "fail", "note": "No signature detected on page 2" }
  ],
  "confidence_score": 0.91,
  "summary": "This Letter of Credit issued by XYZ International Bank has FAILED validation...",
  "overall_status": "failed"
}
```

## Getting it running

### 1. Set up the flow in Lamatic Studio

Head to [studio.lamatic.ai](https://studio.lamatic.ai), create a project, and wire up these nodes in order:

- **API Request trigger** — inputs: `document_text`, `file_name`, `today_date`
- **LLM Node** "Extract Fields" — prompts in `prompts/trade-finance-validator_extractor_*.md`
- **LLM Node** "Validate Rules" — prompts in `prompts/trade-finance-validator_validator_*.md`
- **LLM Node** "Generate Summary" — prompts in `prompts/trade-finance-validator_reporter_*.md`
- **Code Node** "Finalise Output" — script in `scripts/trade-finance-validator_finalise-output.ts`
- **API Response** — this is where people usually trip up. Make sure the output variable is typed as `obj` (not `str`) and points at `{{codeNode_finalise.result}}`. If you leave it as `str`, you'll get back an empty or truncated response and spend an hour like I did wondering why.

Deploy the flow and grab the Flow ID from the flow details panel.

### 2. Run the app

```bash
cd kits/trade-finance-validator/apps
cp .env.example .env.local
# drop in your Flow ID + Lamatic credentials
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | What it is |
|---|---|
| `TRADE_FINANCE_VALIDATOR_FLOW_ID` | Your deployed flow ID from Studio |
| `LAMATIC_API_URL` | Your project's GraphQL endpoint |
| `LAMATIC_PROJECT_ID` | Your Lamatic project ID |
| `LAMATIC_API_KEY` | Your Lamatic API key |

Never commit `.env.local` — it's already gitignored, keep it that way.

## Stack

- Flow: Lamatic Studio (LLM nodes + a code node for merging output)
- Frontend: Next.js 15, TypeScript, Tailwind
- File parsing: `pdf-parse` for PDFs, `mammoth` for `.docx`, both run server-side via a Next.js server action
- Talks to Lamatic through the `lamatic` npm SDK

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Ftrade-finance-validator%2Fapps&env=TRADE_FINANCE_VALIDATOR_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY)

## Author

Built by Sivaprasad, drawing on real experience in credit and CCLM workflows — this is the review I wished existed back then.
