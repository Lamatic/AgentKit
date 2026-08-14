# Agent: ADR Copilot (Architecture Decision Record Agent)

## Overview

ADR Copilot is an AI engineering agent built on Lamatic.ai. It converts raw technical design proposals, RFC drafts, Slack discussions, or feature specs into standardized Markdown Architecture Decision Records (MADR 3.0). It evaluates architectural alternatives, analyzes pros and cons, extracts decision drivers, models system component interactions with Mermaid diagrams, and surfaces operational risks.

## Purpose

Documenting software architecture decisions is vital for long-term project health, onboarding, and technical alignment. However, developers frequently skip creating ADRs due to time constraints or documentation friction. ADR Copilot eliminates this friction by providing instant, high-quality, standardized MADR decision documents from unstructured design notes.

## Flows

### 1. `adr-copilot`

- **Trigger**: `API Request` synchronous realtime endpoint.
- **Processing**:
  - Receives engineering `instructions` and optional `constraints`.
  - Invokes `Architect LLM` with specialized system & user prompts (`@prompts/adr-copilot_system.md`, `@prompts/adr-copilot_user.md`).
  - Passes generated response to `Parse JSON` script (`@scripts/adr-copilot_parse-json.ts`).
  - Passes parsed object to `Finalise Output` script (`@scripts/adr-copilot_finalise-output.ts`).
  - Returns structured answer mapping through `API Response` node.
- **Output**: JSON payload containing `markdownContent`, `title`, `adrNumber`, `status`, `decisionDrivers`, `consideredOptions`, `chosenOption`, `consequences`, and `mermaidDiagram`.

## Guardrails

- Upholds MADR 3.0 structural rules.
- Enforces strict objectivity in technical trade-off evaluation.
- Never outputs sensitive credentials or hardcoded keys.
- Operates under default constitution at `@constitutions/default.md`.

## Integration Reference

- **Lamatic API Runtime**: Flow execution & orchestration.
- **Text Generation LLM**: High-reasoning chat model for trade-off evaluation.

## Environment Setup

Required environment variables for application invocation:

- `LAMATIC_API_KEY`: API authentication key from Lamatic Studio (Settings → API Keys).
- `LAMATIC_PROJECT_ID`: Project ID from Lamatic Studio (Settings → Project).
- `LAMATIC_API_URL`: Lamatic API endpoint URL.
- `LAMATIC_FLOW_ID`: Deployed flow ID for `adr-copilot`.

## Quickstart

1. Deploy the `adr-copilot` flow in Lamatic Studio.
2. Copy your API credentials and Flow ID into `kits/adr-copilot/apps/.env.local`.
3. Run `npm install && npm run dev` inside `kits/adr-copilot/apps/`.
4. Submit a technical proposal to generate an ADR.

## Common Failure Modes

| Symptom                          | Cause                                                | Solution                                                      |
| -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| Flow returns raw unparsed string | LLM emitted non-JSON text wrapper                    | Fallback parser wraps content gracefully; check prompt tuning |
| API call returns 401             | Invalid or missing `LAMATIC_API_KEY`                 | Verify API key in `.env.local`                                |
| Flow ID not found                | `LAMATIC_FLOW_ID` unset or non-deployed flow ID used | Deploy flow in Studio and update environment variable         |
