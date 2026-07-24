# Self-Verifying Document Extractor — Agent Identity

## Overview
The Self-Verifying Document Extractor turns an everyday document — an invoice, bill, receipt, or short contract — into a structured, **trustworthy** set of fields. Unlike ordinary extractors that read a document and present results confidently whether or not they got them right, this agent treats extraction as two stages: pull the data, then independently prove each value against the original text before asserting it. Anything it cannot prove, it flags for human review rather than guessing.

## Purpose
A single misread number in a document has real consequences: a transposed digit in a due date can cost a late fee; a total that was never actually stated can trigger a wrong payment. Standard extraction tools have no notion of "I'm not sure about this one." This agent exists to add exactly that: a verification pass that grounds every extracted field to an exact span of the source text, scores its confidence, and routes unprovable fields into a clearly separated "Needs your review" bucket. It is an extractor that is honest about what it does not know.

## Flows

### 0. `parse-pdf` (Stage 0 — optional PDF ingestion)
- **Trigger:** API request with `fileUrl` (a short-lived public URL of an uploaded PDF).
- **Processing:** `extractFromFileNode` extracts PDF text with Join Pages explicitly enabled; a code node normalizes either joined or page-array output and adds `--- Page N ---` markers where the returned shape permits.
- **Response:** `{ text, page_count }`.
- **When to use:** Only when the input is a text-based PDF. The app uploads to Vercel Blob, calls this flow, deletes the blob, and feeds `text` into `extract`. Scanned/image PDFs are out of scope (they need OCR).
- **Dependencies:** `DOC_PARSE_PDF_FLOW`, `BLOB_READ_WRITE_TOKEN`. Optional — the pasted-text path works without them.

### 1. `extract` (Stage 1 — pull the data)
- **Trigger:** API request with a `document` string.
- **Processing:** An LLM reads the document and emits a fixed schema of verbatim fields (`document_type`, `vendor_or_sender`, `total_amount`, `due_date`, `account_or_invoice_number`, `key_terms[]`). A code node parses the JSON.
- **Response:** `{ extraction }`.
- **When to use:** The first, deliberately lean step. This is the ordinary confident extraction that the next flow scrutinises.
- **Dependencies:** A chat-capable LLM credential in Lamatic.

### 2. `verify` (Stage 2 — prove it, the core of the agent)
- **Trigger:** API request with the original `document` and the `extraction`.
- **Processing:** A **separate** LLM reasoning pass, adversarial by design. It must preserve every extracted value and JSON type while judging it. For each field it must locate an exact supporting span in the source; if it cannot, the field is downgraded. Application code then independently checks the quote and value verbatim before routing.
- **Response:** `{ verifications[] }` — each `{ field, value, verdict, confidence, source_quote, reason }`.
- **When to use:** Always, immediately after `extract`. This is what makes the agent different.
- **Dependencies:** A strong chat LLM credential; low temperature recommended.

### 3. `report` (Stage 3 — route and report)
- **Trigger:** API request with `verifications`.
- **Processing:** Deterministic code (no LLM). Sorts the evidence-checked verdicts into three buckets: evidence-validated → **Verified**; absent (null) values → **Not found**; everything else → **Needs your review**. The application recomputes the same routing and fails closed on disagreement. Before this stage the app expands `key_terms` into one grounded entry per term.
- **Response:** `{ verified[], needs_review[], not_found[], report, summary }`.
- **When to use:** Final step; makes the "flag it, don't guess" behaviour visible and model-independent.
- **Dependencies:** None beyond the platform.

## Guardrails
- **Prohibited:** Asserting any value that lacks an exact supporting quote in the source. Inferring, computing, or normalising a value and then presenting it as verified.
- **Input constraints:** Plain text of a single everyday document. Not designed for multi-document batches, scanned images without OCR text, or adversarial instruction-injection (document text is treated as data, never commands).
- **Output constraints:** Three clearly separated buckets (Verified / Needs your review / Not found) plus structured JSON. Confidence scores are advisory, not guarantees. Exact substring and value-identity checks determine whether a field can be asserted.
- **Operational limits:** Verification quality depends on the source text being present and legible; if the document omits a value, the agent reports it as absent rather than inventing one.

## Integration Reference
| Service | Used by | Purpose | Credential |
|---|---|---|---|
| Groq (`llama-3.3-70b-versatile`) | `extract`, `verify` | Tested model for field extraction and adversarial grounding | User-supplied Groq credential configured in Lamatic Studio |
| Lamatic execution API | App | Runs the three deployed flows via the SDK | `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_URL` |

## Environment Setup
| Variable | Source | Purpose |
|---|---|---|
| `DOC_EXTRACT_FLOW` | Flow ID of the deployed `extract` flow | Stage 1 |
| `DOC_VERIFY_FLOW` | Flow ID of the deployed `verify` flow | Stage 2 |
| `DOC_REPORT_FLOW` | Flow ID of the deployed `report` flow | Stage 3 |
| `LAMATIC_API_URL` | Settings → API Docs → Endpoint | SDK endpoint |
| `LAMATIC_PROJECT_ID` | Settings → Project → Project ID | Project scope |
| `LAMATIC_API_KEY` | Settings → API Keys | Authentication |
| `DOC_PARSE_PDF_FLOW` | Flow ID of the deployed `parse-pdf` flow | Stage 0 (optional — PDF upload) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob → Storage → token | Short-lived PDF storage (optional) |

## Quickstart
1. Follow `flows/README.md` to recreate the three core flows (`extract`, `verify`, `report`) and optional `parse-pdf` flow with the referenced prompts, model configs, and scripts.
2. Deploy all three and copy each Flow ID.
3. `cd apps && cp .env.example .env.local`, then fill in the three flow IDs and your Lamatic API credentials.
4. With Node.js 20.9 or newer, run `npm install && npm run check && npm run dev`.
5. Open the app, click **Load sample invoice**, then **Extract & Verify**. For the deliberate negative test, use `03/15/2026` as the extracted date in Verify while the document says `03/18/2026`.

## Common Failure Modes
| Symptom | Cause | Fix |
|---|---|---|
| "All Workflow IDs … are not set" | Missing flow IDs in `.env.local` | Add `DOC_EXTRACT_FLOW`, `DOC_VERIFY_FLOW`, `DOC_REPORT_FLOW` |
| Empty or malformed verification list | `verify` returned invalid JSON | Ensure Verify returns only a JSON array and maps `generatedResponse` directly to `verifications` |
| "Verify flow changed the extracted value" | Verify normalized or flattened a value | Update the Verify system prompt and preserve strings/arrays exactly |
| Everything lands in "Needs your review" | Verifier can't match reformatted values | Expected behaviour — the source and extracted forms must match; downgrade is intentional |
| Auth error | Bad `LAMATIC_API_KEY` | Regenerate in Settings → API Keys |
| Parse PDF throws `toLowerCase` on undefined | Join Pages was not explicitly configured | Turn Join Pages on, save the Extract from File node, and retest |
