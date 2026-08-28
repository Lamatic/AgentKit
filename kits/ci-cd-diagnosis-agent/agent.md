# CI/CD Diagnosis Agent

## Overview

The CI/CD Diagnosis Agent is an AI-powered multi-agent system that analyses GitHub Actions and GitLab CI/CD pipeline failure logs. It orchestrates 10 specialised AI agents through a Lamatic AgentKit DAG to produce a structured, verified diagnosis containing the root cause, an actionable fix, and a risk assessment — in under 30 seconds.

## Purpose

Developers lose hours deciphering cryptic CI/CD logs. This agent automates the entire diagnostic process: it cleans noise, extracts evidence, classifies errors, consults a domain-specific knowledge base (RAG), deduces the root cause, generates a fix, adversarially verifies the fix, and assesses risk — all without human intervention.

## Flow: CICD Diagnosis

### Trigger

The synchronous API Request accepts a raw CI/CD log (`logContent`) and the CI platform (`ciProvider`: `github` or `gitlab`).

### Processing

The 10-node DAG processes the log through the following agents in sequence:

1. **Log Cleaner (Code Node):** Strips timestamps, boilerplate, and redacts secrets via regex.
2. **Evidence Extractor (LLM):** Isolates exact verbatim failure strings (stack traces, exit codes).
3. **Error Classifier (LLM):** Maps evidence to a strict taxonomy (Dependency, Network, Permissions, etc.).
4. **Planner (LLM):** Formulates targeted RAG search queries based on the classification.
5. **Knowledge Retrieval (RAG Node):** Executes hybrid semantic + keyword search over the domain knowledge base.
6. **Root Cause Analyzer (LLM):** Synthesises evidence and retrieved knowledge to deduce the mechanical failure.
7. **Fix Generator (LLM):** Produces executable code snippets or configuration changes.
8. **Fix Verifier (LLM):** Adversarially validates that the fix addresses the root cause.
9. **Risk Reviewer (LLM):** Assesses the fix for security or stability risks.
10. **Output Formatter (Code Node):** Serialises the complete pipeline state into a strict JSON API response.

### Response

The API Response exposes:

- `classification` — Error category and confidence score.
- `analysis` — Root cause summary with verbatim evidence citations.
- `resolution` — Verified code fixes with syntax-highlighted snippets.
- `risk` — Risk level (Low / Medium / High) and security warnings.

### When to Use

Use this agent whenever a GitHub Actions or GitLab CI pipeline fails. It is most effective for:
- Dependency management failures (npm, pip, maven)
- Docker build and runtime failures
- Infrastructure-as-code errors (Terraform)
- Permission and authentication failures
- Network and DNS connectivity issues
- GitHub Actions YAML configuration errors

### Dependencies

- Lamatic synchronous API runtime
- Google Gemini API (configured as the LLM model in the flow)
- A populated RAG Knowledge Base (see `knowledge/` directory)
- The companion Next.js app (`apps/`) for the web interface

## Guardrails

- Never invent log lines not present in the original input.
- Never assume technologies not explicitly mentioned in the evidence.
- Never generate a fix before completing the Root Cause Analysis.
- Never output a fix that introduces `rm -rf`, wildcard IAM policies, or exposed secrets without flagging it as High Risk.
- Always cite exact log lines as evidence for every conclusion.
- Always output valid JSON matching the declared API schema.

## Integration Reference

| Service | Purpose | Credential |
|---|---|---|
| Lamatic API | Executes the deployed diagnosis flow | `LAMATIC_API_KEY` |
| Lamatic project | Selects the project runtime | `LAMATIC_PROJECT_ID`, `LAMATIC_API_URL` |
| Deployed flow | Selects the diagnosis workflow | `CICD_DIAGNOSIS_FLOW_ID` |
| Google Gemini | Powers LLM reasoning (configured in Lamatic) | Stored in Lamatic, never in the app |

## Environment Setup

| Variable | Required | Source | Purpose |
|---|:---:|---|---|
| `LAMATIC_API_KEY` | Yes | Lamatic Settings → API Keys | Authenticates server-side flow execution |
| `LAMATIC_PROJECT_ID` | Yes | Lamatic project settings | Identifies the deployed project |
| `LAMATIC_API_URL` | Yes | Lamatic API Docs | Base endpoint for the project runtime |
| `CICD_DIAGNOSIS_FLOW_ID` | Yes | Flow menu → Copy Flow ID | Identifies the deployed diagnosis flow |

## Quickstart

1. Deploy the Lamatic flow (see `docs/lamatic-workflow.md` for node configuration).
2. Copy `apps/.env.example` to `apps/.env.local`.
3. Fill in the four required Lamatic values.
4. Run `npm install` from the `apps/` directory.
5. Run `npm run dev` and open `http://localhost:3000`.
6. Upload one of the example logs from `examples/` to test the system.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| "Agent is not configured" | Missing environment variables | Compare `.env.local` with `.env.example` |
| Authentication error (401) | Invalid or expired `LAMATIC_API_KEY` | Generate a new key in Lamatic Settings |
| Empty diagnosis / low confidence | RAG knowledge base is not populated | Follow `docs/knowledge-architecture.md` to index documents |
| Slow response (>45s) | Large log file hitting token limits | Reduce log to last 5,000 lines and retry |
| Risk level always "Unknown" | Risk Reviewer node misconfigured | Verify node output schema in Lamatic Studio |
