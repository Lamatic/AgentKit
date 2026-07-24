# Self-Verifying Document Extractor — App

Next.js app that drives the Lamatic flows (`extract` → `verify` → `report`, plus an optional `parse-pdf` Stage 0) and renders the result as three columns: **Verified**, **Needs your review**, and **Not found**. Between Verify and Report it runs deterministic evidence checks, and it fails closed when a flow returns malformed, incomplete, or inconsistent data.

## Setup

Recreate and smoke-test the Lamatic graphs using [`../flows/README.md`](../flows/README.md) before configuring their Flow IDs.

```bash
cp .env.example .env.local     # fill in the 3 core flow IDs + LAMATIC_* credentials
npm install
npm run dev                    # http://localhost:3000
```

Node.js 20.9 or newer is required. Use `npm run check` to run linting, type checking, unit tests, and a production build.

## Environment variables

| Variable | Purpose |
|---|---|
| `DOC_EXTRACT_FLOW` | Flow ID of the deployed `extract` flow |
| `DOC_VERIFY_FLOW` | Flow ID of the deployed `verify` flow |
| `DOC_REPORT_FLOW` | Flow ID of the deployed `report` flow |
| `LAMATIC_API_URL` | Lamatic API endpoint |
| `LAMATIC_PROJECT_ID` | Lamatic project ID |
| `LAMATIC_API_KEY` | Lamatic API key |
| `DOC_PARSE_PDF_FLOW` | *Optional* — Flow ID of the deployed `parse-pdf` flow (enables PDF upload) |
| `BLOB_READ_WRITE_TOKEN` | *Optional* — Vercel Blob token for short-lived PDF storage |

The three `DOC_*` core flow IDs and the `LAMATIC_*` credentials are required. The last two are optional; without them the app runs on pasted text and the **Upload PDF** control reports "not configured."

## How it wires together

- `orchestrate.js` — maps each pipeline step to its env-provided Flow ID and holds the API config.
- `lib/lamatic-client.ts` — instantiates the Lamatic SDK client from that config.
- `lib/environment.ts` — rejects missing, placeholder, or malformed server-side configuration.
- `actions/orchestrate.ts` — the `runPipeline` server action: validates input, optionally simulates an extraction error, calls each flow with a timeout, enforces contracts, and reports the failing stage.
- `lib/pipeline.ts` — validates schemas, runs the exact-evidence gate, splits `key_terms` and grounds each item, computes authoritative three-bucket routing, attributes verified fields to a page, and checks the Report flow agrees.
- `lib/pdf.ts` — validates uploads by extension, MIME type, size, and the `%PDF-` signature.
- `app/api/parse-pdf/route.ts` — validates a PDF, uploads it to short-lived Vercel Blob storage, calls the `parse-pdf` flow, and deletes the blob in a `finally`.
- `app/page.tsx` — accessible text-input + PDF upload UI, a "simulate extraction error" toggle, and the three-column results with structured JSON output.

The app accepts one plain-text document up to 50,000 characters, or a text-based PDF (single-page attribution is exact; scanned/image PDFs need OCR and are out of scope).

Do not commit `.env.local`. If an API key is ever copied into a tracked example or shared output, revoke it and generate a new one.
