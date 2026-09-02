# Document Tamper Detector

## Overview
The Document Tamper Detector is an AI forensics triage agent built on Lamatic.ai. Its purpose is to detect signs of digital tampering in uploaded PDF and image documents, returning a structured trust report suitable for non-expert users (freelancers, HR professionals, landlords) who need a fast first-pass sanity check on documents they receive.

The agent orchestrates four sequential detection signals — metadata inspection, OCR font/spacing analysis, ELA/compression structure analysis, and a VLM visual anomaly pass — combining them into a weighted risk score with per-flag plain-language explanations. It is intentionally positioned as a triage tool: it is fast, low-cost, and actionable, but always defers to specialist review for high-stakes decisions.

---

## Purpose
After the agent runs, the caller has:
- A **risk score** from 0–100 representing a heuristic tamper risk score
- A **verdict** string categorising the risk level
- A list of **flags** — each with a specific region, detection signal type, confidence score, and a plain-language explanation that any non-expert can understand
- A **standard disclaimer** making clear this is not a legal finding

Operationally, the system is designed to reduce the attack surface of document-based fraud at the intake stage of any workflow — freelancer invoice submission, HR candidate screening, tenant income verification — without requiring specialist tools or expertise.

---

## Flows

### `Document Tamper Detector`

- **Flow ID / Env key mapping:** `document-tamper-detector` (configured via `DOCUMENT_TAMPER_DETECTOR_FLOW_ID`)

#### Trigger
- **Invocation type:** API request via GraphQL trigger node (`API Request`)
- **Expected input shape:**
  - `fileBase64` (string): Base64-encoded document content (with or without data URL prefix)
  - `fileName` (string): Original filename (e.g. `invoice_march.pdf`)
  - `fileType` (string): MIME type — `application/pdf`, `image/jpeg`, or `image/png`
  - `ocrBoxes` (array, optional): Pre-computed OCR bounding boxes; enables Signal 2 (font/spacing)

#### What It Does

Step-by-step node walkthrough:

**1. API Request (`graphqlNode` trigger)**
- Receives the API payload from the caller (Next.js UI or any backend)
- Exposes `fileBase64`, `fileName`, `fileType`, and `ocrBoxes` to downstream nodes
- Configured for realtime response (synchronous execution)

**2. Metadata Inspector (`codeNode`)**
- Executes `@scripts/document-tamper-detector_metadata-inspector.ts`
- For PDFs: parses the `/Info` dictionary to extract `CreationDate`, `ModDate`, `Producer`, `Creator`
- For images: inspects JPEG EXIF markers and JFIF/Exif header coexistence
- Flags:
  - Missing metadata entirely (confidence ~0.55)
  - Modification date significantly after creation date (confidence scales with delta)
  - Image editing software in Producer/Creator field (confidence ~0.72)
  - Scanner as Creator + image editor as Producer (confidence ~0.82)
- Output: `{ flags[], confidence, summary, metadata_extracted }`

**3. OCR Font Analyzer (`codeNode`)**
- Executes `@scripts/document-tamper-detector_ocr-analyzer.ts`
- Receives optional `ocrBoxes[]` from the trigger payload (word-level bounding boxes)
- Computes global mean and standard deviation of word heights and inter-word gaps
- Flags words with height z-score > 2.5σ and gap z-scores > 2.8σ
- Skipped gracefully when no bounding boxes are provided
- Output: `{ flags[], confidence, summary, words_analyzed, flagged_regions_description }`

**4. ELA Analyzer (`codeNode`)**
- Executes `@scripts/document-tamper-detector_ela-analyzer.ts`
- For JPEGs: inspects quantisation table count, restart marker density, and JFIF+Exif coexistence
- For PNGs: checks chunk ordering and IDAT count for region-level stitching indicators
- Skipped gracefully for PDFs (returns `skipped: true`)
- Output: `{ flags[], confidence, summary, skipped, flagged_regions_description }`

**5. VLM Anomaly Assessor (`LLMNode`)**
- Uses a vision-capable LLM configured via `@model-configs/document-tamper-detector_vlm-assessor.ts`
- System prompt: `@prompts/document-tamper-detector_vlm-assessor_system.md`
- User prompt: `@prompts/document-tamper-detector_vlm-assessor_user.md`
- Receives the flagged region descriptions from Signals 1–3 and the original document image
- Assesses each flagged region for visual anomalies (font inconsistency, pixel artifacts, copy-paste indicators, anti-aliasing differences)
- Returns JSON: `{ vlm_flags[], overall_vlm_confidence, vlm_notes }`
- Only runs on pre-flagged regions — this controls cost and latency

