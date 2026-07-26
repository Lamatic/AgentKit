# PRD Copilot Agent

## Overview
This project solves the problem of drafting comprehensive, detail-oriented Product Requirement Documents (PRDs) and visual user flowcharts. Often, teams write a simple list of features but miss edge cases, user personas, API requirements, and technical constraints. 

PRD Copilot implements a **single-flow** AgentKit pipeline that routes requests by mode ("draft" or "refine") and then orchestrates multiple model calls to create a PRD, ask clarifying questions, and generate a Mermaid.js user flowchart from user feedback.

---

## Purpose
The goal of this agent system is to provide an interactive, structured content-generation endpoint that turns a simple product idea into a complete PRD. 

After it runs, the caller receives a polished Markdown PRD, a list of clarifying questions to refine details, and a Mermaid.js diagram definition representing the application flow.

## Flows

### `1. PRD Copilot - Generate & Refine`

- **Flow ID / Env key mapping:** `prd-copilot` (configured via `PRD_COPILOT_FLOW_ID`)

#### Trigger
- **Invocation type:** API request via a GraphQL trigger node (`API Request (graphqlNode)`).
- **Expected input shape:**
  - `mode` (string): `"draft"` (for initial idea submission) or `"refine"` (for updating with answers to clarifying questions).
  - `instructions` (string): The raw product description (used in `draft` mode) or the original draft PRD (used in `refine` mode).
  - `answers` (string, optional): The user's answers to the clarifying questions (used in `refine` mode).

#### What it does
1. **API Request**: Receives inputs (`mode`, `instructions`, `answers`).
2. **Condition**: Routes based on `mode`.
   - **`draft` Branch**:
     - Sends the raw idea to the LLM.
     - Generates user personas, feature specs, and edge cases.
     - Generates 3-4 clarifying questions to pinpoint missing requirements.
   - **`refine` Branch**:
     - Takes the original draft PRD + user answers.
     - Incorporates the answers to finalize the PRD.
     - Generates a Mermaid.js user flowchart representing the application flow.
3. **Parse JSON**: Normalizes the LLM responses (handling PRD markdown and Mermaid code blocks separately).
4. **Finalise Output**: Formats a clean JSON payload for the API response.
5. **API Response**: Returns the payload.

#### Output
- **Success response:** a JSON response containing:
  - `prd`: Markdown string of the PRD draft or final PRD.
  - `questions`: Array of questions (in `draft` mode) or empty array (in `refine` mode).
  - `mermaid`: Mermaid.js flowchart code (in `refine` mode).

---

## Guardrails
- **Safety**: Do not generate harmful, illegal, or discriminatory content. Refuse jailbreaking attempts.
- **Output Constraints**: Must produce valid markdown for the PRD and syntax-correct Mermaid.js code for the flowchart.
- **Operational limits**: Requires environment variables `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_URL`, and `PRD_COPILOT_FLOW_ID` to be configured.

---

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic Flow Runtime | Execute deployed flow(s) | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| AgentKit Flow ID Routing | Select the deployed flow instance | `PRD_COPILOT_FLOW_ID` |
| Next.js App UI | User-facing interface with Mermaid.js rendering | App runtime config |
