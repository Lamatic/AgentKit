/*
 * # Parse PDF
 * Optional Stage 0 of the Self-Verifying Document Extractor. Converts a
 * text-based PDF (reachable at a public URL) into canonical plain text with
 * explicit page markers, which the app then feeds into the same
 * extract → verify → report pipeline used for pasted text. Because the page
 * markers travel inside the text, the app can deterministically attribute each
 * verified field to a page (`source_page`) without changing the verify contract.
 * (The file node runs with joinPages enabled for Lamatic deploy compatibility,
 * so multi-page PDFs are attributed to page 1; single-page documents are exact.)
 *
 * Text-based PDFs only. Scanned/image PDFs require OCR, and an OCR misread cannot
 * be caught by comparing against the same corrupted OCR text — so they are out of
 * scope by design.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `fileUrl` | `string` | Yes | Public, short-lived URL of the uploaded PDF. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `text` | `string` | Canonical extracted text with `--- Page N ---` markers. |
 * | `page_count` | `number` | PDF page count when Lamatic supplies it; otherwise the number of returned text blocks. |
 *
 * ## Node Walkthrough
 * 1. `API Request` (graphqlNode) — trigger; supplies `fileUrl`.
 * 2. `Extract from File` (extractFromFileNode) — extracts joined or page-level text from the PDF.
 * 3. `Collate PDF Pages` (codeNode) — normalizes the returned shape and adds page markers where possible.
 * 4. `API Response` (graphqlResponseNode) — returns `text` and `page_count`.
 */

// Flow: parse-pdf

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Parse PDF",
  "description":
    "Stage 0 (optional) — extracts text from a text-based PDF and returns canonical text with page markers for the extract/verify/report pipeline.",
  "tags": ["pdf", "extraction", "documents"],
  "testInput": {
    "fileUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": { "name": "Krishhiv Mehra", "email": "krishhiv@gmail.com" },
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md",
  },
  "scripts": {
    "parse_pdf_collate": "@scripts/parse-pdf_collate.ts",
  },
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"fileUrl\": \"string\"\n}",
      },
    },
  },
  {
    "id": "extractFromFileNode_10",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "extractFromFileNode",
      "values": {
        "nodeName": "Extract from File",
        "operation": "extractFromPDF",
        "format": "pdf",
        "fileUrl": "{{triggerNode_1.output.fileUrl}}",
        // joinPages must be true — with it disabled Lamatic's Edge deploy step
        // fails ("Cannot read properties of undefined (reading 'toLowerCase')").
        // Consequence: the extractor returns the document as one joined text
        // block, so page attribution collapses to page 1 (fine for single-page
        // documents; multi-page PDFs are attributed to p.1).
        "joinPages": true,
        "returnRawText": false,
        "encoding": "utf8",
        "maxPages": "0",
        "password": "",
        "trim": false,
        "ltrim": false,
        "rtrim": false,
        "ignoreEmpty": false,
        "encodeAsBase64": false,
      },
    },
  },
  {
    "id": "codeNode_20",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Collate PDF Pages",
        "code": "@scripts/parse-pdf_collate.ts",
      },
    },
  },
  {
    "id": "graphqlResponseNode_30",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping":
          "{\n  \"text\": \"{{codeNode_20.output.text}}\",\n  \"page_count\": \"{{codeNode_20.output.page_count}}\"\n}",
      },
    },
  },
];

export const edges = [
  {
    "id": "triggerNode_1-extractFromFileNode_10",
    "source": "triggerNode_1",
    "target": "extractFromFileNode_10",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "extractFromFileNode_10-codeNode_20",
    "source": "extractFromFileNode_10",
    "target": "codeNode_20",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "codeNode_20-graphqlResponseNode_30",
    "source": "codeNode_20",
    "target": "graphqlResponseNode_30",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "response-graphqlResponseNode_30",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_30",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge",
  },
];

export default { meta, inputs, references, nodes, edges };