**6. Report Assembler (`codeNode`)**
- Executes `@scripts/document-tamper-detector_report-assembler.ts`
- Collects flags from all upstream nodes
- Computes a per-signal score (0–100) from flag confidence averages, boosted by flag count
- Applies weighted combination: metadata 30%, OCR 30%, ELA 25%, VLM 15%
- If ELA is skipped (PDF), redistributes its weight to metadata (50%), OCR (30%), VLM (20%)
- Computes a heuristic tamper risk score (`risk_score`), `verdict`, `verdict_color`, and appends the standard disclaimer
- Output: full `TrustReport` object

**7. API Response (`graphqlResponseNode`)**
- Maps the report assembler output to `{ "trustReport": "{{codeNode_report.output}}" }`
- Returns the complete trust report to the caller

---

## Inputs

| Field | Type | Required | Description |
|---|---|---|---|
| `fileBase64` | `string` | Yes | Base64-encoded document (with or without data URL prefix) |
| `fileName` | `string` | Yes | Original filename for display and type inference |
| `fileType` | `string` | Yes | MIME type: `application/pdf`, `image/jpeg`, or `image/png` |
| `ocrBoxes` | `array` | No | Word-level bounding boxes from pytesseract or similar — enables Signal 2 |

## Outputs

| Field | Type | Description |
|---|---|---|
| `trustReport.risk_score` | `number` | 0–100 composite tamper risk score |
| `trustReport.verdict` | `string` | Plain-language verdict |
| `trustReport.verdict_color` | `"green" \| "amber" \| "orange" \| "red"` | Risk level colour |
| `trustReport.flags` | `Flag[]` | Array of detected anomalies with region, signal, confidence, explanation |
| `trustReport.signal_breakdown` | `object` | Per-signal flag count and score contribution |
| `trustReport.document_info` | `object` | File name, type, and analysis timestamp |
| `trustReport.disclaimer` | `string` | Standard triage disclaimer |

---

## Dependencies

### External Services
- **Lamatic API runtime** — hosts and executes the flow — requires `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`
- **Vision-capable LLM** — for the VLM Assessor node — requires a GPT-4o or equivalent provider configured in Lamatic Studio

### Environment Variables
| Variable | Purpose |
|---|---|
| `DOCUMENT_TAMPER_DETECTOR_FLOW_ID` | Deployed flow ID — used by the Next.js app to invoke the flow |
| `LAMATIC_API_URL` | Base URL for Lamatic API |
| `LAMATIC_PROJECT_ID` | Lamatic project scoping |
| `LAMATIC_API_KEY` | Authentication for Lamatic API |

---

## Risk Score Thresholds

| Range | Verdict | Color |
|---|---|---|
| 0–25 | Low risk — no major anomalies detected | Green |
| 26–55 | Moderate risk — review flagged regions before trusting | Amber |
| 56–80 | High risk — multiple anomalies, recommend specialist review | Orange |
| 81–100 | Critical risk — do not rely without forensic verification | Red |

---

## Error Scenarios

| Symptom | Likely Cause | Fix |
|---|---|---|
| Risk score is always 0 | No signals raised | Verify `fileBase64` is a valid document and `fileType` is correct |
| VLM flags never appear | Vision LLM not configured or quota exceeded | Configure a vision-capable model in Lamatic Studio for the VLM Assessor node |
| OCR flags never appear | `ocrBoxes` not provided | Include bounding boxes from a pre-processing pytesseract step in the payload |
| Flow times out | Large document + VLM latency | Use smaller documents or increase flow timeout in Lamatic Studio |
| `No trust report returned` | Flow response mapping mismatch | Ensure the API Response node maps `trustReport` to `{{codeNode_report.output}}` |
| Metadata Inspector always returns 0 flags | File is a clean document or metadata is valid | Expected behaviour — low-risk genuine documents should score low |

---

## Notes
- ELA (Signal 3) is an image-specific technique and is gracefully skipped for PDFs. Its score weight is automatically redistributed to the remaining signals.
- Signal 2 (OCR) requires word-level bounding boxes in the payload. For a production deployment, add a pytesseract pre-processing step or a Lamatic OCR node upstream that populates `ocrBoxes`.
- The VLM node only assesses regions already flagged by earlier signals, not the whole document. This is intentional — it controls cost/latency while adding confidence to confirmed anomalies.
- All flag explanations are explicitly written for non-expert users. Technical jargon is confined to the `raw_detail` fields in the script outputs, which are not surfaced in the UI.
