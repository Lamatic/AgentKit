# Recreating the Lamatic flows

This directory contains four Lamatic flow definitions:

- `extract`, `verify`, and `report` are the three mandatory application stages.
- `parse-pdf` is optional and enables PDF upload. Pasted text works without it.

The `.ts` files describe the graph and reference the exact prompts and code in
the parent directories. This guide records the Studio settings that are easiest
to miss when rebuilding manually.

## Prerequisites

1. Create a Lamatic project.
2. Configure a Groq text-generation credential.
3. Select `groq/llama-3.3-70b-versatile` for both LLM nodes. The calls must be
   separate even though they use the same underlying model.
4. Use the lowest temperature exposed by the model settings.
5. Never copy another contributor's credential ID or commit an API key.

Node IDs such as `LLMNode_10` are the IDs used by the checked-in definitions.
Studio may generate different IDs. When rebuilding manually, insert variables
with Studio's variable picker so mappings use the IDs in your own graph.

## 1. Extract

Graph:

```text
API Request → Extract Fields → Parse JSON → API Response
```

### API Request

- Response type: Realtime
- Advanced schema:

```json
{
  "document": "string"
}
```

### Extract Fields

- Node type: Generate Text / LLM
- Model: `groq/llama-3.3-70b-versatile`
- Credential: your own Groq credential
- System prompt: `../prompts/extract_extract-fields_system.md`
- User prompt: `../prompts/extract_extract-fields_user.md`
- Tools, memory, messages, and attachments: none

### Parse JSON

- Node type: Code
- Code: `../scripts/extract_parse-json.ts`
- If Studio generated a different LLM node ID, replace the variable at the top
  of the script using the variable picker. It must reference the LLM node's
  `generatedResponse` value.

### API Response

Map the Parse JSON output—not the LLM output directly:

```json
{
  "extraction": "{{codeNode_20.output.extraction}}"
}
```

### Smoke test

```json
{
  "document": "INVOICE #A-2231\nFrom: Brightline Studios\nTotal Due: $1,240.00\nDue Date: 03/18/2026\nTerms: Net 30. A late fee of 1.5% per month applies after the due date."
}
```

The final output must contain an `extraction` object with exactly these keys:

```json
{
  "extraction": {
    "document_type": "INVOICE",
    "vendor_or_sender": "Brightline Studios",
    "total_amount": "$1,240.00",
    "due_date": "03/18/2026",
    "account_or_invoice_number": "#A-2231",
    "key_terms": ["Net 30", "1.5% per month"]
  }
}
```

Term selection can vary, but every non-null value must occur verbatim in the
document and `key_terms` must remain an array.

## 2. Verify

Graph:

```text
API Request → Verify Fields → API Response
```

Do not add a Parse JSON node. Lamatic's API Response node parses the model's JSON
array when `generatedResponse` is mapped as shown below.

### API Request

- Response type: Realtime
- Advanced schema:

```json
{
  "document": "string",
  "extraction": "string"
}
```

`extraction` is a JSON-stringified object, not a nested request object.

### Verify Fields

- Node type: Generate Text / LLM
- Model: `groq/llama-3.3-70b-versatile`
- Credential: your own Groq credential
- System prompt: `../prompts/verify_verify-fields_system.md`
- User prompt: `../prompts/verify_verify-fields_user.md`
- Tools, memory, messages, and attachments: none

### API Response

```json
{
  "verifications": "{{LLMNode_10.output.generatedResponse}}"
}
```

Use your own Verify Fields node ID if it differs.

### Positive smoke test

```json
{
  "document": "INVOICE #A-2231\nDue Date: 03/18/2026",
  "extraction": "{\"due_date\":\"03/18/2026\"}"
}
```

Expected: one `supported` verdict whose `value` is unchanged and whose
`source_quote` is an exact substring of the document.

### Negative smoke test

```json
{
  "document": "INVOICE #A-2231\nDue Date: 03/18/2026",
  "extraction": "{\"due_date\":\"03/15/2026\"}"
}
```

Expected: `unsupported`, confidence at or below `0.2`, an empty `source_quote`,
and a reason explaining that the extracted date is absent or contradictory.

