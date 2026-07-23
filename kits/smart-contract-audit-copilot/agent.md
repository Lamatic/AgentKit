# Smart Contract Audit Copilot

## Overview

Smart Contract Audit Copilot is a Solidity-focused audit assistant that helps developers perform a structured first-pass review of smart contract source code. It uses a Lamatic flow to inspect pasted code and returns categorized findings that a Next.js app renders into severity-aware audit cards.

## Purpose

The agent exists to make early smart contract review faster and more repeatable. Instead of asking a general chatbot to review Solidity code, developers get a consistent workflow with audit mode selection, security and gas taxonomies, structured output, remediation guidance, and a clear disclaimer about the limits of AI-assisted review.

## Flows

### smart-contract-audit

- Trigger: API request from the Next.js app.
- Inputs: `contractCode`, `auditMode`, optional `contractName`, optional `focusAreas`.
- Processing: a Lamatic LLM node applies Solidity audit prompts and produces a JSON report.
- Response: the flow returns `auditReport`, a JSON string containing summary, risk, confidence, categorized findings, remediations, and disclaimer.
- When to use: run this flow when a developer wants a first-pass review of Solidity source code before manual audit, testing, or remediation work.
- Output: structured audit report suitable for direct UI rendering.
- Dependencies: Lamatic runtime and a configured text generation model.

## Guardrails

- Do not state that a contract is secure, exploit-free, formally verified, or production-ready.
- Do not provide step-by-step exploit instructions against live third-party contracts.
- Do not assist with theft, malicious deployment, evasion, or concealment of vulnerabilities.
- Keep findings tied to submitted code evidence when possible.
- Include uncertainty when imports, inherited contracts, compiler settings, or deployment assumptions are missing.
- Always provide remediation guidance for flagged risks.
- Return valid JSON for app rendering.

## Integration Reference

The app calls Lamatic through `apps/lib/lamatic-client.ts` using the GraphQL `executeWorkflow` operation. The deployed flow ID is read from `SMART_CONTRACT_AUDIT_FLOW_ID`; Lamatic API credentials are read from `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY`.

## Environment Setup

| Variable | Purpose |
|---|---|
| `SMART_CONTRACT_AUDIT_FLOW_ID` | Deployed Lamatic flow ID for `smart-contract-audit`. |
| `LAMATIC_API_URL` | Lamatic project API endpoint. |
| `LAMATIC_PROJECT_ID` | Lamatic project identifier. |
| `LAMATIC_API_KEY` | API key used to invoke the flow. |

Provider credentials for the selected LLM are configured inside Lamatic Studio.

## Quickstart

1. Import `flows/smart-contract-audit.ts` into Lamatic Studio.
2. Configure the model for `Generate Audit Report`.
3. Deploy the flow and copy its flow ID.
4. Create `apps/.env.local` from `apps/.env.example`.
5. Run `npm install` inside `apps/`.
6. Run `npm run dev` and open `http://localhost:3000`.
7. Paste Solidity code, select an audit mode, and run the audit.

## Common Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| App says a Lamatic env var is missing | `.env.local` is incomplete | Copy `apps/.env.example` and set all four variables. |
| Flow returns no report | The deployed flow ID is wrong or not deployed | Redeploy the flow and update `SMART_CONTRACT_AUDIT_FLOW_ID`. |
| JSON parsing fails | The model returned markdown or prose instead of JSON | Strengthen the prompt in Lamatic Studio and rerun. |
| Findings look generic | Submitted code is too short or missing imports | Provide the complete contract and relevant dependencies. |
| The report has low confidence | Required context is absent | Add compiler version, imported contracts, deployment assumptions, and focus areas. |

## Operational Limits

This agent is a triage assistant. It does not execute code, inspect bytecode, simulate transactions, run a fuzzer, or provide formal verification. It should be used as an early review layer before a complete manual audit and test suite.
