# Document Tamper Detector

## Overview
This project provides a fast, low-cost way to sanity-check whether a document has been digitally altered. It is built as a Lamatic.ai flow with a Next.js web UI and targets non-expert users — freelancers verifying invoices, HR teams validating offer letters, and landlords checking income proof — who need a first-pass triage signal without expensive forensic software.

The agent runs four tiered detection signals and combines them into a structured **trust report** with:
- An overall **risk score** (0–100)
- A list of **flagged regions** with plain-language explanations
- Per-signal confidence scores
- A clear disclaimer that this is a triage tool, not a forensic verdict

---

## Problem Statement

Freelancers, HR teams, and landlords receive documents (invoices, offer letters, ID/income proof) and have no fast, low-cost way to sanity-check whether a document has been digitally altered. Existing tools either:
- Only extract/summarise document content (no verification)
- Require expensive forensic software and specialist expertise

---

## How It Works

The Lamatic flow runs four detection signals sequentially:

### Signal 1: Metadata Inspection (30% weight)
- **PDFs**: Extracts the `/Info` dictionary (creation date, modification date, producer, creator software)
- **Images**: Inspects EXIF headers for missing data or image-editing software references
- **Flags**: Missing metadata, modification date far after creation date, image editor as producer/creator on a "scanned" document

### Signal 2: OCR Font/Spacing Consistency (30% weight)
- Receives word-level bounding boxes with position and height data
- Computes mean and standard deviation of font heights and inter-word gaps across the document
- Flags statistical outliers (>2.5σ) — a classic sign of copy-pasted or edited text

### Signal 3: Error Level Analysis / Compression Structure (25% weight)
- For JPEGs: inspects quantisation table count, restart marker density, and header format conflicts
- For PNGs: checks chunk ordering and count for signs of region-level editing
- Skipped gracefully for PDFs (weight redistributed to other signals)

### Signal 4: VLM Visual Anomaly Assessment (15% weight)
- Only runs on regions already flagged by Signals 1–3 (controls cost and latency)
- Uses a vision-capable LLM (GPT-4o by default) to visually assess whether a flagged region looks edited
- Returns per-region confidence scores and plain-language explanations

### Report Assembly
All signals are combined with the weights above. The final trust report includes:
```json
{
  "risk_score": 42,
  "verdict": "Moderate risk — review flagged regions before trusting this document",
  "verdict_color": "amber",
  "flags": [
    {
      "region": "Document metadata — software",
      "signal": "metadata",
      "confidence": 0.72,
      "explanation": "This document's metadata shows it was created or edited with Photoshop — an image editing application. Legitimate invoices are typically produced by document management software, not image editors."
    }
  ],
  "disclaimer": "This is an automated first-pass triage tool, not a legal or forensic verdict..."
}
```

---

## Setup Instructions

