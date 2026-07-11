# Self-Verifying Document Extractor

> An extractor that's honest about what it isn't sure of.

Pull the key details out of everyday documents — invoices, bills, receipts, contracts — then **independently verify each detail against the source text** and flag anything it cannot confirm. Model verdicts are checked again in deterministic application code before a field can be shown as verified.

![type: kit](https://img.shields.io/badge/type-kit-1d76db) ![flows: 4](https://img.shields.io/badge/flows-4-0e8a16)

---

## The problem

Everyone deals with documents where a misread number has real consequences — an invoice due date, an amount owed, an account number, a contract term. Ordinary extraction tools read these and present the results **confidently, whether or not they got them right.** A single transposed digit in a due date or a total can cost you a late fee or a wrong payment.

This agent treats extraction as two stages: **pull the data, then prove each value against the original text before asserting it.** Anything it can't prove, it flags for you to check rather than guessing.

## How it works — 3 core flows (+ optional PDF)

```
document ─▶ [1] extract ─▶ [2] verify ─▶ [app evidence gate] ─▶ [3] report ─▶ Verified ✓
             (LLM)          (LLM)          (exact code checks +      (code)     Needs review ⚠
                                            key_terms split)                     Not found 🔍
```

| Flow | Type | What it does |
|---|---|---|
| **`extract`** | LLM | Pulls a fixed schema of fields (`document_type`, `vendor_or_sender`, `total_amount`, `due_date`, `account_or_invoice_number`, `key_terms[]`). This is the ordinary confident pass — kept deliberately lean. |
| **`verify`** | LLM (separate reasoning pass) | **The core.** For each field it must find an exact supporting span in the source. It's forbidden from inferring, calculating, or reasoning toward a value — only direct textual support counts. Emits a verdict (`supported` / `ambiguous` / `unsupported`), a confidence score, and the grounding `source_quote`. |
| **Application evidence gate** | TypeScript (deterministic) | Rejects malformed/incomplete flow output, confirms every quote is an exact source substring, confirms every value occurs verbatim inside its quote, and downgrades failures. It also checks that the verifier did not rewrite extracted values. |
| **`report`** | Code (deterministic) | Sorts the evidence-checked verdicts into three buckets — **Verified**, **Needs your review**, **Not found** — and renders the report. The app independently recomputes the same routing and asserts the flow agrees, so the two can never silently diverge. |

Between Verify and Report, the app also **expands `key_terms` into one entry per term** and grounds each independently, so a real term verifies even when it sits far from the others in the document, and a single hallucinated term is flagged on its own instead of dragging the real ones into review.

### Optional: PDF upload (Stage 0)
A fourth, optional flow — **`parse-pdf`** — extracts text from a **text-based PDF** and returns it with `--- Page N ---` markers. The app uploads the file to short-lived Vercel Blob storage, calls the flow, deletes the blob, and feeds the extracted text into the same pipeline. Because the page markers travel in the text, each verified field is attributed to a **page** (`source_page`) with no change to the verify contract. (The file node runs with *Join Pages* enabled for Lamatic deploy compatibility, so page attribution is exact for single-page documents and collapses to page 1 for multi-page PDFs.) Uploads are validated by extension, MIME type, size (≤ 10 MB), and the actual `%PDF-` file signature. Scanned/image PDFs are intentionally out of scope — an OCR misread can't be caught by comparing against the same corrupted OCR text.

### Why a separate verify flow?
Running verification as its own reasoning pass — with the original document *and* the extraction as inputs — lets it **genuinely disagree** with the extractor instead of rubber-stamping it. The code-level gate matters because an LLM can still return an overconfident verdict or a reconstructed quote. Confidence is advisory; exact evidence is mandatory.

## Output — three buckets

- **Verified** — fields confirmed against a specific span of the source, each with the supporting quote and a confidence score.
- **Needs your review** — fields it extracted but couldn't confirm (found something, but the exact evidence check failed), each with the reason it was flagged.
- **Not found** — fields the extractor didn't find at all (no value present in the document), kept separate from "found but unproven."
- **Structured JSON** of the whole result for downstream use.

## Try it

- **Load sample invoice** or **Load financial statement**, then **Extract & Verify** to run the complete deployed pipeline.
- Tick **Simulate an extraction error** before running: the app deterministically corrupts one extracted value (a single-digit misread — e.g. the invoice due date `03/18/2026` → `03/15/2026`), shows you exactly what it changed, and you watch the verifier catch it and route it to **Needs your review**. Nothing pretends the model naturally erred — the corruption is explicit and honest.

## Run locally

Follow the exact node settings and smoke tests in [`flows/README.md`](flows/README.md).

```bash
# 1. Follow flows/README.md to recreate and deploy the three core flows.
#    Recreate parse-pdf too if you want PDF upload.
cd apps
cp .env.example .env.local          # fill in the 3 flow IDs + your LAMATIC_* credentials
npm install
npm run dev                         # http://localhost:3000
```

Use Node.js 20.9 or newer. Run `npm run check` before submitting; it runs linting, type checking, unit tests, and a production build.

### Environment variables (`apps/.env.local`)

| Variable | Where to find it |
|---|---|
| `DOC_EXTRACT_FLOW` | Flow ID of the deployed `extract` flow |
| `DOC_VERIFY_FLOW` | Flow ID of the deployed `verify` flow |
| `DOC_REPORT_FLOW` | Flow ID of the deployed `report` flow |
| `LAMATIC_API_URL` | Settings → API Docs → Endpoint |
| `LAMATIC_PROJECT_ID` | Settings → Project → Project ID |
| `LAMATIC_API_KEY` | Settings → API Keys |
| `DOC_PARSE_PDF_FLOW` | *Optional* — Flow ID of the deployed `parse-pdf` flow (enables PDF upload) |
| `BLOB_READ_WRITE_TOKEN` | *Optional* — Vercel Blob token for short-lived PDF storage |

> The three `DOC_*` core flow IDs and the `LAMATIC_*` credentials are required. `DOC_PARSE_PDF_FLOW` + `BLOB_READ_WRITE_TOKEN` are optional; without them the app still runs on pasted text and the **Upload PDF** control returns a clear "not configured" message. On Vercel's serverless functions the practical request-body cap is ~4.5 MB; for larger PDFs, switch the upload route to a client-direct Blob upload.

## Structure

```
self-verifying-extractor/
├── lamatic.config.ts              # kit metadata (3 mandatory app steps)
├── agent.md                       # agent identity + capability doc
├── constitutions/default.md       # guardrails — the grounding rule lives here
├── flows/
│   ├── README.md                  # exact Studio recreation and smoke-test guide
│   ├── parse-pdf.ts               # Stage 0 graph (optional — PDF → text w/ page markers)
│   ├── extract.ts                 # Stage 1 graph
│   ├── verify.ts                  # Stage 2 graph (the core)
│   └── report.ts                  # Stage 3 graph (deterministic routing)
├── prompts/                       # externalized LLM prompts (@referenced)
├── model-configs/                 # externalized model settings (@referenced)
├── scripts/                       # externalized code-node bodies (@referenced)
├── assets/                        # demo documents
└── apps/                          # runnable Next.js app
    ├── orchestrate.js             # flow config bridge (step → env flow ID)
    ├── actions/orchestrate.ts     # strict extract → verify → report orchestration
    ├── app/api/parse-pdf/route.ts # validate → blob upload → parse-pdf → delete blob
    ├── lib/pipeline.ts            # schemas, exact-evidence gate, page attribution, routing checks
    ├── lib/pdf.ts                 # PDF validation (extension/MIME/size/%PDF- signature)
    ├── lib/lamatic-client.ts      # Lamatic SDK client
    └── app/page.tsx               # three-column UI + simulate-error toggle + PDF upload
```

## Not designed for

- Multi-document batches in one request (extend the flows to batch explicitly).
- Scanned / image-only PDFs — they need OCR, and an OCR misread can't be caught by comparing against the same corrupted OCR text. Text-based PDFs only.
- Documents over 50,000 characters.
- Treating document contents as instructions — embedded text is data to extract, never commands to follow.

## Security

Never commit `.env.local` or paste a real API key into `.env.example`. If a key is exposed in a file, terminal transcript, commit, or screenshot, revoke it in Lamatic and create a replacement.

---

Built on [Lamatic](https://lamatic.ai) for the AgentKit Challenge.
