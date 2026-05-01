# Forge

## Overview
Forge is an AI-powered document generation agent specifically engineered for cross-border freelancers. It addresses the massive legal and financial gap faced by independent contractors who often operate without formal services agreements due to high legal fees and jurisdictional complexity. 

Forge uses a multi-flow guided wizard architecture (4 distinct Lamatic flows) to automate the entire onboarding-to-billing lifecycle. It doesn't just "fill templates"; it performs AI-calibrated market analysis for pricing, evaluates international jurisdictional tradeoffs for governing law selection, and synthesizes complete, legally-structured 13-section contracts and matching invoices. The system is designed to be session-based and stateless, utilizing local storage for temporary persistence and Lamatic AgentKit flows for the core intelligence.

---

## Purpose
Forge exists to democratize access to professional legal and financial documentation for the global freelance economy. Many freelancers, particularly in emerging markets, price their services based on intuition and work without the protection of a governing law clause. Forge solves this by providing:

1. **Market Calibration**: An AI flow that suggests rates based on global market data, freelancer location, and deliverables.
2. **Jurisdictional Risk Mitigation**: A tradeoff analysis flow that helps freelancers choose between their local law, the client's law, or a neutral third jurisdiction (like Delaware or England & Wales).
3. **Execution Ready Documents**: High-fidelity, signed, and exportable PDFs that would otherwise cost thousands of dollars in legal fees.

By the end of a Forge session, a freelancer has a professional contract and a matching invoice, significantly reducing the risk of payment disputes and scope creep.

---

## Flows

### `Forge - Pricing Analysis`

- **Trigger**
  - Invoked via a GraphQL request when the user completes Step 1 (Project Details).
- **What it does**
  1. Receives data about the work type, field, deliverables, and both parties' countries.
  2. Analyzes the freelancer's experience level and geography against global market benchmarks.
  3. Returns a structured pricing breakdown with market context and justifications for each rate.
- **When to use this flow**
  - To provide the user with data-driven confidence in their pricing before generating a contract.
- **Output**
  - A JSON object containing `experience_assessment`, `market_context`, `line_items[]` (with suggested rates), and `total_amount`.

### `Forge - Tradeoff Analysis`

- **Trigger**
  - Invoked when the user selects their primary concern (IP, Getting Paid, etc.) in Step 3.
- **What it does**
  1. Compares the legal jurisdictions of the freelancer and the client.
  2. Evaluates the specific payment structure and project deliverables.
  3. Proposes three distinct governing law options tailored to the user's primary concern.
- **When to use this flow**
  - To help users decide which country's laws should govern their services agreement.
- **Output**
  - An array of `options` containing `option_name`, `explanation`, `pros[]`, `cons[]`, and a `recommended` flag.

### `Forge - Contract Generation`

- **Trigger**
  - Invoked in Step 4 after the user confirms all pricing and legal choices.
- **What it does**
  1. Synthesizes every data point collected throughout the wizard.
  2. Generates a full 13-section Services Agreement including: Parties, Recitals, Scope, Timeline, Payment, IP, Confidentiality, Revisions, Late Payment, Termination, Governing Law, Dispute Resolution, and Signatures.
- **When to use this flow**
  - To create the final legal document for the engagement.
- **Output**
  - A detailed JSON record where each key is a section heading and the value contains the legal body text.

### `Forge - Invoice Generation`

- **Trigger**
  - Invoked simultaneously with or immediately after the contract generation.
- **What it does**
  1. Translates the confirmed line items and pricing from the contract into a standard invoice format.
  2. Adds professional headers, freelancer/client contact info, and payment instructions.
- **When to use this flow**
  - To generate the corresponding billable document for the project.
- **Output**
  - A formatted invoice JSON containing `freelancer`, `client`, `line_items[]`, `totals`, and `notes`.

---

## Guardrails
- **Legal Advice**: Forge must include a disclaimer that it is a decision-support tool, not a law firm.
- **PII Handling**: Personal details (names, emails) are processed but not persisted long-term in the vector store; they exist only in session memory.
- **Integrity**: Generated rates must be justified with market context to prevent arbitrary pricing.
- **Structure**: Contracts must never omit critical "kill clauses" like termination or IP ownership.

---

## Integration Reference

| Integration | Purpose | Config Key |
|---|---|---|
| Lamatic AgentKit | Orchestrates the 4 document/pricing flows | `NEXT_PUBLIC_FLOW_...` |
| LLM Provider | Synthesis of pricing, tradeoffs, and legal text | Configured in Lamatic Studio |
| PDF Engine | Client-side export of documents | `jsPDF` + `html2canvas` |
| Storage | Session management | `localStorage` |

---

## Environment Setup
- `NEXT_PUBLIC_FLOW_PRICING` — Flow ID for Pricing Analysis.
- `NEXT_PUBLIC_FLOW_TRADEOFF` — Flow ID for Tradeoff Analysis.
- `NEXT_PUBLIC_FLOW_CONTRACT` — Flow ID for Contract Synthesis.
- `NEXT_PUBLIC_FLOW_INVOICE` — Flow ID for Invoice Generation.
- `LAMATIC_API_KEY` — Server-only secret for authenticating flow calls.
- `NEXT_PUBLIC_LAMATIC_ENDPOINT` — Your project's GraphQL endpoint.
- `NEXT_PUBLIC_LAMATIC_PROJECT_ID` — Your Lamatic project ID.

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| "Failed to generate pricing" | Invalid field or missing country data | Ensure all Step 1 fields are filled. |
| "Governing law options empty" | Unsupported jurisdiction pair | Select a more standard country or manually input law. |
| PDF exports looking cut off | High resolution or layout shift during render | Ensure the preview container is fully loaded before clicking export. |
| 401 Unauthorized | Server-side proxy missing API Key | Check `LAMATIC_API_KEY` in `.env.local` or Vercel settings. |

---

## Notes
- This is a **Kit** contribution (`type: kit`) with a complete Next.js UI in the `apps/` directory.
- Live demo is linked in `lamatic.config.ts`: `https://forge-wheat-one.vercel.app/`
- All AI logic is externalized into Lamatic flows to keep the frontend light and maintainable.
- Future improvements include persistent document storage and automated email delivery of signed PDFs.
