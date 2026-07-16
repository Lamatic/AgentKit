# Compliance Copilot

## Overview
Compliance Copilot is an intelligent regulatory auditing agent built on Lamatic.ai. Given any unstructured document (such as a privacy policy, terms of service, or internal codebase rule) and a set of compliance guidelines, it produces a structured, evidence-grounded gap analysis report. It evaluates each requirement independently, flags it as Compliant, Partial, or Non-Compliant, and provides actionable remediation steps. 

## Purpose
Manual compliance auditing requires teams to cross-reference massive, dense policy documents against complex regulatory checklists. Compliance Copilot compresses this workflow from days to seconds. By using targeted prompts and forcing a strict JSON schema output, the agent provides instant visibility into compliance status without hallucinating evidence.

## Flows

### compliance-audit
- **Trigger:** API request (`graphqlNode`) receiving `documentText` and `guidelines`.
- **Processing:**
  1. The API trigger receives the raw unstructured text and the regulation rules.
  2. The `Diagnose` (`InstructorLLMNode`) takes both inputs and evaluates them using a strict system prompt. It is forced to return a JSON array matching a predefined schema.
  3. The `Response` (`graphqlResponseNode`) maps the generated JSON back to the caller.
- **When to use:** Whenever a new document is drafted, or when regulations change and existing policies need to be re-audited.
- **Output:** A JSON array of objects. Each object contains `{ requirement, status, analysis, remediation }`.
- **Dependencies:** A generative model on the `Diagnose` node capable of strict JSON output.

## Guardrails
- **Prohibited tasks:** No real-world actions (e.g., auto-updating privacy policies); no fabricated evidence. 
- **Input constraints:** All document text and guidelines are treated as untrusted input. The agent strictly evaluates the document against the provided guidelines only.
- **Output constraints:** Must output valid JSON. Every claim must trace directly back to the provided document. If evidence is missing or ambiguous, the agent must default to "Partial" or "Non-Compliant".

## Integration Reference
| Integration | Purpose | Required credential / config |
|---|---|---|
| GraphQL/API trigger | Receives document and guidelines payloads | Lamatic runtime endpoint |
| Generative model (`InstructorLLMNode`) | JSON-enforced document analysis | Model credentials in Studio |

## Environment Setup
- `COMPLIANCE_AUDIT` — deployed `compliance-audit` flow ID; required by the app.
- `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — Lamatic project credentials.

## Quickstart
1. Open Lamatic Studio and build the flow using an API Trigger → Generate JSON → API Response.
2. Use the system and user prompts provided in `prompts/`.
3. Deploy the flow and copy the Flow ID.
4. In `apps/`, copy `.env.example` → `.env.local` and fill in the Lamatic API credentials and Flow ID.
5. Run `npm install && npm run dev` to launch the Next.js UI dashboard.

## Common Failure Modes
| Symptom | Likely cause | Fix |
|---|---|---|
| "Missing environment variable" | Flow ID or credential not set | Fill in `.env.local` from `.env.example` |
| "Unexpected token '<', "<!doctype "... is not valid JSON" | The UI is trying to parse an HTML error page from the Lamatic SDK | Ensure your API URL is correct and points to the GraphQL endpoint, not a web page. |
| Malformed JSON parsing error | The Lamatic edge function returned stringified JSON (`str`) instead of a raw object | The Next.js frontend has been updated to automatically `JSON.parse()` stringified responses. Ensure you pull the latest code. |