Also test an array value and confirm Verify does not flatten it:

```json
{
  "document": "Terms: Net 30. A late fee of 1.5% per month applies.",
  "extraction": "{\"key_terms\":[\"Net 30\",\"1.5% per month\"]}"
}
```

## 3. Report

Graph:

```text
API Request → Route & Report → API Response
```

Report does not consume raw Verify output in the application pipeline. The app
first validates exact evidence, expands `key_terms`, and adds
`evidence_validated`; it then sends those processed verdicts to Report.

### API Request

- Response type: Realtime
- Advanced schema:

```json
{
  "verifications": "string"
}
```

### Route & Report

- Node type: Code
- Code: `../scripts/report_route.ts`
- If Studio generated a different trigger node ID, use the variable picker for
  `verifications` at the top of the script.

### API Response

```json
{
  "verified": "{{codeNode_20.output.verified}}",
  "needs_review": "{{codeNode_20.output.needs_review}}",
  "not_found": "{{codeNode_20.output.not_found}}",
  "report": "{{codeNode_20.output.report}}",
  "summary": "{{codeNode_20.output.summary}}"
}
```

The code node intentionally JSON-stringifies arrays and the summary because
Lamatic's API Response mapping handles those complex values reliably in that
form. API consumers receive arrays/objects after response parsing.

### Smoke test

Use the `meta.testInput.verifications` string in `report.ts`. Expected summary:

```json
{
  "total": 3,
  "verified_count": 1,
  "needs_review_count": 1,
  "not_found_count": 1
}
```

The three sample fields must land in `verified`, `needs_review`, and `not_found`
respectively.

## 4. Parse PDF (optional)

Graph:

```text
API Request → Extract from File → Collate PDF Pages → API Response
```

### API Request

- Response type: Realtime
- Advanced schema:

```json
{
  "fileUrl": "string"
}
```

### Extract from File

- Node type: Extract from File
- Operation: Extract from PDF (`extractFromPDF` in the flow definition)
- File URL: `{{triggerNode_1.output.fileUrl}}`
- Format: PDF
- Join Pages: On
- Password: empty string
- Encoding: UTF-8
- Maximum pages: `0` (no explicit limit)
- Base64 output: Off
- Trimming options: Off

Join Pages must have an explicit value. In the tested Lamatic deployment,
leaving it unset/off produced `Cannot read properties of undefined (reading
'toLowerCase')` during execution.

### Collate PDF Pages

- Node type: Code
- Code: `../scripts/parse-pdf_collate.ts`
- Use the variable picker if your Extract from File node ID differs.

The script accepts both an array of page strings and a single joined string. If
Lamatic supplies separate pages, each receives its own marker. If it supplies one
joined block, the text receives only `--- Page 1 ---`; do not claim page-level
attribution for later pages in that case. `page_count` uses Lamatic metadata when
available and otherwise reports the number of returned text blocks.

### API Response

```json
{
  "text": "{{codeNode_20.output.text}}",
  "page_count": "{{codeNode_20.output.page_count}}"
}
```

### Smoke test

```json
{
  "fileUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
}
```

Expected: nonempty `text` beginning with `--- Page 1 ---` and a positive
`page_count`. The URL must be a publicly reachable direct PDF URL; browser-local
`blob:` URLs, filesystem paths, and HTML preview pages will not work.

## Deploy and connect the app

1. Save and test every node.
2. Deploy `extract`, `verify`, and `report`.
3. Copy their Flow IDs into `apps/.env.local` as `DOC_EXTRACT_FLOW`,
   `DOC_VERIFY_FLOW`, and `DOC_REPORT_FLOW`.
4. For PDF upload, deploy `parse-pdf`, set `DOC_PARSE_PDF_FLOW`, and configure a
   Vercel Blob `BLOB_READ_WRITE_TOKEN`.
5. Add `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY`.
6. Restart the app after changing environment values.
7. Run `npm run check`, then `npm run dev` from `apps/`.

Never commit `.env.local`, Lamatic keys, Groq keys, Blob tokens, or credential
IDs. The checked-in model configs identify the tested provider/model but require
each recreator to select their own credential in Studio.