### Prerequisites
- [Lamatic account](https://lamatic.ai) with a deployed flow
- Node.js 18+
- A vision-capable LLM configured in Lamatic (e.g. GPT-4o, Claude 3.5 Sonnet)

### Step 1: Build the Flow in Lamatic Studio

1. Sign in at [studio.lamatic.ai](https://studio.lamatic.ai)
2. Create a new project and flow
3. Add nodes in this order:
   - **API Request** (trigger) — inputs: `fileBase64`, `fileName`, `fileType`, `ocrBoxes`
   - **Code Node: Metadata Inspector** — paste code from `scripts/document-tamper-detector_metadata-inspector.ts`
   - **Code Node: OCR Analyzer** — paste code from `scripts/document-tamper-detector_ocr-analyzer.ts`
   - **Code Node: ELA Analyzer** — paste code from `scripts/document-tamper-detector_ela-analyzer.ts`
   - **LLM Node: VLM Assessor** — use prompts from `prompts/`, model config from `model-configs/`
   - **Code Node: Report Assembler** — paste code from `scripts/document-tamper-detector_report-assembler.ts`
   - **API Response** — output: `{ "trustReport": "{{codeNode_report.output}}" }`
4. Deploy the flow and copy the **Flow ID**

### Step 2: Set Up the Next.js App

```bash
cd kits/document-tamper-detector/apps
cp .env.example .env.local
```

Edit `.env.local`:
```
DOCUMENT_TAMPER_DETECTOR_FLOW_ID=your-flow-id-from-step-1
LAMATIC_API_URL=https://your-project.lamatic.ai
LAMATIC_PROJECT_ID=your-project-id
LAMATIC_API_KEY=your-api-key
```

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — upload a document and get your trust report.

### Step 3: Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Taukeer1256/AgentKit&root-directory=kits%2Fdocument-tamper-detector%2Fapps&env=DOCUMENT_TAMPER_DETECTOR_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY)

---

## Example Input / Output

### Input (API trigger payload)
```json
{
  "fileBase64": "data:application/pdf;base64,JVBERi0x...",
  "fileName": "invoice_march_2025.pdf",
  "fileType": "application/pdf",
  "ocrBoxes": []
}
```

### Output (trust report)
```json
{
  "risk_score": 46,
  "verdict": "Moderate risk — review flagged regions before trusting this document.",
  "verdict_color": "amber",
  "flags": [
    {
      "region": "Document metadata — software mismatch",
      "signal": "metadata",
      "confidence": 0.82,
      "explanation": "The document claims to have been scanned but was then processed through Adobe Photoshop. This combination — scan then image edit — is a classic workflow for altering scanned documents."
    },
    {
      "region": "Document metadata — timestamps",
      "signal": "metadata",
      "confidence": 0.61,
      "explanation": "This document was last modified 14 day(s) after it was created. For an invoice, modifications after the original creation date can suggest the content was changed after it was first produced."
    }
  ],
  "signal_breakdown": {
    "metadata": { "flags": 2, "score_contribution": 46 },
    "font_spacing": { "flags": 0, "score_contribution": 0 },
    "ela": { "flags": 0, "score_contribution": 0 },
    "vlm": { "flags": 0, "score_contribution": 0 }
  },
  "document_info": {
    "file_name": "invoice_march_2025.pdf",
    "file_type": "application/pdf",
    "analyzed_at": "2026-09-02T13:47:00.000Z"
  },
  "disclaimer": "This is an automated first-pass triage tool, not a legal or forensic verdict..."
}
```

---

## File Structure

```
kits/document-tamper-detector/
├── lamatic.config.ts             # Kit metadata
├── agent.md                      # Agent identity & capability doc
├── README.md                     # This file
├── .gitignore
│
├── flows/
│   └── document-tamper-detector.ts   # Lamatic flow definition
│
├── constitutions/
│   └── default.md                # Agent safety rules
│
├── prompts/
│   ├── document-tamper-detector_vlm-assessor_system.md
│   └── document-tamper-detector_vlm-assessor_user.md
│
├── scripts/
│   ├── document-tamper-detector_metadata-inspector.ts
│   ├── document-tamper-detector_ocr-analyzer.ts
│   ├── document-tamper-detector_ela-analyzer.ts
│   └── document-tamper-detector_report-assembler.ts
│
├── model-configs/
│   └── document-tamper-detector_vlm-assessor.ts
│
├── assets/
│   └── README.md                 # Test document guidance
│
└── apps/
    ├── package.json
    ├── .env.example
    ├── next.config.mjs
    ├── tsconfig.json
    ├── orchestrate.js
    ├── actions/orchestrate.ts    # Server action → Lamatic flow call
    ├── lib/lamatic-client.ts     # Lamatic SDK client
    └── app/
        ├── layout.tsx
        ├── globals.css
        └── page.tsx              # Main UI
```

---

## Background

This project translates validated detection techniques from research into a lightweight, demoable Lamatic agent. The author previously fine-tuned a vision-language model for document forgery detection at 99.3% accuracy as part of research at IIIT Bhagalpur. This kit productises the same detection approach — metadata analysis, font consistency, ELA, and VLM assessment — as an accessible, open-source triage tool.

---

## Disclaimer

This is a first-pass triage tool. It is not a legal or forensic verdict. False positives and false negatives are possible. Consult a qualified document examiner for high-stakes decisions.
