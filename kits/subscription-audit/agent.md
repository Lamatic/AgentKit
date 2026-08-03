# Subscription Audit Kit

## Overview

This kit provides an AI-powered financial utility that analyzes raw bank statements and transaction exports to identify and evaluate recurring subscriptions. It implements a Lamatic AgentKit pipeline that processes unstructured financial text, flags likely recurring charges, and returns a structured JSON payload with recommendations on whether to keep, review, or cancel each subscription. The primary invoker is a Next.js web UI that calls the flow via Lamatic's API layer and renders the results as interactive cards.

---

## Purpose

The goal of this agent system is to help users regain control over their recurring expenses without manually combing through hundreds of bank transactions. By leveraging LLMs to parse and understand natural language transaction descriptions, the system accurately distinguishes between one-off purchases (like a coffee) and recurring subscriptions (like Netflix or a gym membership), outputting a machine-consumable JSON list.

This kit centralizes the extraction and evaluation logic into one deployed Lamatic flow, allowing the prompt engineering and JSON schema validation to occur in Lamatic Studio, keeping the Next.js frontend thin and focused purely on display.

## Flows

### `1. Subscription Audit - Generate JSON`

- **Flow ID / Env key mapping:** `subscription-audit` (configured via `SUBSCRIPTION_AUDIT`)

#### Trigger

- **Invocation type:** API request via a GraphQL trigger node (`API Request (graphqlNode)`).
- **Expected input shape:**
  - `statement_text` (string): the raw text export of the user's bank statement or transactions.

#### What it does

Step-by-step walkthrough of the node chain:

1. `API Request (graphqlNode)`
   - Receives the GraphQL/API payload containing the `statement_text`.

2. `JSON (LLMNode)`
   - Analyzes the provided statement text to identify subscriptions.
   - Extracts merchant name, amount, and frequency.
   - Evaluates each subscription to provide a "keep", "cancel", or "review" verdict with a brief reason.
   - Uses prompt pair:
     - System: `subscription-audit_generate-json_system.md`
     - User: `subscription-audit_generate-json_user.md` (`statement_text: {{triggerNode_1.output.statement_text}}`)

3. `API Response (graphqlResponseNode)`
   - Returns the structured `{ "subscriptions": [...] }` payload back to the Next.js UI.

#### Output

- **Success response:** a JSON response containing the subscriptions array.
- **Structure (conceptual):**
  - `subscriptions`: Array of objects containing:
    - `merchant` (string): Name of the subscription service.
    - `amount` (number/string): The cost of the subscription.
    - `frequency` (string): How often it is billed (e.g., Monthly, Annually).
    - `verdict` (string): "keep", "cancel", or "review".
    - `reason` (string): A short, plain-language explanation for the verdict.

#### Dependencies

- **Lamatic runtime & project configuration**
  - `LAMATIC_API_URL`
  - `LAMATIC_PROJECT_ID`
  - `LAMATIC_API_KEY`
- **Flow selection / routing**
  - `SUBSCRIPTION_AUDIT` (the deployed Flow ID)
- **Model providers** (configured in Lamatic Studio)
  - LLM provider for the Generate JSON node (e.g., Gemini Flash Lite)
- **Prompts**
  - `subscription-audit_generate-json_system.md`
  - `subscription-audit_generate-json_user.md`

## Guardrails

- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content.
  - Must not provide certified financial advice; the verdicts are AI suggestions, not fiduciary guidance.
- **Data Handling & Privacy (Financial Data)**
  - This flow processes sensitive financial information (bank statements).
  - Must not log, store, or train models on user transaction data.
  - Must not output or extract Personally Identifiable Information (PII) like account numbers, SSNs, or names. The focus is strictly on merchant names and amounts.
- **Output constraints**
  - Must return valid, parseable JSON strictly adhering to the schema.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic Flow Runtime (API) | Execute deployed flow(s) and access Lamatic project resources | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| AgentKit Flow ID Routing | Select the deployed flow instance for this kit | `SUBSCRIPTION_AUDIT` |
| LLM Provider (via Lamatic) | Generate the structured JSON output | Configured in Lamatic Studio |
| Next.js App (UI) | User-facing interface to paste statements and view results | App runtime config; consumes env vars above |

## Environment Setup

1. `SUBSCRIPTION_AUDIT` — Deployed Flow ID for `subscription-audit`; obtain from Lamatic Studio after deploying the kit.
2. `LAMATIC_API_URL` — Base URL for Lamatic API.
3. `LAMATIC_PROJECT_ID` — Lamatic project identifier.
4. `LAMATIC_API_KEY` — API key for accessing the Lamatic project.

## Quickstart

1. In Lamatic Studio, create a project and deploy the "Subscription Audit" agent kit flow.
2. In `apps/`, create `.env.local` from `.env.example` and set the required variables.
3. Install dependencies: `cd apps && npm install --legacy-peer-deps`
4. Run the app: `npm run dev -- --webpack`
5. Open `http://localhost:3000` in your browser.
6. Paste a sample bank statement into the textarea and click "Audit Now" to see the extracted subscriptions.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Request fails with 401/403 | Missing or incorrect `LAMATIC_API_KEY` | Re-copy keys from Lamatic Studio; ensure project matches |
| Flow not found / 404 | `SUBSCRIPTION_AUDIT` not set or incorrect | Deploy flow in Lamatic; update `.env.local` |
| "Failed to audit subscriptions" | Model failed to return valid JSON or encountered rate limits | Check Lamatic Studio logs for model errors |
| No subscriptions found | The provided text was too short or lacked clear recurring patterns | Try providing a larger, more realistic statement sample |
